/// <reference types="vite/client" />
import { register as registerAggregate } from "@convex-dev/aggregate/test"
import { register as registerBetterAuth } from "@convex-dev/better-auth/test"
import { ConvexError } from "convex/values"
import { convexTest } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { api } from "../_generated/api"
import schema from "../schema"
import { assessIdentityCollision } from "./duplicateGuard"
import { derivePivotKeys } from "./identity"

const modules = import.meta.glob("/convex/**/*.ts")

/**
 * CE QUI EST EN JEU : ce contrôle est le seul obstacle à l'ouverture de
 * plusieurs comptes par une même personne — l'adresse @idn.ga étant fabriquée
 * par l'utilisateur lui-même, l'email n'en est pas un.
 *
 * Il coupe dans les deux sens. Trop strict, il barre l'accès à ses droits à un
 * homonyme réel, ou permet à n'importe qui de squatter l'état civil d'un tiers
 * pour l'empêcher de s'inscrire. Trop laxiste, il ne sert à rien. D'où la
 * règle asymétrique que ces tests verrouillent : on ne refuse que face à une
 * identité DÉJÀ VÉRIFIÉE par un KYC ; une identité seulement déclarée est
 * signalée à un humain, jamais opposée.
 */

vi.mock("./auth", async () => {
  const { ConvexError: CE } = await import("convex/values")
  const authUser = async (ctx: {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
  }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new CE({ code: "UNAUTHENTICATED", message: "Connexion requise." })
    }
    return {
      userId: identity.subject,
      email: `${identity.subject}@idn.ga`,
      emailVerified: true,
      roles: [],
    }
  }
  return {
    requireAuth: authUser,
    requireVerifiedAuth: authUser,
    getCurrentAuthUser: authUser,
    requireAdmin: authUser,
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

const PIVOT = {
  firstName: "Jean",
  lastName: "Mbadinga",
  dateOfBirth: "1990-01-02",
  gender: "M" as const,
  birthPlace: "Libreville",
  nationality: "GA",
}

async function seedProfile(
  t: ReturnType<typeof convexTest>,
  opts: {
    userId: string
    loa: 1 | 2 | 3
    firstName?: string
    lastName?: string
    nip?: string
    deleted?: boolean
  },
) {
  const now = Date.now()
  const pivot = {
    ...PIVOT,
    firstName: opts.firstName ?? PIVOT.firstName,
    lastName: opts.lastName ?? PIVOT.lastName,
    ...(opts.nip ? { nip: opts.nip } : {}),
  }
  await t.run(async (ctx) => {
    await ctx.db.insert("userProfile", {
      userId: opts.userId,
      profileType: "citizen",
      loa: opts.loa,
      pivot,
      ...derivePivotKeys(pivot),
      deletedAt: opts.deleted ? now : undefined,
      createdAt: now,
      updatedAt: now,
    })
  })
}

describe("évaluation d'une collision d'identité", () => {
  test("une identité vérifiée ferme la porte", async () => {
    const t = makeTestClient()
    await seedProfile(t, { userId: "verifie", loa: 2 })

    const verdict = await t.run(async (ctx) =>
      assessIdentityCollision(ctx, {
        pivotKey: derivePivotKeys(PIVOT).pivotKey,
      }),
    )
    expect(verdict.verdict).toBe("refuse")
    expect(verdict.blockedBy).toBe("pivot")
  })

  test("une identité seulement déclarée est signalée, pas opposée", async () => {
    // POURQUOI : rien n'est vérifié en LoA 1. Refuser ici rendrait triviale
    // l'exclusion d'un citoyen — il suffirait de s'inscrire à son nom avant lui.
    const t = makeTestClient()
    await seedProfile(t, { userId: "declaratif", loa: 1 })

    const verdict = await t.run(async (ctx) =>
      assessIdentityCollision(ctx, {
        pivotKey: derivePivotKeys(PIVOT).pivotKey,
      }),
    )
    expect(verdict.verdict).toBe("flag")
    expect(verdict.matches.map((m) => m.userId)).toEqual(["declaratif"])
  })

  test("un compte anonymisé ne bloque plus personne", async () => {
    // POURQUOI : la personne qui a exercé son droit à l'effacement doit
    // pouvoir se réinscrire. Sinon la suppression de compte se retourne en
    // bannissement à vie.
    const t = makeTestClient()
    await seedProfile(t, { userId: "efface", loa: 2, deleted: true })

    const verdict = await t.run(async (ctx) =>
      assessIdentityCollision(ctx, {
        pivotKey: derivePivotKeys(PIVOT).pivotKey,
      }),
    )
    expect(verdict.verdict).toBe("allow")
  })

  test("on ne se bloque pas soi-même", async () => {
    // POURQUOI : c'est ce qui rend possible la correction d'une faute de
    // frappe par un citoyen déjà vérifié.
    const t = makeTestClient()
    await seedProfile(t, { userId: "moi", loa: 3 })

    const verdict = await t.run(async (ctx) =>
      assessIdentityCollision(ctx, {
        pivotKey: derivePivotKeys(PIVOT).pivotKey,
        excludeUserId: "moi",
      }),
    )
    expect(verdict.verdict).toBe("allow")
  })

  test("le NIP d'un compte vérifié bloque, et le motif est attribué au NIP", async () => {
    // POURQUOI : le message rendu au citoyen doit désigner la bonne cause —
    // on ne lui demande pas de corriger son état civil quand c'est son numéro
    // qui pose problème.
    const t = makeTestClient()
    await seedProfile(t, {
      userId: "porteur_nip",
      loa: 2,
      lastName: "Autre",
      nip: "GA12345678ABCD",
    })

    const verdict = await t.run(async (ctx) =>
      assessIdentityCollision(ctx, { nipKey: "ga12345678abcd".toUpperCase() }),
    )
    expect(verdict.verdict).toBe("refuse")
    expect(verdict.blockedBy).toBe("nip")
  })
})

describe("garde sur la modification du profil", () => {
  test("réécrire son pivot vers l'identité d'un compte vérifié est refusé", async () => {
    // POURQUOI : sans cette garde, le contrôle du signup se contourne en deux
    // temps — s'inscrire sous une identité quelconque, puis la corriger vers
    // l'identité visée.
    const t = makeTestClient()
    await seedProfile(t, { userId: "cible", loa: 2 })
    await seedProfile(t, {
      userId: "fraudeur",
      loa: 1,
      firstName: "Paul",
      lastName: "Nzé",
    })

    await expect(
      t
        .withIdentity({ subject: "fraudeur" })
        .mutation(api.profile.updatePivot, {
          firstName: PIVOT.firstName,
          lastName: PIVOT.lastName,
          dateOfBirth: PIVOT.dateOfBirth,
          gender: "M",
          birthPlace: "Libreville",
          nationality: "GA",
        }),
    ).rejects.toThrow(ConvexError)
  })

  test("corriger sa propre identité reste possible pour un compte vérifié", async () => {
    // POURQUOI : c'est le parcours légitime le plus courant (faute de frappe
    // sur un patronyme). Le casser rendrait la garde inacceptable.
    const t = makeTestClient()
    await seedProfile(t, { userId: "citoyen", loa: 2 })

    await t.withIdentity({ subject: "citoyen" }).mutation(api.profile.updatePivot, {
      firstName: PIVOT.firstName,
      lastName: "Mbadingua", // correction
      dateOfBirth: PIVOT.dateOfBirth,
      gender: "M",
      birthPlace: "Libreville",
      nationality: "GA",
    })

    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", "citoyen"))
        .unique(),
    )
    expect(profile?.pivot?.lastName).toBe("Mbadingua")
    // La clé suit la modification, sinon l'index part en dérive silencieuse.
    expect(profile?.pivotKey).toBe(
      derivePivotKeys({ ...PIVOT, lastName: "Mbadingua" }).pivotKey,
    )
  })

  test("un NIP déjà porté par un compte vérifié est refusé", async () => {
    const t = makeTestClient()
    await seedProfile(t, {
      userId: "porteur",
      loa: 2,
      lastName: "Autre",
      nip: "GA12345678ABCD",
    })
    await seedProfile(t, { userId: "demandeur", loa: 1, firstName: "Paul" })

    await expect(
      t
        .withIdentity({ subject: "demandeur" })
        .mutation(api.profile.updateNip, { nip: "ga12345678abcd" }),
    ).rejects.toThrow(ConvexError)
  })

  test("un NIP porté par un compte déclaratif passe et ouvre un dossier", async () => {
    const t = makeTestClient()
    await seedProfile(t, {
      userId: "porteur",
      loa: 1,
      lastName: "Autre",
      nip: "GA12345678ABCD",
    })
    await seedProfile(t, { userId: "demandeur", loa: 1, firstName: "Paul" })

    await t
      .withIdentity({ subject: "demandeur" })
      .mutation(api.profile.updateNip, { nip: "GA12345678ABCD" })

    const flags = await t.run(async (ctx) =>
      ctx.db
        .query("duplicateSignal")
        .withIndex("by_userId", (q) => q.eq("userId", "demandeur"))
        .collect(),
    )
    expect(flags).toHaveLength(1)
    expect(flags[0]!.signal).toBe("nip")
    expect(flags[0]!.matchedUserId).toBe("porteur")
    expect(flags[0]!.status).toBe("open")
  })

  test("le même dossier n'est pas rouvert à chaque nouvelle tentative", async () => {
    // POURQUOI : une file de revue qui se remplit de duplicatas est une file
    // qu'on cesse de lire.
    const t = makeTestClient()
    await seedProfile(t, {
      userId: "porteur",
      loa: 1,
      lastName: "Autre",
      nip: "GA12345678ABCD",
    })
    await seedProfile(t, { userId: "demandeur", loa: 1, firstName: "Paul" })

    const asUser = t.withIdentity({ subject: "demandeur" })
    await asUser.mutation(api.profile.updateNip, { nip: "GA12345678ABCD" })
    await asUser.mutation(api.profile.updateNip, { nip: "GA12345678ABCD" })

    const flags = await t.run(async (ctx) =>
      ctx.db
        .query("duplicateSignal")
        .withIndex("by_userId", (q) => q.eq("userId", "demandeur"))
        .collect(),
    )
    expect(flags).toHaveLength(1)
  })
})
