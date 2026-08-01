/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { internal } from "../_generated/api"
import { api } from "../_generated/api"
import { generateApiToken, hashToken } from "../lib/secureToken"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")

/**
 * Clés API M2M du portail développeur.
 *
 * Ces clés authentifient les appels serveur-à-serveur des applications
 * partenaires, dont `/api/delegate/*` — c'est-à-dire la CRÉATION d'identités
 * nationales pour des tiers. Les invariants testés ici sont donc des invariants
 * de contrôle d'accès, pas de confort :
 *   • le secret n'est jamais stocké ni relisible ;
 *   • une clé révoquée ou expirée n'authentifie plus RIEN, immédiatement ;
 *   • un développeur ne peut pas toucher aux clés d'un autre ;
 *   • un scope inconnu est refusé à l'émission (une clé ne doit pas porter une
 *     autorisation que le serveur ne sait pas interpréter).
 *
 * `lib/auth` est mocké selon l'idiome déjà en place dans controller/queue.test.ts
 * (le composant Better Auth est hors de portée de convex-test).
 */
vi.mock("../lib/auth", async () => {
  const { ConvexError: CE } = await import("convex/values")
  type Ctx = {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
  }
  const load = async (ctx: Ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return {
      userId: identity.subject,
      email: "",
      emailVerified: true,
      roles: ["developer"],
    }
  }
  return {
    getCurrentAuthUser: load,
    requireDeveloper: async (ctx: Ctx) => {
      const user = await load(ctx)
      if (!user) {
        throw new CE({
          code: "UNAUTHENTICATED",
          message: "Vous devez être connecté.",
        })
      }
      return user
    },
  }
})

const DEV_A = "dev_a"
const DEV_B = "dev_b"

describe("createKey", () => {
  test("le secret est renvoyé une fois et n'est JAMAIS stocké en clair", async () => {
    const t = convexTest(schema, modules)
    const asA = t.withIdentity({ subject: DEV_A })

    const created = await asA.mutation(api.developer.apiKeys.createKey, {
      name: "Partenaire démarches.ga",
      scopes: ["citizens:resolve"],
    })

    expect(created.token).toMatch(/^idn_pat_/)

    const row = await t.run(async (ctx) => ctx.db.get(created.id))
    // Ce qui est en base ne doit pas permettre de reconstituer le jeton.
    expect(row?.tokenHash).toBe(await hashToken(created.token))
    expect(JSON.stringify(row)).not.toContain(created.token)
  })

  test("listKeys n'expose ni le secret ni son hash", async () => {
    const t = convexTest(schema, modules)
    const asA = t.withIdentity({ subject: DEV_A })
    const created = await asA.mutation(api.developer.apiKeys.createKey, {
      name: "clé",
      scopes: [],
    })

    const keys = await asA.query(api.developer.apiKeys.listKeys, {})
    expect(keys).toHaveLength(1)
    const serialized = JSON.stringify(keys)
    expect(serialized).not.toContain(created.token)
    expect(serialized).not.toContain(await hashToken(created.token))
    expect(keys[0]!.status).toBe("active")
  })

  test("un scope inconnu est refusé à l'émission", async () => {
    const t = convexTest(schema, modules)
    const asA = t.withIdentity({ subject: DEV_A })

    // Une clé qui porterait un scope non reconnu donnerait une fausse
    // impression d'autorisation : les gardes HTTP testent l'appartenance à une
    // liste, un scope hors liste n'ouvre rien mais laisse croire le contraire.
    await expect(
      asA.mutation(api.developer.apiKeys.createKey, {
        name: "clé",
        scopes: ["idn:delegate:everything"],
      }),
    ).rejects.toThrow()
  })

  test("un développeur non authentifié ne peut pas émettre de clé", async () => {
    const t = convexTest(schema, modules)
    await expect(
      t.mutation(api.developer.apiKeys.createKey, { name: "clé" }),
    ).rejects.toThrow()
  })

  test("listKeys ne montre que les clés du développeur courant", async () => {
    const t = convexTest(schema, modules)
    await t
      .withIdentity({ subject: DEV_A })
      .mutation(api.developer.apiKeys.createKey, { name: "clé A" })
    await t
      .withIdentity({ subject: DEV_B })
      .mutation(api.developer.apiKeys.createKey, { name: "clé B" })

    const keysB = await t
      .withIdentity({ subject: DEV_B })
      .query(api.developer.apiKeys.listKeys, {})
    expect(keysB.map((k) => k.name)).toEqual(["clé B"])
  })
})

describe("revokeKey", () => {
  test("un développeur ne peut pas révoquer la clé d'un autre", async () => {
    const t = convexTest(schema, modules)
    const created = await t
      .withIdentity({ subject: DEV_A })
      .mutation(api.developer.apiKeys.createKey, { name: "clé A" })

    await expect(
      t
        .withIdentity({ subject: DEV_B })
        .mutation(api.developer.apiKeys.revokeKey, { keyId: created.id }),
    ).rejects.toThrow()

    // …et la clé reste utilisable pour son propriétaire légitime.
    const principal = await t.mutation(internal.developer.apiKeys._verify, {
      tokenHash: await hashToken(created.token),
    })
    expect(principal).not.toBeNull()
  })

  test("la révocation est idempotente", async () => {
    const t = convexTest(schema, modules)
    const asA = t.withIdentity({ subject: DEV_A })
    const created = await asA.mutation(api.developer.apiKeys.createKey, {
      name: "clé",
    })

    await asA.mutation(api.developer.apiKeys.revokeKey, { keyId: created.id })
    const first = await t.run(async (ctx) => ctx.db.get(created.id))
    await asA.mutation(api.developer.apiKeys.revokeKey, { keyId: created.id })
    const second = await t.run(async (ctx) => ctx.db.get(created.id))

    // Un second appel ne doit pas déplacer la date de révocation : la trace de
    // QUAND l'accès a été coupé a une valeur d'audit.
    expect(second?.revokedAt).toBe(first?.revokedAt)
  })
})

describe("_verify — la garde réellement traversée par les appels M2M", () => {
  test("une clé révoquée n'authentifie plus rien", async () => {
    const t = convexTest(schema, modules)
    const asA = t.withIdentity({ subject: DEV_A })
    const created = await asA.mutation(api.developer.apiKeys.createKey, {
      name: "clé",
      scopes: ["idn:delegate:create"],
    })
    const tokenHash = await hashToken(created.token)

    expect(
      await t.mutation(internal.developer.apiKeys._verify, { tokenHash }),
    ).not.toBeNull()

    await asA.mutation(api.developer.apiKeys.revokeKey, { keyId: created.id })

    // Immédiatement, sans délai de propagation : la révocation d'une clé
    // capable de créer des identités nationales doit être effective à l'instant.
    expect(
      await t.mutation(internal.developer.apiKeys._verify, { tokenHash }),
    ).toBeNull()
  })

  test("une clé expirée n'authentifie plus rien", async () => {
    const t = convexTest(schema, modules)
    const asA = t.withIdentity({ subject: DEV_A })
    const created = await asA.mutation(api.developer.apiKeys.createKey, {
      name: "clé",
      expiresInDays: 1,
    })
    await t.run(async (ctx) => {
      await ctx.db.patch(created.id, { expiresAt: Date.now() - 1 })
    })

    expect(
      await t.mutation(internal.developer.apiKeys._verify, {
        tokenHash: await hashToken(created.token),
      }),
    ).toBeNull()
  })

  test("un jeton inconnu est refusé", async () => {
    const t = convexTest(schema, modules)
    const { token } = await generateApiToken()
    expect(
      await t.mutation(internal.developer.apiKeys._verify, {
        tokenHash: await hashToken(token),
      }),
    ).toBeNull()
  })

  test("le principal renvoyé porte les scopes de la clé, pas plus", async () => {
    const t = convexTest(schema, modules)
    const created = await t
      .withIdentity({ subject: DEV_A })
      .mutation(api.developer.apiKeys.createKey, {
        name: "clé",
        scopes: ["idn:delegate:lookup"],
      })

    const principal = await t.mutation(internal.developer.apiKeys._verify, {
      tokenHash: await hashToken(created.token),
    })
    expect(principal?.userId).toBe(DEV_A)
    expect(principal?.scopes).toEqual(["idn:delegate:lookup"])
  })

  test("une utilisation met à jour lastUsedAt (traçabilité des clés actives)", async () => {
    const t = convexTest(schema, modules)
    const created = await t
      .withIdentity({ subject: DEV_A })
      .mutation(api.developer.apiKeys.createKey, { name: "clé" })

    // `toBeFalsy` et non `toBeUndefined` : convex-test sérialise le retour de
    // `t.run`, donc un champ absent revient en `null`.
    expect(
      await t.run(async (ctx) => (await ctx.db.get(created.id))?.lastUsedAt),
    ).toBeFalsy()

    await t.mutation(internal.developer.apiKeys._verify, {
      tokenHash: await hashToken(created.token),
    })

    expect(
      await t.run(async (ctx) => (await ctx.db.get(created.id))?.lastUsedAt),
    ).toBeGreaterThan(0)
  })
})
