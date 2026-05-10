import { v } from "convex/values"

import { query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"
import { PROFILE_TYPES } from "../schema"

/**
 * Liste / recherche comptes IDN — §3.9 onglet "Comptes IDN".
 * Phase 1 scaffold : pagination simple sur userProfile.
 * Le détail user (email, sessions, audit) sera enrichi en croisant Better Auth.
 */

export const listProfiles = query({
  args: {
    profileType: v.optional(v.union(...PROFILE_TYPES.map((t) => v.literal(t)))),
    loa: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("userProfile"),
      userId: v.string(),
      profileType: v.string(),
      loa: v.number(),
      hasPivot: v.boolean(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const limit = Math.min(args.limit ?? 50, 200)

    let docs
    if (args.profileType) {
      const pt = args.profileType
      docs = await ctx.db
        .query("userProfile")
        .withIndex("by_profileType", (q) => q.eq("profileType", pt))
        .order("desc")
        .take(limit)
    } else if (args.loa) {
      const loa = args.loa
      docs = await ctx.db
        .query("userProfile")
        .withIndex("by_loa", (q) => q.eq("loa", loa))
        .order("desc")
        .take(limit)
    } else {
      docs = await ctx.db.query("userProfile").order("desc").take(limit)
    }

    return docs.map((d) => ({
      _id: d._id,
      userId: d.userId,
      profileType: d.profileType,
      loa: d.loa,
      hasPivot: !!d.pivot,
      createdAt: d.createdAt,
    }))
  },
})

// TODO(idn): getProfileDetail(userId) — joint Better Auth user + sessions +
// kyc history + roles + recent audit logs.
