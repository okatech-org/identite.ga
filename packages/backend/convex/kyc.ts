import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import { query } from "./_generated/server"
import { mutation } from "./functions"
import { workflow } from "./kyc/workflow"
import { getCurrentAuthUser, requireVerifiedAuth } from "./lib/auth"
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
    if (kyc.status !== "pending" && kyc.status !== "complement_required") {
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
    if (kyc.status !== "pending" && kyc.status !== "complement_required") {
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

/**
 * Citoyen — détail complet de sa demande KYC en cours (page /kyc/request).
 *
 * Renvoie le statut courant + URLs signées des documents + timeline
 * d'événements (audit log filtré sur cette cible) + message du contrôleur
 * si un complément a été demandé.
 *
 * `null` si l'utilisateur n'a aucune demande KYC.
 */
const ACTIVE_REQUEST = v.object({
  _id: v.id("kycRequest"),
  documentType: v.string(),
  status: v.string(),
  score: v.optional(v.number()),
  faceMatchScore: v.optional(v.number()),
  submittedAt: v.optional(v.number()),
  reviewedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  /** Document recto / verso / selfie — URLs signées Convex Storage. */
  docFrontUrl: v.union(v.string(), v.null()),
  docBackUrl: v.union(v.string(), v.null()),
  selfieUrl: v.union(v.string(), v.null()),
  complementRequest: v.optional(
    v.object({
      message: v.string(),
      requestedAt: v.number(),
    }),
  ),
  timeline: v.array(
    v.object({
      action: v.string(),
      createdAt: v.number(),
      metadata: v.optional(v.record(v.string(), v.any())),
    }),
  ),
})

export const getActiveRequest = query({
  args: {},
  returns: v.union(ACTIVE_REQUEST, v.null()),
  handler: async (ctx) => {
    const user = await getCurrentAuthUser(ctx)
    if (!user) return null

    const latest = await ctx.db
      .query("kycRequest")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .order("desc")
      .first()
    if (!latest) return null

    const [docFrontUrl, docBackUrl, selfieUrl] = await Promise.all([
      latest.documentImages.front
        ? ctx.storage.getUrl(latest.documentImages.front)
        : Promise.resolve(null),
      latest.documentImages.back
        ? ctx.storage.getUrl(latest.documentImages.back)
        : Promise.resolve(null),
      latest.selfieImage
        ? ctx.storage.getUrl(latest.selfieImage)
        : Promise.resolve(null),
    ])

    const auditEntries = await ctx.db
      .query("auditLog")
      .withIndex("by_target", (q) =>
        q.eq("targetType", "kyc").eq("targetId", latest._id),
      )
      .order("asc")
      .collect()

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
      updatedAt: latest.updatedAt,
      docFrontUrl,
      docBackUrl,
      selfieUrl,
      complementRequest: latest.complementRequest
        ? {
            message: latest.complementRequest.message,
            requestedAt: latest.complementRequest.requestedAt,
          }
        : undefined,
      timeline: auditEntries.map((e) => ({
        action: e.action,
        createdAt: e.createdAt,
        metadata: e.metadata,
      })),
    }
  },
})

/**
 * Citoyen — repasse la demande en `under_review` après ré-upload
 * suite à un complément demandé par le contrôleur.
 */
export const respondComplement = mutation({
  args: { kycRequestId: v.id("kycRequest") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc || kyc.userId !== user.userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Demande introuvable.",
      })
    }
    if (kyc.status !== "complement_required") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cette demande n'est pas en attente de complément.",
      })
    }
    if (!kyc.documentImages.front || !kyc.selfieImage) {
      throw new ConvexError({
        code: "INCOMPLETE",
        message: "Document recto et selfie requis.",
      })
    }

    const now = Date.now()
    await ctx.db.patch(args.kycRequestId, {
      status: "under_review",
      complementRequest: undefined,
      updatedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "kyc_complement_provided",
      targetType: "kyc",
      targetId: args.kycRequestId,
    })
    // Notifie le contrôleur assigné que la demande est de retour dans
    // sa file d'attente (in-app + email selon prefs). Si aucun
    // reviewerId n'est encore assigné — cas théorique — on saute.
    if (kyc.reviewerId) {
      await ctx.runMutation(internal.notifications.dispatchKyc, {
        userId: kyc.reviewerId,
        kind: "complement_provided",
        kycRequestId: args.kycRequestId,
      })
    }
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
    // Lecture gracieuse pour éviter UNAUTHENTICATED / EMAIL_NOT_VERIFIED
    // au mount des pages /profile et /kyc.
    const user = await getCurrentAuthUser(ctx)
    if (!user) return null
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
