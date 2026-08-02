import { ConvexError, v } from "convex/values";

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { requireAuth } from "./lib/auth";

const SUBSCRIPTION = v.object({
  _id: v.id("pushSubscription"),
  endpoint: v.string(),
  p256dh: v.string(),
  auth: v.string(),
});

export const getMyStatus = query({
  args: {},
  returns: v.object({
    enabled: v.boolean(),
    subscriptionCount: v.number(),
    publicKey: v.string(),
    configured: v.boolean(),
  }),
  handler: async (ctx) => {
    const me = await requireAuth(ctx);
    const subscriptions = await ctx.db
      .query("pushSubscription")
      .withIndex("by_userId", (q) => q.eq("userId", me.userId))
      .take(25);
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim() ?? "";
    const privateKeyConfigured = Boolean(process.env.VAPID_PRIVATE_KEY?.trim());
    return {
      enabled: subscriptions.length > 0,
      subscriptionCount: subscriptions.length,
      publicKey,
      configured: publicKey.length > 0 && privateKeyConfigured,
    };
  },
});

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    userAgent: v.optional(v.string()),
  },
  returns: v.id("pushSubscription"),
  handler: async (ctx, args) => {
    const me = await requireAuth(ctx);
    let parsed: URL;
    try {
      parsed = new URL(args.endpoint);
    } catch {
      throw new ConvexError({
        code: "INVALID_ENDPOINT",
        message: "Abonnement invalide.",
      });
    }
    if (
      parsed.protocol !== "https:" ||
      args.p256dh.length < 16 ||
      args.auth.length < 8
    ) {
      throw new ConvexError({
        code: "INVALID_ENDPOINT",
        message: "Abonnement invalide.",
      });
    }
    const now = Date.now();
    const existing = await ctx.db
      .query("pushSubscription")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: me.userId,
        p256dh: args.p256dh,
        auth: args.auth,
        userAgent: args.userAgent?.slice(0, 300),
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("pushSubscription", {
      userId: me.userId,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      userAgent: args.userAgent?.slice(0, 300),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAuth(ctx);
    const existing = await ctx.db
      .query("pushSubscription")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();
    if (existing?.userId === me.userId) await ctx.db.delete(existing._id);
    return null;
  },
});

export const listForDelivery = internalQuery({
  args: { userId: v.string() },
  returns: v.array(SUBSCRIPTION),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("pushSubscription")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(25);
    return rows.map((row) => ({
      _id: row._id,
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
    }));
  },
});

export const deleteStale = internalMutation({
  args: {
    subscriptionId: v.id("pushSubscription"),
    endpoint: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.subscriptionId);
    if (row?.endpoint === args.endpoint) await ctx.db.delete(row._id);
    return null;
  },
});
