import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireAuth } from "./lib/auth"

/**
 * Notifications in-app (cf. §3.4).
 */

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("notification"),
      title: v.string(),
      body: v.string(),
      category: v.string(),
      readAt: v.optional(v.number()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const limit = Math.min(args.limit ?? 20, 100)
    const docs = await ctx.db
      .query("notification")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .order("desc")
      .take(limit)
    return docs.map((d) => ({
      _id: d._id,
      title: d.title,
      body: d.body,
      category: d.category,
      readAt: d.readAt,
      createdAt: d.createdAt,
    }))
  },
})

export const markRead = mutation({
  args: { notificationId: v.id("notification") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const notif = await ctx.db.get(args.notificationId)
    if (!notif || notif.userId !== user.userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Notification introuvable.",
      })
    }
    if (!notif.readAt) {
      await ctx.db.patch(args.notificationId, { readAt: Date.now() })
    }
    return null
  },
})
