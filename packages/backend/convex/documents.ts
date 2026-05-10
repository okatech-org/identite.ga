import { v } from "convex/values"

import { query } from "./_generated/server"
import { getCurrentAuthUser } from "./lib/auth"
import { USER_DOCUMENT_TYPES } from "./schema"

/**
 * Documents utilisateur (§3.4 — Paramètres / Documents).
 * Liste les pièces fournies par l'utilisateur (photo profil, KYC, attestations).
 */

export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("userDocument"),
      type: v.union(...USER_DOCUMENT_TYPES.map((t) => v.literal(t))),
      mimeType: v.string(),
      sha256: v.string(),
      expiresAt: v.optional(v.number()),
      createdAt: v.number(),
      url: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    // Lecture gracieuse (pas de throw au mount).
    const user = await getCurrentAuthUser(ctx)
    if (!user) return []

    const docs = await ctx.db
      .query("userDocument")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .order("desc")
      .collect()

    return await Promise.all(
      docs.map(async (d) => ({
        _id: d._id,
        type: d.type,
        mimeType: d.mimeType,
        sha256: d.sha256,
        expiresAt: d.expiresAt,
        createdAt: d.createdAt,
        url: await ctx.storage.getUrl(d.storageRef),
      })),
    )
  },
})
