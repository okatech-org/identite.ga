/// <reference types="vite/client" />
import { register as registerAggregate } from "@convex-dev/aggregate/test"
import { register as registerBetterAuth } from "@convex-dev/better-auth/test"
import { convexTest } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { api, components } from "../_generated/api"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")

/**
 * CE QUI EST EN JEU : la console admin chargeait toute la liste des comptes
 * d'un bloc, tronquée à 50. Passé ce seuil, les comptes suivants étaient
 * purement invisibles — un citoyen inscrit en 51e position n'existait pas
 * pour l'administration. La pagination doit donc rendre TOUS les comptes
 * atteignables, pas seulement en afficher moins à la fois.
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

/** `n` citoyens, créés à des instants croissants. */
async function seedMany(t: ReturnType<typeof convexTest>, n: number) {
  const base = Date.parse("2026-01-01T00:00:00Z")
  await t.run(async (ctx) => {
    for (let i = 0; i < n; i++) {
      const email = `citoyen${i}@idn.ga`
      const created = (await ctx.runMutation(
        components.betterAuth.adapter.create,
        {
          input: {
            model: "user",
            data: {
              email,
              name: email,
              emailVerified: true,
              createdAt: base + i,
              updatedAt: base + i,
            },
          },
        },
      )) as { _id: string }
      await ctx.db.insert("userProfile", {
        userId: created._id,
        profileType: "citizen",
        loa: 1,
        idnId: `GA-0000-${String(i).padStart(4, "0")}`,
        pivot: {
          firstName: `Prénom${i}`,
          lastName: `Nom${i}`,
          dateOfBirth: "1990-01-02",
          gender: "M" as const,
          birthPlace: "Libreville",
          nationality: "GA",
        },
        createdAt: base + i,
        updatedAt: base + i,
      })
    }
  })
}

describe("liste paginée des comptes IDN", () => {
  test("toute la population reste atteignable page après page", async () => {
    // POURQUOI : c'est la régression qu'on corrige. Une pagination qui
    // afficherait 10 comptes sans permettre d'atteindre les suivants ne
    // vaudrait pas mieux que la troncature qu'elle remplace.
    const t = makeTestClient()
    await seedMany(t, 60)
    const asAdmin = t.withIdentity({ subject: ADMIN })

    const seen = new Set<string>()
    const first = await asAdmin.query(api.admin.users.listProfiles, {
      page: 0,
      pageSize: 10,
    })
    expect(first.pageCount).toBe(6)
    expect(first.total).toBe(60)

    for (let p = 0; p < first.pageCount; p++) {
      const res = await asAdmin.query(api.admin.users.listProfiles, {
        page: p,
        pageSize: 10,
      })
      expect(res.rows).toHaveLength(10)
      for (const r of res.rows) seen.add(r.userId)
    }

    expect(seen.size).toBe(60)
  })

  test("un numéro de page hors bornes retombe sur la dernière page", async () => {
    // POURQUOI : la console laisse saisir/deviner un numéro, et le nombre de
    // pages diminue dès qu'un compte est supprimé. Renvoyer une page vide
    // ferait croire à l'admin que le registre s'est vidé.
    const t = makeTestClient()
    await seedMany(t, 25)

    const res = await t
      .withIdentity({ subject: ADMIN })
      .query(api.admin.users.listProfiles, { page: 99, pageSize: 10 })

    expect(res.page).toBe(2)
    expect(res.pageCount).toBe(3)
    expect(res.rows).toHaveLength(5)
  })

  test("la première page rend les comptes les plus récents", async () => {
    // POURQUOI : l'admin ouvre /users pour voir ce qui vient de se passer.
    // Un ordre d'insertion croissant lui montrerait les plus vieux comptes
    // et rendrait la première page inutile au quotidien.
    const t = makeTestClient()
    await seedMany(t, 30)

    const res = await t
      .withIdentity({ subject: ADMIN })
      .query(api.admin.users.listProfiles, { page: 0, pageSize: 5 })

    expect(res.rows.map((r) => r.idnId)).toEqual([
      "GA-0000-0029",
      "GA-0000-0028",
      "GA-0000-0027",
      "GA-0000-0026",
      "GA-0000-0025",
    ])
  })

  test("la recherche résout l'ID IDN, le nom et un fragment d'email", async () => {
    // POURQUOI : paginer sans rechercher déplace le problème — retrouver un
    // compte précis parmi mille redeviendrait impossible, page par page.
    const t = makeTestClient()
    await seedMany(t, 30)
    const asAdmin = t.withIdentity({ subject: ADMIN })

    const byIdn = await asAdmin.query(api.admin.users.searchProfiles, {
      q: "GA-0000-0007",
    })
    expect(byIdn.results.map((r) => r.idnId)).toEqual(["GA-0000-0007"])

    const byName = await asAdmin.query(api.admin.users.searchProfiles, {
      q: "nom12",
    })
    expect(byName.results.map((r) => r.idnId)).toEqual(["GA-0000-0012"])

    const byEmail = await asAdmin.query(api.admin.users.searchProfiles, {
      q: "citoyen23@",
    })
    expect(byEmail.results.map((r) => r.idnId)).toEqual(["GA-0000-0023"])
  })

  test("la liste est réservée aux administrateurs", async () => {
    const t = makeTestClient()
    await seedMany(t, 1)
    await expect(
      t
        .withIdentity({ subject: "citizen_1" })
        .query(api.admin.users.listProfiles, { page: 0, pageSize: 10 }),
    ).rejects.toThrow(/refusé/)
  })
})
