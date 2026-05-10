import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { mutation, query } from "../_generated/server"
import { requireController } from "../lib/auth"

/**
 * Espace contrôleur — file de demandes KYC (§3.10 onglet 1).
 * MFA obligatoire (vérifiée au niveau Better Auth twoFactor).
 */

export const listPending = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("kycRequest"),
      userId: v.string(),
      documentType: v.string(),
      status: v.string(),
      score: v.optional(v.number()),
      faceMatchScore: v.optional(v.number()),
      submittedAt: v.optional(v.number()),
      reviewerId: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireController(ctx)
    const limit = Math.min(args.limit ?? 30, 100)
    const docs = await ctx.db
      .query("kycRequest")
      .withIndex("by_status", (q) => q.eq("status", "under_review"))
      .order("asc") // FIFO : plus ancien d'abord
      .take(limit)
    return docs.map((d) => ({
      _id: d._id,
      userId: d.userId,
      documentType: d.documentType,
      status: d.status,
      score: d.score,
      faceMatchScore: d.faceMatchScore,
      submittedAt: d.submittedAt,
      reviewerId: d.reviewerId,
    }))
  },
})

export const claim = mutation({
  args: { kycRequestId: v.id("kycRequest") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx)
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc) throw new ConvexError({ code: "NOT_FOUND", message: "Demande introuvable." })
    if (kyc.reviewerId && kyc.reviewerId !== controller.userId) {
      throw new ConvexError({
        code: "ALREADY_CLAIMED",
        message: "Demande déjà assignée à un autre contrôleur.",
      })
    }
    await ctx.db.patch(args.kycRequestId, {
      reviewerId: controller.userId,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const approve = mutation({
  args: {
    kycRequestId: v.id("kycRequest"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx)
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc) throw new ConvexError({ code: "NOT_FOUND", message: "Demande introuvable." })

    const now = Date.now()
    await ctx.db.patch(args.kycRequestId, {
      status: "approved",
      reviewerId: controller.userId,
      reviewedAt: now,
      updatedAt: now,
    })
    await ctx.db.insert("kycReview", {
      kycRequestId: args.kycRequestId,
      reviewerId: controller.userId,
      decision: "approved",
      notes: args.notes,
      createdAt: now,
    })

    // Upgrade LoA → 2
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", kyc.userId))
      .unique()
    if (profile) {
      await ctx.db.patch(profile._id, { loa: 2, updatedAt: now })
    }

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: controller.userId,
      action: "kyc_approved",
      targetType: "kyc",
      targetId: args.kycRequestId,
      metadata: { auto: false },
    })
    return null
  },
})

export const reject = mutation({
  args: {
    kycRequestId: v.id("kycRequest"),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx)
    if (args.reason.trim().length < 5) {
      throw new ConvexError({
        code: "INVALID",
        message: "Motif de rejet trop court.",
      })
    }
    const now = Date.now()
    await ctx.db.patch(args.kycRequestId, {
      status: "rejected",
      reviewerId: controller.userId,
      reviewedAt: now,
      rejectionReason: args.reason.trim(),
      updatedAt: now,
    })
    await ctx.db.insert("kycReview", {
      kycRequestId: args.kycRequestId,
      reviewerId: controller.userId,
      decision: "rejected",
      notes: args.reason.trim(),
      createdAt: now,
    })
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: controller.userId,
      action: "kyc_rejected",
      targetType: "kyc",
      targetId: args.kycRequestId,
      metadata: { reason: args.reason.trim() },
    })
    return null
  },
})
