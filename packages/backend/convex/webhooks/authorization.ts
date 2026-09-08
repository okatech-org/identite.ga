import type { ActionCtx } from "../_generated/server"
import { components, internal } from "../_generated/api"
import { parseConsentScopes } from "../lib/consentGrant"

type EventAuthorization = {
  authorization: "oauth_user" | "m2m"
  subject?: string
  authorizationSubject?: string
  requiredScope: string
}

type EndpointAuthorization = {
  appClientId: string
  environment: "sandbox" | "production"
  status: "pending" | "active" | "paused" | "disabled"
}

type OAuthAppDoc = {
  disabled?: boolean | null
  metadata?: string | null
}

type ConsentDoc = {
  clientId: string
  scopes?: string[] | string | null
  consentGiven?: boolean | null
}

function metadata(raw: string | null | undefined): {
  env: "sandbox" | "production"
  status?: "pending" | "production"
  testUsers: string[]
} {
  try {
    const value = JSON.parse(raw ?? "{}") as Record<string, unknown>
    return {
      env: value.env === "production" ? "production" : "sandbox",
      status:
        value.status === "pending" || value.status === "production"
          ? value.status
          : undefined,
      testUsers: Array.isArray(value.testUsers)
        ? value.testUsers.map(String).map((email) => email.toLowerCase())
        : [],
    }
  } catch {
    return { env: "sandbox", testUsers: [] }
  }
}

export async function loadAuthorizedWebhookApp(
  ctx: ActionCtx,
  endpoint: EndpointAuthorization,
): Promise<ReturnType<typeof metadata> | null> {
  const apps = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: "oauthApplication",
    where: [{ field: "clientId", value: endpoint.appClientId, operator: "eq" }],
    paginationOpts: { numItems: 1, cursor: null },
  })) as { page: OAuthAppDoc[] }
  const app = apps.page[0]
  if (!app || app.disabled) return null
  const appMetadata = metadata(app.metadata)
  if (appMetadata.env !== endpoint.environment) return null
  if (appMetadata.env === "production" && appMetadata.status !== "production") {
    return null
  }
  return appMetadata
}

/** Réévalue tous les droits juste avant le fan-out et chaque appel HTTP. */
export async function isWebhookDeliveryAuthorized(
  ctx: ActionCtx,
  event: EventAuthorization,
  endpoint: EndpointAuthorization,
): Promise<boolean> {
  if (endpoint.status !== "active") return false
  const appMetadata = await loadAuthorizedWebhookApp(ctx, endpoint)
  if (!appMetadata) return false

  const authorizationSubject = event.authorizationSubject ?? event.subject
  if (!authorizationSubject) return false
  if (appMetadata.env === "sandbox") {
    const users = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "user",
      where: [{ field: "_id", value: authorizationSubject, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: Array<{ email?: string | null }> }
    const email = users.page[0]?.email?.toLowerCase()
    if (!email || !appMetadata.testUsers.includes(email)) return false
  }

  if (event.authorization === "m2m") {
    return await ctx.runQuery(internal.webhooks.dispatch.hasActiveM2mScope, {
      appClientId: endpoint.appClientId,
      requiredScope: event.requiredScope,
      now: Date.now(),
    })
  }

  const consents = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: "oauthConsent",
    where: [{ field: "userId", value: authorizationSubject, operator: "eq" }],
    paginationOpts: { numItems: 200, cursor: null },
  })) as { page: ConsentDoc[] }
  const consent = consents.page.find(
    (row) =>
      row.clientId === endpoint.appClientId && row.consentGiven !== false,
  )
  return Boolean(
    consent && parseConsentScopes(consent.scopes).includes(event.requiredScope),
  )
}
