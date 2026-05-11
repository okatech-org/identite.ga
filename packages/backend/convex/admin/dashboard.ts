import { v } from "convex/values"

import { query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"
import {
  kycByStatus,
  usersByLoa,
  usersByProfile,
} from "../aggregates"
import { AUDIT_ACTIONS } from "../schema"

/**
 * Tableau de bord admin (§3.9 onglet 1).
 * Utilise les agrégats Convex (O(log N)) pour les KPIs.
 */

export const getDashboardKpis = query({
  args: {},
  returns: v.object({
    users: v.object({
      total: v.number(),
      byLoa: v.object({
        loa1: v.number(),
        loa2: v.number(),
        loa3: v.number(),
      }),
      byProfile: v.object({
        citizen: v.number(),
        resident: v.number(),
        visitor: v.number(),
        developer: v.number(),
      }),
    }),
    kyc: v.object({
      pending: v.number(),
      submitted: v.number(),
      underReview: v.number(),
      approved: v.number(),
      rejected: v.number(),
    }),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx)

    const [total, l1, l2, l3, c, r, vt, d] = await Promise.all([
      usersByLoa.count(ctx),
      usersByLoa.count(ctx, { bounds: { lower: { key: 1, inclusive: true }, upper: { key: 1, inclusive: true } } }),
      usersByLoa.count(ctx, { bounds: { lower: { key: 2, inclusive: true }, upper: { key: 2, inclusive: true } } }),
      usersByLoa.count(ctx, { bounds: { lower: { key: 3, inclusive: true }, upper: { key: 3, inclusive: true } } }),
      usersByProfile.count(ctx, { bounds: { lower: { key: "citizen", inclusive: true }, upper: { key: "citizen", inclusive: true } } }),
      usersByProfile.count(ctx, { bounds: { lower: { key: "resident", inclusive: true }, upper: { key: "resident", inclusive: true } } }),
      usersByProfile.count(ctx, { bounds: { lower: { key: "visitor", inclusive: true }, upper: { key: "visitor", inclusive: true } } }),
      usersByProfile.count(ctx, { bounds: { lower: { key: "developer", inclusive: true }, upper: { key: "developer", inclusive: true } } }),
    ])

    const [pending, submitted, underReview, approved, rejected] =
      await Promise.all([
        kycByStatus.count(ctx, { bounds: { lower: { key: "pending", inclusive: true }, upper: { key: "pending", inclusive: true } } }),
        kycByStatus.count(ctx, { bounds: { lower: { key: "submitted", inclusive: true }, upper: { key: "submitted", inclusive: true } } }),
        kycByStatus.count(ctx, { bounds: { lower: { key: "under_review", inclusive: true }, upper: { key: "under_review", inclusive: true } } }),
        kycByStatus.count(ctx, { bounds: { lower: { key: "approved", inclusive: true }, upper: { key: "approved", inclusive: true } } }),
        kycByStatus.count(ctx, { bounds: { lower: { key: "rejected", inclusive: true }, upper: { key: "rejected", inclusive: true } } }),
      ])

    return {
      users: {
        total,
        byLoa: { loa1: l1, loa2: l2, loa3: l3 },
        byProfile: { citizen: c, resident: r, visitor: vt, developer: d },
      },
      kyc: { pending, submitted, underReview, approved, rejected },
    }
  },
})

/**
 * Activité récente — 4 lignes (par défaut) issues de l'audit log.
 * Sert le bloc "Activité récente" du tableau de bord.
 */
export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("auditLog"),
      action: v.union(...AUDIT_ACTIONS.map((a) => v.literal(a))),
      targetType: v.string(),
      targetId: v.string(),
      actorId: v.optional(v.string()),
      metadata: v.optional(v.record(v.string(), v.any())),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const limit = Math.min(args.limit ?? 4, 20)
    const docs = await ctx.db
      .query("auditLog")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit)
    return docs.map((d) => ({
      _id: d._id,
      action: d.action,
      targetType: d.targetType,
      targetId: d.targetId,
      actorId: d.actorId,
      metadata: d.metadata,
      createdAt: d.createdAt,
    }))
  },
})

/**
 * Connexions par jour — buckets quotidiens des `login_success` sur les
 * `days` derniers jours (défaut 15, max 60). Renvoyé du plus ancien au
 * plus récent pour faciliter le rendu sparkline.
 */
export const getDailyLogins = query({
  args: { days: v.optional(v.number()) },
  returns: v.array(
    v.object({
      day: v.number(),
      count: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const days = Math.min(Math.max(args.days ?? 15, 1), 60)
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const firstBucket = startOfToday.getTime() - (days - 1) * dayMs

    const docs = await ctx.db
      .query("auditLog")
      .withIndex("by_action", (q) => q.eq("action", "login_success"))
      .order("desc")
      .take(5000)

    const buckets: number[] = new Array(days).fill(0)
    for (const d of docs) {
      if (d.createdAt < firstBucket) continue
      const idx = Math.floor((d.createdAt - firstBucket) / dayMs)
      if (idx >= 0 && idx < days) {
        buckets[idx] = (buckets[idx] ?? 0) + 1
      }
    }
    return buckets.map((count, i) => ({
      day: firstBucket + i * dayMs,
      count,
    }))
  },
})
