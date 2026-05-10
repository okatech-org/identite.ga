import { v } from "convex/values"

import { internal } from "../_generated/api"
import { internalMutation } from "../_generated/server"

/**
 * Mutations internes appelées par le workflow KYC.
 * Maintenues isolées des mutations publiques (`convex/kyc.ts`) pour clarté.
 */

export const approveAuto = internalMutation({
  args: {
    kycRequestId: v.id("kycRequest"),
    score: v.number(),
    faceMatchScore: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now()
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc) throw new Error("KYC request not found")

    await ctx.db.patch(args.kycRequestId, {
      status: "approved",
      score: args.score,
      faceMatchScore: args.faceMatchScore,
      reviewedAt: now,
      updatedAt: now,
    })

    // Upgrade LoA → 2 sur le profil utilisateur
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", kyc.userId))
      .unique()
    if (profile) {
      await ctx.db.patch(profile._id, {
        loa: 2,
        updatedAt: now,
      })
    }

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: undefined, // action système (workflow)
      action: "kyc_approved",
      targetType: "kyc",
      targetId: args.kycRequestId,
      metadata: { auto: true, score: args.score },
    })
  },
})

export const enqueueForReview = internalMutation({
  args: {
    kycRequestId: v.id("kycRequest"),
    score: v.number(),
    faceMatchScore: v.number(),
    livenessVerdict: v.union(
      v.literal("real"),
      v.literal("spoof"),
      v.literal("uncertain"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now()
    await ctx.db.patch(args.kycRequestId, {
      status: "under_review",
      score: args.score,
      faceMatchScore: args.faceMatchScore,
      livenessVerdict: args.livenessVerdict,
      updatedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: undefined,
      action: "kyc_under_review",
      targetType: "kyc",
      targetId: args.kycRequestId,
      metadata: { score: args.score, faceMatch: args.faceMatchScore },
    })
  },
})
