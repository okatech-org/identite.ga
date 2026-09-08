import { ConvexError, v } from "convex/values"

import { internalMutation, internalQuery, mutation } from "./_generated/server"
import { requireAuth } from "./lib/auth"

const EXPO_PUSH_TOKEN = /^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/

export const subscribe = mutation({
  args: {
    token: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android")),
    deviceName: v.optional(v.string()),
  },
  returns: v.id("nativePushSubscription"),
  handler: async (ctx, args) => {
    const me = await requireAuth(ctx)
    if (!EXPO_PUSH_TOKEN.test(args.token)) {
      throw new ConvexError({
        code: "INVALID_PUSH_TOKEN",
        message: "Jeton de notification invalide.",
      })
    }
    const now = Date.now()
    const existing = await ctx.db
      .query("nativePushSubscription")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: me.userId,
        platform: args.platform,
        deviceName: args.deviceName?.slice(0, 200),
        updatedAt: now,
      })
      return existing._id
    }
    return await ctx.db.insert("nativePushSubscription", {
      userId: me.userId,
      token: args.token,
      platform: args.platform,
      deviceName: args.deviceName?.slice(0, 200),
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const unsubscribe = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAuth(ctx)
    const existing = await ctx.db
      .query("nativePushSubscription")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique()
    if (existing?.userId === me.userId) await ctx.db.delete(existing._id)
    return null
  },
})

export const listForDelivery = internalQuery({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("nativePushSubscription"),
      token: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("nativePushSubscription")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(25)
    return rows.map((row) => ({ _id: row._id, token: row.token }))
  },
})

export const deleteStale = internalMutation({
  args: {
    subscriptionId: v.id("nativePushSubscription"),
    token: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.subscriptionId)
    if (row?.token === args.token) await ctx.db.delete(row._id)
    return null
  },
})
