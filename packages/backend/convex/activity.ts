import { v } from "convex/values"

import { query } from "./_generated/server"
import { requireAuth } from "./lib/auth"

/**
 * Historique d'activité utilisateur (§3.4 — Paramètres / Activité).
 * Lit `auditLog` filtré sur l'acteur courant.
 */

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("auditLog"),
      action: v.string(),
      targetType: v.string(),
      targetId: v.string(),
      ip: v.optional(v.string()),
      metadata: v.optional(v.record(v.string(), v.any())),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const limit = Math.min(args.limit ?? 50, 200)
    const docs = await ctx.db
      .query("auditLog")
      .withIndex("by_actor", (q) => q.eq("actorId", user.userId))
      .order("desc")
      .take(limit)
    return docs.map((d) => ({
      _id: d._id,
      action: d.action,
      targetType: d.targetType,
      targetId: d.targetId,
      ip: d.ip,
      metadata: d.metadata,
      createdAt: d.createdAt,
    }))
  },
})

// TODO(idn): exportMineAsCsv / exportMineAsJson — action async qui paginé tous
// les logs et retourne une URL téléchargeable signée. Itération suivante.
