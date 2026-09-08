/// <reference types="vite/client" />
// @vitest-environment edge-runtime
import { convexTest } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { internal } from "../_generated/api"
import type { ActionCtx } from "../_generated/server"
import schema from "../schema"
import { isWebhookDeliveryAuthorized } from "./authorization"

const modules = import.meta.glob("/convex/**/*.ts")

type AuthorizationFixture = {
  appDisabled?: boolean
  appMetadata?: Record<string, unknown>
  consent?: { scopes: string; consentGiven?: boolean }
  userEmail?: string
  m2mAuthorized?: boolean
}

function actionCtx(fixture: AuthorizationFixture): ActionCtx {
  const runQuery = vi.fn(async (_reference: unknown, args: unknown) => {
    const input = args as Record<string, unknown>
    if (input.model === "oauthApplication") {
      return {
        page: [
          {
            disabled: fixture.appDisabled ?? false,
            metadata: JSON.stringify(
              fixture.appMetadata ?? {
                env: "production",
                status: "production",
              },
            ),
          },
        ],
      }
    }
    if (input.model === "user") {
      return { page: [{ email: fixture.userEmail ?? "test@example.ga" }] }
    }
    if (input.model === "oauthConsent") {
      return {
        page: fixture.consent
          ? [{ clientId: "client", ...fixture.consent }]
          : [],
      }
    }
    if (input.requiredScope === "idn:verification:list") {
      return fixture.m2mAuthorized ?? false
    }
    throw new Error("UNEXPECTED_QUERY")
  })
  return { runQuery } as unknown as ActionCtx
}

const endpoint = {
  appClientId: "client",
  environment: "production" as const,
  status: "active" as const,
}

const oauthEvent = {
  authorization: "oauth_user" as const,
  subject: "user_1",
  requiredScope: "idn:iboite.read",
}

describe("autorisation juste avant livraison", () => {
  test("refuse un consentement absent, révoqué ou sans le scope requis", async () => {
    await expect(
      isWebhookDeliveryAuthorized(actionCtx({}), oauthEvent, endpoint),
    ).resolves.toBe(false)
    await expect(
      isWebhookDeliveryAuthorized(
        actionCtx({
          consent: { scopes: "idn:iboite.read", consentGiven: false },
        }),
        oauthEvent,
        endpoint,
      ),
    ).resolves.toBe(false)
    await expect(
      isWebhookDeliveryAuthorized(
        actionCtx({ consent: { scopes: "openid profile" } }),
        oauthEvent,
        endpoint,
      ),
    ).resolves.toBe(false)
  })

  test("refuse une application désactivée", async () => {
    await expect(
      isWebhookDeliveryAuthorized(
        actionCtx({
          appDisabled: true,
          consent: { scopes: "idn:iboite.read" },
        }),
        oauthEvent,
        endpoint,
      ),
    ).resolves.toBe(false)
  })

  test("limite un endpoint sandbox aux utilisateurs de test déclarés", async () => {
    await expect(
      isWebhookDeliveryAuthorized(
        actionCtx({
          appMetadata: {
            env: "sandbox",
            testUsers: ["allowed@example.ga"],
          },
          userEmail: "outside@example.ga",
          consent: { scopes: "idn:iboite.read" },
        }),
        oauthEvent,
        { ...endpoint, environment: "sandbox" },
      ),
    ).resolves.toBe(false)
  })

  test("accepte le consentement OAuth actif avec le scope exact", async () => {
    await expect(
      isWebhookDeliveryAuthorized(
        actionCtx({ consent: { scopes: "openid idn:iboite.read" } }),
        oauthEvent,
        endpoint,
      ),
    ).resolves.toBe(true)
  })

  test("réévalue la présence d'une clé M2M liée à l'application", async () => {
    const event = {
      authorization: "m2m" as const,
      authorizationSubject: "user_1",
      requiredScope: "idn:verification:list",
    }
    await expect(
      isWebhookDeliveryAuthorized(
        actionCtx({ m2mAuthorized: false }),
        event,
        endpoint,
      ),
    ).resolves.toBe(false)
    await expect(
      isWebhookDeliveryAuthorized(
        actionCtx({ m2mAuthorized: true }),
        event,
        endpoint,
      ),
    ).resolves.toBe(true)
  })
})

describe("validité des clés M2M liées", () => {
  test("ignore une clé expirée, révoquée, d'une autre app ou sans scope", async () => {
    const t = convexTest(schema, modules)
    const now = Date.now()
    await t.run(async (ctx) => {
      const base = {
        userId: "dev",
        name: "clé",
        tokenHash: "hash",
        tokenPrefix: "prefix",
        createdAt: now,
      }
      await ctx.db.insert("developerApiKey", {
        ...base,
        appClientId: "client",
        scopes: ["idn:verification:list"],
        expiresAt: now - 1,
      })
      await ctx.db.insert("developerApiKey", {
        ...base,
        appClientId: "client",
        scopes: ["idn:verification:list"],
        revokedAt: now,
      })
      await ctx.db.insert("developerApiKey", {
        ...base,
        appClientId: "other_client",
        scopes: ["idn:verification:list"],
      })
      await ctx.db.insert("developerApiKey", {
        ...base,
        appClientId: "client",
        scopes: ["citizens:resolve"],
      })
    })

    await expect(
      t.query(internal.webhooks.dispatch.hasActiveM2mScope, {
        appClientId: "client",
        requiredScope: "idn:verification:list",
        now,
      }),
    ).resolves.toBe(false)
  })
})
