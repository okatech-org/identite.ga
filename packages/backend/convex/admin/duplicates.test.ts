/// <reference types="vite/client" />
import { register as registerAggregate } from "@convex-dev/aggregate/test"
import { register as registerBetterAuth } from "@convex-dev/better-auth/test"
import { convexTest } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { api } from "../_generated/api"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")

/**
 * CE QUI EST EN JEU : cette vue désigne des comptes à supprimer. Un faux
 * positif y coûte le compte d'un citoyen innocent — deux homonymes nés à des
 * dates différentes ne sont PAS la même personne, et la clé de rapprochement
 * doit rester le triplet complet (nom, prénom, date de naissance).
 *
 * Symétriquement, un faux négatif rend la vue inutile : « Jean MBADINGA » et
 * « jean  mbadinga » sont la même inscription saisie deux fois, la casse et
 * les espaces ne doivent pas les séparer.
 */

const ADMIN = "admin_1"

vi.mock("../lib/auth", async () => {
  const { ConvexError: CE } = await import("convex/values")
  return {
    requireAdmin: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
    }) => {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity?.subject.startsWith("admin_")) {
        throw new CE({ code: "FORBIDDEN", message: "Accès refusé." })
      }
      return {
        userId: identity.subject,
        email: `${identity.subject}@example.ga`,
        emailVerified: true,
        roles: ["admin"],
      }
    },
  }
})

function makeTestClient() {
  const t = convexTest(schema, modules)
  registerAggregate(t, "kycByStatus")
  registerAggregate(t, "usersByLoa")
  registerAggregate(t, "usersByProfile")
  registerBetterAuth(t)
  return t
}

async function seedProfile(
  t: ReturnType<typeof convexTest>,
  opts: {
    userId: string
    firstName?: string
    lastName?: string
    dateOfBirth?: string
    pivot?: false
    deleted?: boolean
  },
) {
  const now = Date.now()
  await t.run(async (ctx) => {
    await ctx.db.insert("userProfile", {
      userId: opts.userId,
      profileType: "citizen",
      loa: 2,
      pivot:
        opts.pivot === false
          ? undefined
          : {
              firstName: opts.firstName ?? "Jean",
              lastName: opts.lastName ?? "Mbadinga",
              dateOfBirth: opts.dateOfBirth ?? "1990-01-02",
              gender: "M" as const,
              birthPlace: "Libreville",
              nationality: "GA",
            },
      deletedAt: opts.deleted ? now : undefined,
      createdAt: now,
      updatedAt: now,
    })
  })
}

describe("détection des comptes en double", () => {
  test("regroupe malgré la casse et les espaces, sépare sur la date de naissance", async () => {
    // POURQUOI : la clé métier est le triplet complet. Rapprocher sur le seul
    // nom ferait apparaître deux homonymes comme un doublon — et cette vue
    // sert à décider lequel supprimer.
    const t = makeTestClient()
    await seedProfile(t, { userId: "u1", firstName: "Jean", lastName: "MBADINGA" })
    await seedProfile(t, { userId: "u2", firstName: "jean ", lastName: "mbadinga" })
    // Même identité, autre date de naissance : personne différente.
    await seedProfile(t, {
      userId: "u3",
      firstName: "Jean",
      lastName: "Mbadinga",
      dateOfBirth: "1985-06-11",
    })

    const { groups } = await t
      .withIdentity({ subject: ADMIN })
      .query(api.admin.duplicates.listDuplicateGroups, {})

    expect(groups).toHaveLength(1)
    expect(groups[0]!.accounts.map((a) => a.userId).sort()).toEqual([
      "u1",
      "u2",
    ])
    expect(groups[0]!.dateOfBirth).toBe("1990-01-02")
  })

  test("regroupe malgré les accents", async () => {
    // POURQUOI : l'état civil gabonais est saisi tantôt accentué, tantôt non.
    // « Ndong » et « Ndòng » désignent la même personne ; les traiter comme
    // deux identités laisserait passer le doublon qu'on cherche.
    const t = makeTestClient()
    await seedProfile(t, { userId: "a1", firstName: "Hélène", lastName: "Ndong" })
    await seedProfile(t, { userId: "a2", firstName: "Helene", lastName: "Ndong" })

    const { groups } = await t
      .withIdentity({ subject: ADMIN })
      .query(api.admin.duplicates.listDuplicateGroups, {})

    expect(groups).toHaveLength(1)
    expect(groups[0]!.accounts).toHaveLength(2)
  })

  test("ignore les comptes anonymisés et ceux sans identité pivot", async () => {
    // POURQUOI : un compte anonymisé n'a plus de pivot à comparer, et un LoA 1
    // qui n'a jamais renseigné son identité n'est comparable à rien. Les faire
    // remonter proposerait à l'admin de supprimer des comptes sur la foi d'une
    // comparaison qui n'a pas eu lieu.
    const t = makeTestClient()
    await seedProfile(t, { userId: "v1" })
    await seedProfile(t, { userId: "v2", deleted: true })
    await seedProfile(t, { userId: "v3", pivot: false })

    const { groups } = await t
      .withIdentity({ subject: ADMIN })
      .query(api.admin.duplicates.listDuplicateGroups, {})

    expect(groups).toHaveLength(0)
  })

  test("le badge sidebar compte les groupes, pas les comptes", async () => {
    // POURQUOI : trois inscriptions du même individu forment UN dossier à
    // arbitrer, pas trois. Un badge qui compte les comptes surestimerait la
    // charge de travail et deviendrait du bruit.
    const t = makeTestClient()
    await seedProfile(t, { userId: "c1" })
    await seedProfile(t, { userId: "c2" })
    await seedProfile(t, { userId: "c3" })
    await seedProfile(t, { userId: "c4", lastName: "Obame" })
    await seedProfile(t, { userId: "c5", lastName: "Obame" })

    const count = await t
      .withIdentity({ subject: ADMIN })
      .query(api.admin.duplicates.duplicateGroupCount, {})

    expect(count).toBe(2)
  })

  test("la vue est réservée aux administrateurs", async () => {
    const t = makeTestClient()
    await seedProfile(t, { userId: "w1" })
    await expect(
      t
        .withIdentity({ subject: "citizen_1" })
        .query(api.admin.duplicates.listDuplicateGroups, {}),
    ).rejects.toThrow(/refusé/)
  })
})
