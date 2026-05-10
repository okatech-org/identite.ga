import { v } from "convex/values"

import { query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"
import {
  kycByStatus,
  usersByLoa,
  usersByProfile,
} from "../aggregates"

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
