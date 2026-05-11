import { v } from "convex/values"

import { components } from "../_generated/api"
import { query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"
import { PROFILE_TYPES } from "../schema"

/**
 * Liste comptes IDN — §3.9 onglet "Comptes IDN".
 * Joint userProfile + Better Auth user pour email & nom.
 */

const PROFILE_TYPE = v.union(...PROFILE_TYPES.map((t) => v.literal(t)))

export const listProfiles = query({
  args: {
    profileType: v.optional(PROFILE_TYPE),
    loa: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("userProfile"),
      userId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
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

    const results: Array<{
      _id: (typeof docs)[number]["_id"]
      userId: string
      email: string
      name?: string
      profileType: string
      loa: number
      hasPivot: boolean
      createdAt: number
    }> = []
    for (const d of docs) {
      const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "user",
        where: [{ field: "_id", value: d.userId }],
      })) as { email?: string; name?: string } | null
      results.push({
        _id: d._id,
        userId: d.userId,
        email: user?.email ?? "",
        name: user?.name,
        profileType: d.profileType,
        loa: d.loa,
        hasPivot: !!d.pivot,
        createdAt: d.createdAt,
      })
    }
    return results
  },
})

export const totalAccounts = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const all = await ctx.db.query("userProfile").collect()
    return all.length
  },
})
