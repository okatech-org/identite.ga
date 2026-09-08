import { ConvexError, v } from "convex/values"

import { components, internal } from "../_generated/api"
import type { Doc } from "../_generated/dataModel"
import { mutation, query } from "../_generated/server"
import { getCurrentAuthUser, requireDeveloper } from "../lib/auth"
import {
  WEBHOOK_EVENT_CATALOG,
  WEBHOOK_EVENT_TYPES,
  webhookEventTypeValidator,
  type WebhookEventType,
} from "./catalog"
import { encryptWebhookSecret, generateWebhookSecret } from "./crypto"
import { WEBHOOK_SECRET_OVERLAP_MS } from "./policy"
import { validateWebhookUrl } from "./urlSafety"

type OAuthAppDoc = {
  clientId?: string | null
  userId?: string | null
  disabled?: boolean | null
  metadata?: string | null
}

type AppMetadata = {
  env: "sandbox" | "production"
  status?: "pending" | "production"
  scopes: string[]
}

function parseMetadata(raw: string | null | undefined): AppMetadata {
  try {
    const value = JSON.parse(raw ?? "{}") as Record<string, unknown>
    return {
      env: value.env === "production" ? "production" : "sandbox",
      status:
        value.status === "pending" || value.status === "production"
          ? value.status
          : undefined,
      scopes: Array.isArray(value.scopes) ? value.scopes.map(String) : [],
    }
  } catch {
    return { env: "sandbox", scopes: [] }
  }
}

async function ownedApp(
  ctx: Parameters<typeof requireDeveloper>[0],
  clientId: string,
  userId: string,
): Promise<{ doc: OAuthAppDoc; metadata: AppMetadata }> {
  const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: "oauthApplication",
    where: [{ field: "clientId", value: clientId, operator: "eq" }],
    paginationOpts: { numItems: 1, cursor: null },
  })) as { page: OAuthAppDoc[] }
  const doc = raw.page[0]
  if (!doc) {
    throw new ConvexError({ code: "NOT_FOUND", message: "App introuvable." })
  }
  if (doc.userId !== userId) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Cette application ne vous appartient pas.",
    })
  }
  if (doc.disabled) {
    throw new ConvexError({
      code: "APP_DISABLED",
      message: "Cette application est désactivée.",
    })
  }
  const metadata = parseMetadata(doc.metadata)
  if (metadata.env === "production" && metadata.status !== "production") {
    throw new ConvexError({
      code: "APP_NOT_APPROVED",
      message: "L'application de production n'est pas encore approuvée.",
    })
  }
  return { doc, metadata }
}

function ensureSubscriptionsAllowed(
  eventTypes: WebhookEventType[],
  metadata: AppMetadata,
): WebhookEventType[] {
  const unique = [...new Set(eventTypes)]
  for (const type of unique) {
    const contract = WEBHOOK_EVENT_CATALOG[type]
    if (
      contract.authorization === "oauth_user" &&
      !metadata.scopes.includes(contract.requiredScope)
    ) {
      throw new ConvexError({
        code: "SCOPE_NOT_DECLARED",
        message: `L'application doit déclarer ${contract.requiredScope} pour recevoir ${type}.`,
      })
    }
  }
  return unique
}

function serializeEndpoint(row: Doc<"webhookEndpoints">) {
  return {
    id: row._id,
    clientId: row.appClientId,
    environment: row.environment,
    name: row.name,
    url: row.url,
    status: row.status,
    verifiedAt: row.verifiedAt ?? null,
    consecutiveFailures: row.consecutiveFailures,
    lastSuccessAt: row.lastSuccessAt ?? null,
    lastFailureAt: row.lastFailureAt ?? null,
    pausedReason: row.pausedReason ?? null,
    createdAt: row.createdAt,
  }
}

const ENDPOINT_DTO = v.object({
  id: v.id("webhookEndpoints"),
  clientId: v.string(),
  environment: v.union(v.literal("sandbox"), v.literal("production")),
  name: v.string(),
  url: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("active"),
    v.literal("paused"),
    v.literal("disabled"),
  ),
  verifiedAt: v.union(v.number(), v.null()),
  consecutiveFailures: v.number(),
  lastSuccessAt: v.union(v.number(), v.null()),
  lastFailureAt: v.union(v.number(), v.null()),
  pausedReason: v.union(v.string(), v.null()),
  createdAt: v.number(),
})

export const catalog = query({
  args: {},
  returns: v.array(
    v.object({
      type: webhookEventTypeValidator,
      label: v.string(),
      requiredScope: v.string(),
      authorization: v.union(v.literal("oauth_user"), v.literal("m2m")),
    }),
  ),
  handler: async () =>
    WEBHOOK_EVENT_TYPES.map((type) => ({
      type,
      ...WEBHOOK_EVENT_CATALOG[type],
    })),
})

export const list = query({
  args: { clientId: v.string() },
  returns: v.array(
    v.object({
      endpoint: ENDPOINT_DTO,
      subscriptions: v.array(webhookEventTypeValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentAuthUser(ctx)
    if (!user || !user.roles.includes("developer")) return []
    await ownedApp(ctx, args.clientId, user.userId)
    const endpoints = await ctx.db
      .query("webhookEndpoints")
      .withIndex("by_appClientId_and_createdAt", (q) =>
        q.eq("appClientId", args.clientId),
      )
      .order("desc")
      .take(20)
    return await Promise.all(
      endpoints
        .filter((row) => row.deletedAt === undefined)
        .map(async (endpoint) => {
          const subscriptions = await ctx.db
            .query("webhookSubscriptions")
            .withIndex("by_endpointId_and_eventType", (q) =>
              q.eq("endpointId", endpoint._id),
            )
            .take(WEBHOOK_EVENT_TYPES.length)
          return {
            endpoint: serializeEndpoint(endpoint),
            subscriptions: subscriptions.map((row) => row.eventType),
          }
        }),
    )
  },
})

export const create = mutation({
  args: {
    clientId: v.string(),
    name: v.string(),
    url: v.string(),
    eventTypes: v.array(webhookEventTypeValidator),
  },
  returns: v.object({
    endpointId: v.id("webhookEndpoints"),
    secret: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const { metadata } = await ownedApp(ctx, args.clientId, user.userId)
    const name = args.name.trim()
    if (!name || name.length > 80) {
      throw new ConvexError({
        code: "INVALID_NAME",
        message: "Le nom doit contenir entre 1 et 80 caractères.",
      })
    }
    const safe = validateWebhookUrl(args.url, metadata.env)
    if (!safe.ok) {
      throw new ConvexError({ code: safe.code, message: safe.message })
    }
    const eventTypes = ensureSubscriptionsAllowed(args.eventTypes, metadata)
    if (eventTypes.length === 0) {
      throw new ConvexError({
        code: "SUBSCRIPTION_REQUIRED",
        message: "Choisissez au moins un événement.",
      })
    }
    const limit = metadata.env === "production" ? 10 : 3
    let usedSlots = 0
    for (const status of ["pending", "active", "paused"] as const) {
      const rows = await ctx.db
        .query("webhookEndpoints")
        .withIndex("by_appClientId_and_status", (q) =>
          q.eq("appClientId", args.clientId).eq("status", status),
        )
        .take(limit + 1)
      usedSlots += rows.filter((row) => row.deletedAt === undefined).length
    }
    if (usedSlots >= limit) {
      throw new ConvexError({
        code: "ENDPOINT_LIMIT",
        message: `Maximum ${limit} endpoints pour cette application.`,
      })
    }
    const secret = generateWebhookSecret()
    const encrypted = await encryptWebhookSecret(secret)
    const now = Date.now()
    const endpointId = await ctx.db.insert("webhookEndpoints", {
      appClientId: args.clientId,
      developerUserId: user.userId,
      environment: metadata.env,
      name,
      url: safe.url,
      status: "pending",
      secretCiphertext: encrypted.ciphertext,
      secretIv: encrypted.iv,
      consecutiveFailures: 0,
      createdAt: now,
      updatedAt: now,
    })
    for (const eventType of eventTypes) {
      await ctx.db.insert("webhookSubscriptions", {
        endpointId,
        appClientId: args.clientId,
        eventType,
        createdAt: now,
      })
    }
    return { endpointId, secret }
  },
})

export const update = mutation({
  args: {
    endpointId: v.id("webhookEndpoints"),
    name: v.string(),
    url: v.string(),
    eventTypes: v.array(webhookEventTypeValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const row = await ctx.db.get(args.endpointId)
    if (!row || row.deletedAt !== undefined) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Endpoint introuvable.",
      })
    }
    if (row.developerUserId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Endpoint non autorisé.",
      })
    }
    const { metadata } = await ownedApp(ctx, row.appClientId, user.userId)
    const name = args.name.trim()
    if (!name || name.length > 80) {
      throw new ConvexError({
        code: "INVALID_NAME",
        message: "Le nom doit contenir entre 1 et 80 caractères.",
      })
    }
    const safe = validateWebhookUrl(args.url, metadata.env)
    if (!safe.ok)
      throw new ConvexError({ code: safe.code, message: safe.message })
    const eventTypes = ensureSubscriptionsAllowed(args.eventTypes, metadata)
    if (eventTypes.length === 0) {
      throw new ConvexError({
        code: "SUBSCRIPTION_REQUIRED",
        message: "Choisissez au moins un événement.",
      })
    }
    const existing = await ctx.db
      .query("webhookSubscriptions")
      .withIndex("by_endpointId_and_eventType", (q) =>
        q.eq("endpointId", row._id),
      )
      .take(WEBHOOK_EVENT_TYPES.length)
    for (const subscription of existing) await ctx.db.delete(subscription._id)
    const now = Date.now()
    for (const eventType of eventTypes) {
      await ctx.db.insert("webhookSubscriptions", {
        endpointId: row._id,
        appClientId: row.appClientId,
        eventType,
        createdAt: now,
      })
    }
    const urlChanged = safe.url !== row.url
    await ctx.db.patch(row._id, {
      name,
      url: safe.url,
      status: urlChanged ? "pending" : row.status,
      challengeId: urlChanged ? undefined : row.challengeId,
      verifiedAt: urlChanged ? undefined : row.verifiedAt,
      consecutiveFailures: urlChanged ? 0 : row.consecutiveFailures,
      pausedReason: urlChanged ? undefined : row.pausedReason,
      updatedAt: now,
    })
    return null
  },
})

export const requestChallenge = mutation({
  args: { endpointId: v.id("webhookEndpoints") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const row = await ctx.db.get(args.endpointId)
    if (!row || row.deletedAt !== undefined)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Endpoint introuvable.",
      })
    if (row.developerUserId !== user.userId)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Endpoint non autorisé.",
      })
    await ownedApp(ctx, row.appClientId, user.userId)
    if (row.pausedReason === "HTTP_410") {
      throw new ConvexError({
        code: "ENDPOINT_GONE",
        message:
          "L'endpoint a répondu 410. Modifiez son URL avant de relancer le challenge.",
      })
    }
    const challengeId = crypto.randomUUID()
    await ctx.db.patch(row._id, {
      status: row.status === "active" ? "active" : "pending",
      challengeId,
      updatedAt: Date.now(),
    })
    await ctx.scheduler.runAfter(
      0,
      internal.webhooks.delivery.verifyChallenge,
      {
        endpointId: row._id,
        challengeId,
      },
    )
    return null
  },
})

export const rotateSecret = mutation({
  args: { endpointId: v.id("webhookEndpoints") },
  returns: v.object({ secret: v.string(), previousValidUntil: v.number() }),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const row = await ctx.db.get(args.endpointId)
    if (!row || row.deletedAt !== undefined)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Endpoint introuvable.",
      })
    if (row.developerUserId !== user.userId)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Endpoint non autorisé.",
      })
    await ownedApp(ctx, row.appClientId, user.userId)
    const now = Date.now()
    if ((row.previousSecretValidUntil ?? 0) > now) {
      throw new ConvexError({
        code: "ROTATION_IN_PROGRESS",
        message: "Une rotation est déjà en cours pour cet endpoint.",
      })
    }
    const secret = generateWebhookSecret()
    const encrypted = await encryptWebhookSecret(secret)
    const previousValidUntil = now + WEBHOOK_SECRET_OVERLAP_MS
    await ctx.db.patch(row._id, {
      secretCiphertext: encrypted.ciphertext,
      secretIv: encrypted.iv,
      previousSecretCiphertext: row.secretCiphertext,
      previousSecretIv: row.secretIv,
      previousSecretValidUntil: previousValidUntil,
      updatedAt: now,
    })
    return { secret, previousValidUntil }
  },
})

export const resume = mutation({
  args: { endpointId: v.id("webhookEndpoints") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const row = await ctx.db.get(args.endpointId)
    if (!row || row.deletedAt !== undefined)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Endpoint introuvable.",
      })
    if (row.developerUserId !== user.userId)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Endpoint non autorisé.",
      })
    await ownedApp(ctx, row.appClientId, user.userId)
    if (row.pausedReason === "HTTP_410") {
      throw new ConvexError({
        code: "ENDPOINT_GONE",
        message:
          "L'endpoint a répondu 410. Modifiez son URL puis relancez le challenge.",
      })
    }
    await ctx.db.patch(row._id, {
      status: row.verifiedAt ? "active" : "pending",
      consecutiveFailures: 0,
      pausedReason: undefined,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const disable = mutation({
  args: { endpointId: v.id("webhookEndpoints") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const row = await ctx.db.get(args.endpointId)
    if (!row || row.deletedAt !== undefined) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Endpoint introuvable.",
      })
    }
    if (row.developerUserId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Endpoint non autorisé.",
      })
    }
    await ownedApp(ctx, row.appClientId, user.userId)
    await ctx.db.patch(row._id, {
      status: "disabled",
      pausedReason: "MANUALLY_DISABLED",
      updatedAt: Date.now(),
    })
    return null
  },
})

export const remove = mutation({
  args: { endpointId: v.id("webhookEndpoints") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const row = await ctx.db.get(args.endpointId)
    if (!row || row.deletedAt !== undefined) return null
    if (row.developerUserId !== user.userId)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Endpoint non autorisé.",
      })
    const now = Date.now()
    await ctx.db.patch(row._id, {
      status: "disabled",
      url: "https://deleted.invalid/",
      secretCiphertext: "",
      secretIv: "",
      previousSecretCiphertext: undefined,
      previousSecretIv: undefined,
      previousSecretValidUntil: undefined,
      challengeId: undefined,
      deletedAt: now,
      updatedAt: now,
    })
    const subscriptions = await ctx.db
      .query("webhookSubscriptions")
      .withIndex("by_endpointId_and_eventType", (q) =>
        q.eq("endpointId", row._id),
      )
      .take(WEBHOOK_EVENT_TYPES.length)
    for (const subscription of subscriptions)
      await ctx.db.delete(subscription._id)
    return null
  },
})

export const replay = mutation({
  args: { deliveryId: v.id("webhookDeliveries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const delivery = await ctx.db.get(args.deliveryId)
    if (!delivery)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Livraison introuvable.",
      })
    const endpoint = await ctx.db.get(delivery.endpointId)
    if (!endpoint || endpoint.developerUserId !== user.userId)
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Livraison non autorisée.",
      })
    if (endpoint.status !== "active")
      throw new ConvexError({
        code: "ENDPOINT_INACTIVE",
        message: "Réactivez l'endpoint avant le rejeu.",
      })
    const now = Date.now()
    await ctx.db.patch(delivery._id, {
      status: "pending",
      attempts: 0,
      attemptCycleStartedAt: now,
      nextAttemptAt: now,
      leaseExpiresAt: undefined,
      lastHttpStatus: undefined,
      lastErrorCode: undefined,
      deliveredAt: undefined,
      updatedAt: now,
    })
    await ctx.scheduler.runAfter(
      0,
      internal.webhooks.delivery.attemptDelivery,
      { deliveryId: delivery._id },
    )
    return null
  },
})

export const listDeliveries = query({
  args: { endpointId: v.id("webhookEndpoints") },
  returns: v.array(
    v.object({
      id: v.id("webhookDeliveries"),
      eventId: v.string(),
      eventType: webhookEventTypeValidator,
      status: v.union(
        v.literal("pending"),
        v.literal("delivering"),
        v.literal("retrying"),
        v.literal("succeeded"),
        v.literal("failed"),
        v.literal("canceled"),
      ),
      attempts: v.number(),
      nextAttemptAt: v.number(),
      lastHttpStatus: v.union(v.number(), v.null()),
      lastErrorCode: v.union(v.string(), v.null()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentAuthUser(ctx)
    if (!user || !user.roles.includes("developer")) return []
    const endpoint = await ctx.db.get(args.endpointId)
    if (!endpoint || endpoint.developerUserId !== user.userId) return []
    const deliveries = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_endpointId_and_createdAt", (q) =>
        q.eq("endpointId", args.endpointId),
      )
      .order("desc")
      .take(100)
    const out = []
    for (const delivery of deliveries) {
      const event = await ctx.db.get(delivery.eventId)
      if (!event) continue
      out.push({
        id: delivery._id,
        eventId: event.eventId,
        eventType: event.type,
        status: delivery.status,
        attempts: delivery.attempts,
        nextAttemptAt: delivery.nextAttemptAt,
        lastHttpStatus: delivery.lastHttpStatus ?? null,
        lastErrorCode: delivery.lastErrorCode ?? null,
        createdAt: delivery.createdAt,
      })
    }
    return out
  },
})
