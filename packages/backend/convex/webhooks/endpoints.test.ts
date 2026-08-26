/// <reference types="vite/client" />
import { register as registerBetterAuth } from "@convex-dev/better-auth/test"
import { convexTest } from "convex-test"
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest"

import { api, components } from "../_generated/api"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")
const previousMasterKey = process.env.WEBHOOK_SECRETS_KEY

vi.mock("../lib/auth", async () => {
  const { ConvexError } = await import("convex/values")
  type Ctx = {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
  }
  const load = async (ctx: Ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return {
      userId: identity.subject,
      email: "developer@example.ga",
      emailVerified: true,
      roles: ["developer"],
    }
  }
  return {
    getCurrentAuthUser: load,
    requireDeveloper: async (ctx: Ctx) => {
      const user = await load(ctx)
      if (!user) {
        throw new ConvexError({
          code: "UNAUTHENTICATED",
          message: "Vous devez être connecté.",
        })
      }
      return user
    },
  }
})

beforeAll(() => {
  process.env.WEBHOOK_SECRETS_KEY = "77".repeat(32)
})

afterAll(() => {
  if (previousMasterKey === undefined) delete process.env.WEBHOOK_SECRETS_KEY
  else process.env.WEBHOOK_SECRETS_KEY = previousMasterKey
})

function makeTestClient() {
  const t = convexTest(schema, modules)
  registerBetterAuth(t)
  return t
}

async function seedApp(
  t: ReturnType<typeof makeTestClient>,
  clientId: string,
  userId: string,
  environment: "sandbox" | "production" = "sandbox",
  scopes = ["idn:iboite.read"],
  metadata: Record<string, unknown> = {},
) {
  await t.run(async (ctx) => {
    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: "oauthApplication",
        data: {
          clientId,
          userId,
          name: clientId,
          disabled: false,
          metadata: JSON.stringify({
            env: environment,
            status: environment === "production" ? "production" : undefined,
            scopes,
            testUsers: ["developer@example.ga"],
            ...metadata,
          }),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    })
  })
}

async function createEndpoint(
  t: ReturnType<typeof makeTestClient>,
  userId: string,
  clientId: string,
  index: number,
) {
  return await t
    .withIdentity({ subject: userId })
    .mutation(api.webhooks.endpoints.create, {
      clientId,
      name: `Endpoint ${index}`,
      url: `https://consumer${index}.example/webhooks`,
      eventTypes: ["iboite.account.updated"],
    })
}

describe("registre des endpoints webhook", () => {
  test("supprimer une application retire ses deux environnements et neutralise leurs accès", async () => {
    const t = makeTestClient()
    await seedApp(t, "app_sandbox", "dev", "sandbox", ["idn:iboite.read"], {
      linkedClientId: "app_production",
      productionStatus: "approved",
    })
    await seedApp(
      t,
      "app_production",
      "dev",
      "production",
      ["idn:iboite.read"],
      { linkedClientId: "app_sandbox" },
    )
    const sandboxEndpoint = await createEndpoint(t, "dev", "app_sandbox", 1)
    const productionEndpoint = await createEndpoint(
      t,
      "dev",
      "app_production",
      2,
    )
    const asDeveloper = t.withIdentity({ subject: "dev" })
    const sandboxKey = await asDeveloper.mutation(
      api.developer.apiKeys.createKey,
      {
        appClientId: "app_sandbox",
        name: "Sandbox",
        scopes: [],
      },
    )
    const productionKey = await asDeveloper.mutation(
      api.developer.apiKeys.createKey,
      {
        appClientId: "app_production",
        name: "Production",
        scopes: [],
      },
    )

    await asDeveloper.mutation(api.developer.apps.remove, {
      clientId: "app_sandbox",
    })

    expect(await asDeveloper.query(api.developer.apps.listMine, {})).toEqual([])
    await t.run(async (ctx) => {
      expect((await ctx.db.get(sandboxKey.id))?.revokedAt).toBeTypeOf("number")
      expect((await ctx.db.get(productionKey.id))?.revokedAt).toBeTypeOf(
        "number",
      )
      expect(
        (await ctx.db.get(sandboxEndpoint.endpointId))?.deletedAt,
      ).toBeTypeOf("number")
      expect(
        (await ctx.db.get(productionEndpoint.endpointId))?.deletedAt,
      ).toBeTypeOf("number")
    })
  })

  test("le propriétaire seul gère l'endpoint et le secret n'est affiché qu'à la création", async () => {
    const t = makeTestClient()
    await seedApp(t, "app_a", "dev_a")
    const created = await createEndpoint(t, "dev_a", "app_a", 1)

    expect(created.secret).toMatch(/^whsec_/)
    const stored = await t.run((ctx) => ctx.db.get(created.endpointId))
    expect(JSON.stringify(stored)).not.toContain(created.secret)
    await expect(
      t
        .withIdentity({ subject: "dev_b" })
        .mutation(api.webhooks.endpoints.update, {
          endpointId: created.endpointId,
          name: "Détourné",
          url: "https://attacker.example/webhooks",
          eventTypes: ["iboite.account.updated"],
        }),
    ).rejects.toThrow()
  })

  test("applique les limites de trois endpoints sandbox et dix en production", async () => {
    const t = makeTestClient()
    await seedApp(t, "sandbox_app", "dev", "sandbox")
    await seedApp(t, "production_app", "dev", "production")

    for (let index = 1; index <= 3; index++) {
      await createEndpoint(t, "dev", "sandbox_app", index)
    }
    await expect(createEndpoint(t, "dev", "sandbox_app", 4)).rejects.toThrow()

    for (let index = 1; index <= 10; index++) {
      await createEndpoint(t, "dev", "production_app", index)
    }
    await expect(
      createEndpoint(t, "dev", "production_app", 11),
    ).rejects.toThrow()
  })

  test("refuse un événement OAuth dont le scope n'est pas déclaré", async () => {
    const t = makeTestClient()
    await seedApp(t, "app_without_scope", "dev", "sandbox", [])

    await expect(
      createEndpoint(t, "dev", "app_without_scope", 1),
    ).rejects.toThrow()
  })

  test("conserve exactement une fenêtre de rotation de 24 heures", async () => {
    const t = makeTestClient()
    await seedApp(t, "rotation_app", "dev")
    const created = await createEndpoint(t, "dev", "rotation_app", 1)
    const asDeveloper = t.withIdentity({ subject: "dev" })
    const rotated = await asDeveloper.mutation(
      api.webhooks.endpoints.rotateSecret,
      { endpointId: created.endpointId },
    )

    expect(rotated.secret).not.toBe(created.secret)
    expect(rotated.previousValidUntil).toBeGreaterThan(Date.now())
    await expect(
      asDeveloper.mutation(api.webhooks.endpoints.rotateSecret, {
        endpointId: created.endpointId,
      }),
    ).rejects.toThrow()
  })

  test("un HTTP 410 impose un changement d'URL avant un nouveau challenge", async () => {
    const t = makeTestClient()
    await seedApp(t, "gone_app", "dev")
    const created = await createEndpoint(t, "dev", "gone_app", 1)
    await t.run((ctx) =>
      ctx.db.patch(created.endpointId, {
        status: "disabled",
        pausedReason: "HTTP_410",
      }),
    )
    const asDeveloper = t.withIdentity({ subject: "dev" })

    await expect(
      asDeveloper.mutation(api.webhooks.endpoints.requestChallenge, {
        endpointId: created.endpointId,
      }),
    ).rejects.toThrow()

    await asDeveloper.mutation(api.webhooks.endpoints.update, {
      endpointId: created.endpointId,
      name: "Nouvelle destination",
      url: "https://replacement.example/webhooks",
      eventTypes: ["iboite.account.updated"],
    })
    const updated = await t.run((ctx) => ctx.db.get(created.endpointId))
    expect(updated?.status).toBe("pending")
    expect(updated?.pausedReason).toBeUndefined()
  })

  test("lie les clés M2M à une app sans modifier les scopes historiques", async () => {
    const t = makeTestClient()
    await seedApp(t, "app_a", "dev")
    await seedApp(t, "app_b", "dev")
    const asDeveloper = t.withIdentity({ subject: "dev" })
    const historical = await asDeveloper.mutation(
      api.developer.apiKeys.createKey,
      {
        name: "Clé historique",
        scopes: ["idn:verification:list"],
      },
    )

    await asDeveloper.mutation(api.developer.apiKeys.attachKeyToApp, {
      keyId: historical.id,
      appClientId: "app_a",
    })
    const linked = await t.run((ctx) => ctx.db.get(historical.id))
    expect(linked?.appClientId).toBe("app_a")
    expect(linked?.scopes).toEqual(["idn:verification:list"])
    await expect(
      asDeveloper.mutation(api.developer.apiKeys.attachKeyToApp, {
        keyId: historical.id,
        appClientId: "app_b",
      }),
    ).rejects.toThrow()

    const created = await asDeveloper.mutation(
      api.developer.apiKeys.createKey,
      {
        appClientId: "app_b",
        name: "Clé liée",
        scopes: ["idn:iboite:letters:create"],
      },
    )
    expect((await t.run((ctx) => ctx.db.get(created.id)))?.appClientId).toBe(
      "app_b",
    )
  })
})
