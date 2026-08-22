import { v } from "convex/values"

import { internal } from "../_generated/api"
import { internalMutation, internalQuery } from "../_generated/server"
import {
  WEBHOOK_LEASE_MS,
  WEBHOOK_MAX_ATTEMPTS,
  webhookRetryDelayMs,
} from "./policy"

const DELIVERY_CLAIM = v.object({
  deliveryId: v.id("webhookDeliveries"),
  event: v.object({
    eventId: v.string(),
    type: v.string(),
    authorization: v.union(v.literal("oauth_user"), v.literal("m2m")),
    subject: v.optional(v.string()),
    authorizationSubject: v.optional(v.string()),
    requiredScope: v.string(),
    payloadJson: v.string(),
  }),
  endpoint: v.object({
    id: v.id("webhookEndpoints"),
    appClientId: v.string(),
    environment: v.union(v.literal("sandbox"), v.literal("production")),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("disabled"),
    ),
    url: v.string(),
    secretCiphertext: v.string(),
    secretIv: v.string(),
    previousSecretCiphertext: v.optional(v.string()),
    previousSecretIv: v.optional(v.string()),
    previousSecretValidUntil: v.optional(v.number()),
  }),
})

export const claim = internalMutation({
  args: { deliveryId: v.id("webhookDeliveries") },
  returns: v.union(v.null(), DELIVERY_CLAIM),
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId)
    if (!delivery) return null
    const now = Date.now()
    if (
      delivery.status === "succeeded" ||
      delivery.status === "failed" ||
      delivery.status === "canceled" ||
      delivery.attempts >= WEBHOOK_MAX_ATTEMPTS ||
      delivery.nextAttemptAt > now ||
      (delivery.status === "delivering" && (delivery.leaseExpiresAt ?? 0) > now)
    ) {
      return null
    }
    const event = await ctx.db.get(delivery.eventId)
    const endpoint = await ctx.db.get(delivery.endpointId)
    if (!event || !endpoint || endpoint.deletedAt !== undefined) {
      await ctx.db.patch(delivery._id, {
        status: "canceled",
        lastErrorCode: "RESOURCE_MISSING",
        updatedAt: now,
      })
      return null
    }
    const subscription = await ctx.db
      .query("webhookSubscriptions")
      .withIndex("by_endpointId_and_eventType", (q) =>
        q.eq("endpointId", endpoint._id).eq("eventType", event.type),
      )
      .unique()
    if (!subscription || endpoint.status !== "active") {
      await ctx.db.patch(delivery._id, {
        status: "canceled",
        lastErrorCode: subscription ? "ENDPOINT_INACTIVE" : "UNSUBSCRIBED",
        updatedAt: now,
      })
      return null
    }
    await ctx.db.patch(delivery._id, {
      status: "delivering",
      attempts: delivery.attempts + 1,
      leaseExpiresAt: now + WEBHOOK_LEASE_MS,
      lastAttemptAt: now,
      updatedAt: now,
    })
    return {
      deliveryId: delivery._id,
      event: {
        eventId: event.eventId,
        type: event.type,
        authorization: event.authorization,
        subject: event.subject,
        authorizationSubject: event.authorizationSubject,
        requiredScope: event.requiredScope,
        payloadJson: event.payloadJson,
      },
      endpoint: {
        id: endpoint._id,
        appClientId: endpoint.appClientId,
        environment: endpoint.environment,
        status: endpoint.status,
        url: endpoint.url,
        secretCiphertext: endpoint.secretCiphertext,
        secretIv: endpoint.secretIv,
        previousSecretCiphertext: endpoint.previousSecretCiphertext,
        previousSecretIv: endpoint.previousSecretIv,
        previousSecretValidUntil: endpoint.previousSecretValidUntil,
      },
    }
  },
})

export const finish = internalMutation({
  args: {
    deliveryId: v.id("webhookDeliveries"),
    outcome: v.union(
      v.literal("success"),
      v.literal("failure"),
      v.literal("canceled"),
    ),
    httpStatus: v.optional(v.number()),
    errorCode: v.optional(v.string()),
    retryAfterMs: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const delivery = await ctx.db.get(args.deliveryId)
    if (!delivery) return null
    const endpoint = await ctx.db.get(delivery.endpointId)
    const now = Date.now()
    if (args.outcome === "canceled" || !endpoint) {
      await ctx.db.patch(delivery._id, {
        status: "canceled",
        leaseExpiresAt: undefined,
        lastHttpStatus: args.httpStatus,
        lastErrorCode: args.errorCode ?? "NOT_AUTHORIZED",
        updatedAt: now,
      })
      return null
    }
    if (args.outcome === "success") {
      await ctx.db.patch(delivery._id, {
        status: "succeeded",
        leaseExpiresAt: undefined,
        lastHttpStatus: args.httpStatus,
        lastErrorCode: undefined,
        deliveredAt: now,
        updatedAt: now,
      })
      await ctx.db.patch(endpoint._id, {
        consecutiveFailures: 0,
        lastSuccessAt: now,
        pausedReason: undefined,
        updatedAt: now,
      })
      return null
    }

    const failures = endpoint.consecutiveFailures + 1
    if (args.httpStatus === 410) {
      await ctx.db.patch(endpoint._id, {
        status: "disabled",
        consecutiveFailures: failures,
        lastFailureAt: now,
        pausedReason: "HTTP_410",
        updatedAt: now,
      })
      await ctx.db.patch(delivery._id, {
        status: "failed",
        leaseExpiresAt: undefined,
        lastHttpStatus: 410,
        lastErrorCode: "HTTP_410",
        updatedAt: now,
      })
      return null
    }

    const paused = failures >= 20
    await ctx.db.patch(endpoint._id, {
      ...(paused
        ? { status: "paused" as const, pausedReason: "TOO_MANY_FAILURES" }
        : {}),
      consecutiveFailures: failures,
      lastFailureAt: now,
      updatedAt: now,
    })
    const exhausted = delivery.attempts >= WEBHOOK_MAX_ATTEMPTS
    if (paused || exhausted) {
      await ctx.db.patch(delivery._id, {
        status: "failed",
        leaseExpiresAt: undefined,
        lastHttpStatus: args.httpStatus,
        lastErrorCode:
          args.errorCode ??
          (exhausted ? "RETRIES_EXHAUSTED" : "ENDPOINT_PAUSED"),
        updatedAt: now,
      })
      return null
    }
    const delay = webhookRetryDelayMs(
      delivery.attempts + 1,
      args.retryAfterMs,
      now - (delivery.attemptCycleStartedAt ?? delivery.createdAt),
    )
    await ctx.db.patch(delivery._id, {
      status: "retrying",
      leaseExpiresAt: undefined,
      nextAttemptAt: now + delay,
      lastHttpStatus: args.httpStatus,
      lastErrorCode: args.errorCode,
      updatedAt: now,
    })
    await ctx.scheduler.runAfter(
      delay,
      internal.webhooks.delivery.attemptDelivery,
      { deliveryId: delivery._id },
    )
    return null
  },
})

export const challengeData = internalQuery({
  args: {
    endpointId: v.id("webhookEndpoints"),
    challengeId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      id: v.id("webhookEndpoints"),
      clientId: v.string(),
      environment: v.union(v.literal("sandbox"), v.literal("production")),
      status: v.union(v.literal("pending"), v.literal("active")),
      url: v.string(),
      secretCiphertext: v.string(),
      secretIv: v.string(),
      previousSecretCiphertext: v.optional(v.string()),
      previousSecretIv: v.optional(v.string()),
      previousSecretValidUntil: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.endpointId)
    if (
      !row ||
      row.deletedAt !== undefined ||
      (row.status !== "pending" && row.status !== "active") ||
      row.challengeId !== args.challengeId
    ) {
      return null
    }
    return {
      id: row._id,
      clientId: row.appClientId,
      environment: row.environment,
      status: row.status,
      url: row.url,
      secretCiphertext: row.secretCiphertext,
      secretIv: row.secretIv,
      previousSecretCiphertext: row.previousSecretCiphertext,
      previousSecretIv: row.previousSecretIv,
      previousSecretValidUntil: row.previousSecretValidUntil,
    }
  },
})

export const completeChallenge = internalMutation({
  args: {
    endpointId: v.id("webhookEndpoints"),
    challengeId: v.string(),
    success: v.boolean(),
    errorCode: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.endpointId)
    if (
      !row ||
      row.deletedAt !== undefined ||
      row.challengeId !== args.challengeId
    ) {
      return null
    }
    const now = Date.now()
    await ctx.db.patch(
      row._id,
      args.success
        ? {
            status: "active",
            verifiedAt: now,
            challengeId: undefined,
            consecutiveFailures: 0,
            pausedReason: undefined,
            updatedAt: now,
          }
        : {
            status: row.verifiedAt ? "active" : "pending",
            challengeId: undefined,
            lastFailureAt: now,
            pausedReason: args.errorCode ?? "CHALLENGE_FAILED",
            updatedAt: now,
          },
    )
    return null
  },
})
