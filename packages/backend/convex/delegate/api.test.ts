/// <reference types="vite/client" />
import { register as registerAggregate } from "@convex-dev/aggregate/test"
import { register as registerBetterAuth } from "@convex-dev/better-auth/test"
import { convexTest } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { components } from "../_generated/api"
import { generateApiToken } from "../lib/secureToken"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")

/**
 * Contrat HTTP de l'API partenaire `/api/delegate/*`.
 *
 * CE QUI EST EN JEU : une application délégante crée des identités pour des
 * citoyens qui n'ont pas encore de compte. Pour rattacher ces identités aux
 * siennes, elle a besoin du `sub` OIDC — le MÊME identifiant que celui que
 * portera plus tard l'`id_token` une fois l'identité réclamée. C'est ce qui
 * rend le rattachement idempotent : sans lui, le partenaire n'a que l'IDN
 * (absent tant que le profil n'est pas complet) ou le `delegatedIdentityId`
 * (interne, qui ne réapparaît dans aucun jeton). Ces tests verrouillent la
 * présence du `sub` dans les RÉPONSES HTTP, et pas seulement dans les queries
 * internes : c'est le corps JSON qui fait contrat vis-à-vis du partenaire.
 *
 * `delegate/actions` est mocké : `createDelegatedUser` passe par Better Auth
 * (`signUpEmail`), hors de portée de convex-test. Ce qui est testé ici est la
 * couture entre le retour de l'action et le JSON renvoyé — justement la seule
 * réponse dont le corps est construit à la main, donc la seule qu'aucun
 * validateur Convex ne protège.
 */
vi.mock("../delegate/actions", async () => {
  const { internalAction } = await import("../_generated/server")
  return {
    createDelegatedUser: internalAction({
      handler: async () => ({
        userId: "user_created_by_partner",
        idnId: "GA-0002-0002",
        delegatedIdentityId: "fake_delegated_id",
        claimCode: "AAAA-BBBB-CCCC",
      }),
    }),
  }
})

const DEV = "dev_partner"
const CLIENT_ID = "app_1"

function makeTestClient() {
  const t = convexTest(schema, modules)
  registerAggregate(t, "kycByStatus")
  registerAggregate(t, "usersByLoa")
  registerAggregate(t, "usersByProfile")
  registerBetterAuth(t)
  return t
}

/** Clé API M2M active portant `scopes`, telle que la présenterait le partenaire. */
async function seedApiKey(
  t: ReturnType<typeof convexTest>,
  scopes: string[],
): Promise<string> {
  const { token, tokenHash, tokenPrefix } = await generateApiToken()
  await t.run(async (ctx) => {
    await ctx.db.insert("developerApiKey", {
      userId: DEV,
      name: "clé partenaire",
      tokenHash,
      tokenPrefix,
      scopes,
      createdAt: Date.now(),
    })
  })
  return token
}

/** Application OAuth du développeur, délégation activée. */
async function seedDelegatingApp(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: "oauthApplication",
        data: {
          clientId: CLIENT_ID,
          userId: DEV,
          name: "App partenaire",
          disabled: false,
          metadata: JSON.stringify({
            delegation: { enabled: true, maxLoa: 2 },
          }),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    })
  })
}

/** Identité déléguée déjà émise par cette application. */
async function seedDelegation(t: ReturnType<typeof convexTest>) {
  const now = Date.now()
  return await t.run(async (ctx) => {
    const profileId = await ctx.db.insert("userProfile", {
      userId: "user_delegated",
      profileType: "citizen",
      loa: 2,
      idnId: "GA-0001-0001",
      pivot: {
        firstName: "Jean",
        lastName: "Ondo",
        dateOfBirth: "1991-07-05",
        gender: "M",
        birthPlace: "Libreville",
        nationality: "GAB",
        nip: "A1B2C3D4E5F6G7",
      },
      createdAt: now,
      updatedAt: now,
    } as any)
    return await ctx.db.insert("delegatedIdentity", {
      appClientId: CLIENT_ID,
      operatorUserId: DEV,
      targetUserId: "user_delegated",
      targetProfileId: profileId,
      assignedLoa: 2,
      claimCodeHash: "abc",
      claimCodeExpiresAt: now + 60_000,
      claimAttempts: 0,
      status: "created",
      createdAt: now,
      updatedAt: now,
    })
  })
}

describe("POST /api/delegate/identity", () => {
  test("la réponse de création porte le sub OIDC de l'identité émise", async () => {
    const t = makeTestClient()
    const token = await seedApiKey(t, ["idn:delegate:create"])
    await seedDelegatingApp(t)

    const res = await t.fetch("/api/delegate/identity", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "Awa",
        lastName: "Mbina",
        dateOfBirth: "1995-03-12",
        gender: "F",
        birthPlace: "Port-Gentil",
        nationality: "GAB",
        loa: 2,
      }),
    })

    expect(res.status).toBe(201)
    await expect(res.json()).resolves.toMatchObject({
      sub: "user_created_by_partner",
      idnId: "GA-0002-0002",
      assignedLoa: 2,
      claimCode: "AAAA-BBBB-CCCC",
    })
  })
})

describe("GET /api/delegate/identity", () => {
  test("le suivi restitue le sub, stable de la création à la réclamation", async () => {
    const t = makeTestClient()
    const token = await seedApiKey(t, ["idn:delegate:status"])
    await seedDelegatingApp(t)
    const delegatedIdentityId = await seedDelegation(t)

    const res = await t.fetch(
      `/api/delegate/identity?id=${delegatedIdentityId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      sub: "user_delegated",
      idnId: "GA-0001-0001",
      status: "created",
    })
  })

  test("une autre application n'obtient pas le sub (ce n'est pas un identifiant public)", async () => {
    const t = makeTestClient()
    const token = await seedApiKey(t, ["idn:delegate:status"])
    await seedDelegatingApp(t)
    const delegatedIdentityId = await seedDelegation(t)
    // L'identité passe sous une autre application : la clé reste valide, mais
    // le rattachement app ↔ identité ne l'est plus.
    await t.run(async (ctx) => {
      await ctx.db.patch(delegatedIdentityId, { appClientId: "app_autre" })
    })

    const res = await t.fetch(
      `/api/delegate/identity?id=${delegatedIdentityId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    expect(res.status).toBe(403)
    expect(await res.text()).not.toContain("user_delegated")
  })
})

describe("POST /api/delegate/lookup", () => {
  test("la recherche par NIP renvoie le sub du citoyen trouvé", async () => {
    const t = makeTestClient()
    const token = await seedApiKey(t, ["idn:delegate:lookup"])
    await seedDelegatingApp(t)
    await seedDelegation(t)

    const res = await t.fetch("/api/delegate/lookup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nip: "A1B2C3D4E5F6G7" }),
    })

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      found: true,
      sub: "user_delegated",
      idnId: "GA-0001-0001",
      isDelegated: true,
    })
  })

  test("la recherche par état civil renvoie le même sub que par NIP", async () => {
    const t = makeTestClient()
    const token = await seedApiKey(t, ["idn:delegate:lookup"])
    await seedDelegatingApp(t)
    await seedDelegation(t)

    // `lookupForDelegation` a deux chemins de résolution distincts : ils
    // doivent désigner le même sujet, sinon le partenaire créerait deux
    // rattachements pour un seul citoyen.
    const res = await t.fetch("/api/delegate/lookup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "jean",
        lastName: "ONDO",
        dateOfBirth: "1991-07-05",
      }),
    })

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      found: true,
      sub: "user_delegated",
    })
  })

  test("aucun sub n'est renvoyé quand le citoyen est inconnu", async () => {
    const t = makeTestClient()
    const token = await seedApiKey(t, ["idn:delegate:lookup"])
    await seedDelegatingApp(t)

    const res = await t.fetch("/api/delegate/lookup", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nip: "Z9Y8X7W6V5U4T3" }),
    })

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({ found: false })
  })
})
