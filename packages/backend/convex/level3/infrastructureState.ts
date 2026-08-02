import { v } from "convex/values"

import { internalMutation, internalQuery } from "../_generated/server"

const ACTIVITY_KEY = "runtime.livekit.activity"
const SOURCE = v.union(v.literal("token_request"), v.literal("active_rooms"))

/** Enregistre la dernière demande ou activité LiveKit observée. */
export const recordActivity = internalMutation({
  args: { source: SOURCE },
  returns: v.number(),
  handler: async (ctx, args) => {
    const now = Date.now()
    const existing = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", ACTIVITY_KEY))
      .unique()
    const value = { lastActivityAt: now, source: args.source }
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedAt: now })
    } else {
      await ctx.db.insert("systemConfig", {
        key: ACTIVITY_KEY,
        value,
        updatedAt: now,
      })
    }
    return now
  },
})

/** Lit l'horodatage utilisé par la protection anti-extinction prématurée. */
export const getActivity = internalQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      lastActivityAt: v.number(),
      source: SOURCE,
    }),
  ),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", ACTIVITY_KEY))
      .unique()
    const lastActivityAt = existing?.value.lastActivityAt
    const source = existing?.value.source
    if (
      typeof lastActivityAt !== "number" ||
      (source !== "token_request" && source !== "active_rooms")
    ) {
      return null
    }
    return { lastActivityAt, source }
  },
})
