import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { internal } from "../_generated/api"
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server"
import { isWebhookDeliveryAuthorized } from "./authorization"

const EVENT_SUMMARY = v.object({
  id: v.id("webhookEvents"),
  authorization: v.union(v.literal("oauth_user"), v.literal("m2m")),
  subject: v.optional(v.string()),
  authorizationSubject: v.optional(v.string()),
  requiredScope: v.string(),
})

const ENDPOINT_SUMMARY = v.object({
  id: v.id("webhookEndpoints"),
  appClientId: v.string(),
  environment: v.union(v.literal("sandbox"), v.literal("production")),
  status: v.union(
    v.literal("pending"),
    v.literal("active"),
    v.literal("paused"),
    v.literal("disabled"),
  ),
})

export const getFanoutPage = internalQuery({
  args: {
    eventId: v.id("webhookEvents"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.union(
    v.null(),
    v.object({
      event: EVENT_SUMMARY,
      endpoints: v.array(ENDPOINT_SUMMARY),
      continueCursor: v.string(),
      isDone: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (!event) return null
    const page = await ctx.db
      .query("webhookSubscriptions")
      .withIndex("by_eventType_and_endpointId", (q) =>
        q.eq("eventType", event.type),
      )
      .paginate(args.paginationOpts)
    const endpoints = []
    for (const subscription of page.page) {
      const endpoint = await ctx.db.get(subscription.endpointId)
      if (!endpoint || endpoint.deletedAt !== undefined) continue
      endpoints.push({
        id: endpoint._id,
        appClientId: endpoint.appClientId,
        environment: endpoint.environment,
        status: endpoint.status,
      })
    }
    return {
      event: {
        id: event._id,
        authorization: event.authorization,
        subject: event.subject,
        authorizationSubject: event.authorizationSubject,
        requiredScope: event.requiredScope,
      },
      endpoints,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

export const hasActiveM2mScope = internalQuery({
  args: {
    appClientId: v.string(),
    requiredScope: v.string(),
    now: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("developerApiKey")
      .withIndex("by_appClientId_and_createdAt", (q) =>
        q.eq("appClientId", args.appClientId),
      )
      .order("desc")
      .take(100)
    return rows.some(
      (row) =>
        row.revokedAt === undefined &&
        (row.expiresAt === undefined || row.expiresAt >= args.now) &&
        row.scopes.includes(args.requiredScope),
    )
  },
})

export const createDelivery = internalMutation({
  args: {
    eventId: v.id("webhookEvents"),
    endpointId: v.id("webhookEndpoints"),
  },
  returns: v.union(v.id("webhookDeliveries"), v.null()),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    const endpoint = await ctx.db.get(args.endpointId)
    if (!event || !endpoint || endpoint.status !== "active") return null
    const subscription = await ctx.db
      .query("webhookSubscriptions")
      .withIndex("by_endpointId_and_eventType", (q) =>
        q.eq("endpointId", endpoint._id).eq("eventType", event.type),
      )
      .unique()
    if (!subscription) return null
    const existing = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_eventId_and_endpointId", (q) =>
        q.eq("eventId", event._id).eq("endpointId", endpoint._id),
      )
      .unique()
    if (existing) return existing._id
    const now = Date.now()
    const deliveryId = await ctx.db.insert("webhookDeliveries", {
      eventId: event._id,
      endpointId: endpoint._id,
      appClientId: endpoint.appClientId,
      status: "pending",
      attempts: 0,
      attemptCycleStartedAt: now,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    })
    await ctx.scheduler.runAfter(
      0,
      internal.webhooks.delivery.attemptDelivery,
      {
        deliveryId,
      },
    )
    return deliveryId
  },
})

export const completeFanout = internalMutation({
  args: { eventId: v.id("webhookEvents") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId)
    if (event) {
      await ctx.db.patch(event._id, {
        fanoutStatus: "completed",
        fanoutCompletedAt: Date.now(),
      })
    }
    return null
  },
})

export const fanoutEvent = internalAction({
  args: {
    eventId: v.id("webhookEvents"),
    cursor: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await ctx.runQuery(internal.webhooks.dispatch.getFanoutPage, {
      eventId: args.eventId,
      paginationOpts: { numItems: 100, cursor: args.cursor ?? null },
    })
    if (!page) return null
    for (const endpoint of page.endpoints) {
      if (await isWebhookDeliveryAuthorized(ctx, page.event, endpoint)) {
        await ctx.runMutation(internal.webhooks.dispatch.createDelivery, {
          eventId: page.event.id,
          endpointId: endpoint.id,
        })
      }
    }
    if (page.isDone) {
      await ctx.runMutation(internal.webhooks.dispatch.completeFanout, {
        eventId: args.eventId,
      })
    } else {
      await ctx.scheduler.runAfter(0, internal.webhooks.dispatch.fanoutEvent, {
        eventId: args.eventId,
        cursor: page.continueCursor,
      })
    }
    return null
  },
})

export const recoverPending = internalMutation({
  args: {},
  returns: v.object({ scheduled: v.number() }),
  handler: async (ctx) => {
    const now = Date.now()
    let scheduled = 0
    for (const status of ["pending", "retrying"] as const) {
      const rows = await ctx.db
        .query("webhookDeliveries")
        .withIndex("by_status_and_nextAttemptAt", (q) =>
          q.eq("status", status).lte("nextAttemptAt", now),
        )
        .take(50)
      for (const row of rows) {
        await ctx.scheduler.runAfter(
          0,
          internal.webhooks.delivery.attemptDelivery,
          { deliveryId: row._id },
        )
        scheduled++
      }
    }
    const leased = await ctx.db
      .query("webhookDeliveries")
      .withIndex("by_status_and_nextAttemptAt", (q) =>
        q.eq("status", "delivering"),
      )
      .take(100)
    for (const row of leased) {
      if ((row.leaseExpiresAt ?? Number.POSITIVE_INFINITY) > now) continue
      await ctx.db.patch(row._id, {
        status: "retrying",
        nextAttemptAt: now,
        leaseExpiresAt: undefined,
        updatedAt: now,
      })
      await ctx.scheduler.runAfter(
        0,
        internal.webhooks.delivery.attemptDelivery,
        { deliveryId: row._id },
      )
      scheduled++
    }
    const events = await ctx.db
      .query("webhookEvents")
      .withIndex("by_fanoutStatus_and_createdAt", (q) =>
        q.eq("fanoutStatus", "pending"),
      )
      .take(50)
    for (const event of events) {
      await ctx.scheduler.runAfter(0, internal.webhooks.dispatch.fanoutEvent, {
        eventId: event._id,
      })
      scheduled++
    }
    return { scheduled }
  },
})

export const pruneExpired = internalMutation({
  args: {},
  returns: v.object({ events: v.number(), deliveries: v.number() }),
  handler: async (ctx) => {
    const expired = await ctx.db
      .query("webhookEvents")
      .withIndex("by_expiresAt", (q) => q.lt("expiresAt", Date.now()))
      .take(50)
    let deliveries = 0
    for (const event of expired) {
      const rows = await ctx.db
        .query("webhookDeliveries")
        .withIndex("by_eventId_and_endpointId", (q) =>
          q.eq("eventId", event._id),
        )
        .take(500)
      for (const row of rows) {
        await ctx.db.delete(row._id)
        deliveries++
      }
      await ctx.db.delete(event._id)
    }
    return { events: expired.length, deliveries }
  },
})
