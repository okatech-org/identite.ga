import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import { mutation, query } from "./_generated/server"
import { workflow } from "./kyc/workflow"
import { requireVerifiedAuth } from "./lib/auth"
import { rateLimiter } from "./rateLimiter"
import { KYC_DOCUMENT_TYPES } from "./schema"

/**
 * Mutations / queries publiques KYC (§3.5).
 * Le workflow Convex orchestre OCR + biométrie + revue manuelle.
 */

const DOC_TYPE = v.union(...KYC_DOCUMENT_TYPES.map((t) => v.literal(t)))

export const initialize = mutation({
  args: { documentType: DOC_TYPE },
  returns: v.object({ kycRequestId: v.id("kycRequest") }),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)

    await rateLimiter.limit(ctx, "kycSubmit", {
      key: user.userId,
      throws: true,
    })

    const now = Date.now()
    const kycRequestId = await ctx.db.insert("kycRequest", {
      userId: user.userId,
      documentType: args.documentType,
      documentImages: {},
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    return { kycRequestId }
  },
})

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireVerifiedAuth(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const setDocumentImage = mutation({
  args: {
    kycRequestId: v.id("kycRequest"),
    side: v.union(v.literal("front"), v.literal("back")),
    storageRef: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc || kyc.userId !== user.userId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Demande introuvable." })
    }
    if (kyc.status !== "pending") {
      throw new ConvexError({
        code: "ALREADY_SUBMITTED",
        message: "Cette demande ne peut plus être modifiée.",
      })
    }
    await ctx.db.patch(args.kycRequestId, {
      documentImages: {
        ...kyc.documentImages,
        [args.side]: args.storageRef,
      },
      updatedAt: Date.now(),
    })
    return null
  },
})

export const setSelfie = mutation({
  args: {
    kycRequestId: v.id("kycRequest"),
    storageRef: v.id("_storage"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc || kyc.userId !== user.userId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Demande introuvable." })
    }
    if (kyc.status !== "pending") {
      throw new ConvexError({
        code: "ALREADY_SUBMITTED",
        message: "Cette demande ne peut plus être modifiée.",
      })
    }
    await ctx.db.patch(args.kycRequestId, {
      selfieImage: args.storageRef,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const submit = mutation({
  args: { kycRequestId: v.id("kycRequest") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc || kyc.userId !== user.userId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Demande introuvable." })
    }
    if (!kyc.documentImages.front || !kyc.selfieImage) {
      throw new ConvexError({
        code: "INCOMPLETE",
        message: "Document recto et selfie requis.",
      })
    }

    const now = Date.now()
    await ctx.db.patch(args.kycRequestId, {
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "kyc_submitted",
      targetType: "kyc",
      targetId: args.kycRequestId,
    })

    // Lance le workflow asynchrone (OCR + biométrie + revue)
    await workflow.start(ctx, internal.kyc.workflow.kycLevel2, {
      userId: user.userId,
      kycRequestId: args.kycRequestId,
    })

    return null
  },
})

export const getMyLatest = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("kycRequest"),
      documentType: v.string(),
      status: v.string(),
      score: v.optional(v.number()),
      faceMatchScore: v.optional(v.number()),
      submittedAt: v.optional(v.number()),
      reviewedAt: v.optional(v.number()),
      rejectionReason: v.optional(v.string()),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const user = await requireVerifiedAuth(ctx)
    const docs = await ctx.db
      .query("kycRequest")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .order("desc")
      .take(1)
    const latest = docs[0]
    if (!latest) return null
    return {
      _id: latest._id,
      documentType: latest.documentType,
      status: latest.status,
      score: latest.score,
      faceMatchScore: latest.faceMatchScore,
      submittedAt: latest.submittedAt,
      reviewedAt: latest.reviewedAt,
      rejectionReason: latest.rejectionReason,
      createdAt: latest.createdAt,
    }
  },
})
