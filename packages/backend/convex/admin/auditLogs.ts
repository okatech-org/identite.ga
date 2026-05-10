import { v } from "convex/values"

import { query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"
import { AUDIT_ACTIONS } from "../schema"

/**
 * Logs & audit — Console admin (§3.9 onglet 5).
 */

const ACTION = v.union(...AUDIT_ACTIONS.map((a) => v.literal(a)))

export const list = query({
  args: {
    action: v.optional(ACTION),
    actorId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("auditLog"),
      actorId: v.optional(v.string()),
      action: v.string(),
      targetType: v.string(),
      targetId: v.string(),
      ip: v.optional(v.string()),
      metadata: v.optional(v.record(v.string(), v.any())),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const limit = Math.min(args.limit ?? 100, 500)

    let docs
    if (args.action) {
      const a = args.action
      docs = await ctx.db
        .query("auditLog")
        .withIndex("by_action", (q) => q.eq("action", a))
        .order("desc")
        .take(limit)
    } else if (args.actorId) {
      const aid = args.actorId
      docs = await ctx.db
        .query("auditLog")
        .withIndex("by_actor", (q) => q.eq("actorId", aid))
        .order("desc")
        .take(limit)
    } else {
      docs = await ctx.db
        .query("auditLog")
        .withIndex("by_createdAt")
        .order("desc")
        .take(limit)
    }

    return docs.map((d) => ({
      _id: d._id,
      actorId: d.actorId,
      action: d.action,
      targetType: d.targetType,
      targetId: d.targetId,
      ip: d.ip,
      metadata: d.metadata,
      createdAt: d.createdAt,
    }))
  },
})
