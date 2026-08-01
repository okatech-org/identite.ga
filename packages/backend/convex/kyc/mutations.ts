import { v } from "convex/values"

import { internal } from "../_generated/api"
import { internalQuery } from "../_generated/server"
import { internalMutation } from "../functions"

/**
 * Mutations internes appelées par le workflow KYC.
 * Maintenues isolées des mutations publiques (`convex/kyc.ts`) pour clarté.
 */

/**
 * Approbation automatique du workflow (`kyc/workflow.ts`) — upgrade le LoA
 * du citoyen à 2. Idempotente sur les états terminaux : SI la demande est
 * déjà `approved` OU `rejected`, ne fait RIEN (early-return). C'est une
 * garde de sécurité critique — sans elle, un rejeu de step / un nouveau
 * `submit()` sur une demande déjà `rejected` (rejet humain pour fraude,
 * ex. via `controller.queue.reject`) pourrait relancer le workflow et faire
 * remonter `approved` + LoA 2 sur des scores auto favorables, écrasant
 * silencieusement une décision de rejet humaine sans nouvelle revue. Cf.
 * `rejectAuto`, garde symétrique.
 */
export const approveAuto = internalMutation({
  args: {
    kycRequestId: v.id("kycRequest"),
    score: v.number(),
    faceMatchScore: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc) throw new Error("KYC request not found")

    if (kyc.status === "approved" || kyc.status === "rejected") {
      return null
    }

    const now = Date.now()
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
    await ctx.runMutation(internal.notifications.dispatchKyc, {
      userId: kyc.userId,
      kind: "approved",
      kycRequestId: args.kycRequestId,
    })
    return null
  },
})

/**
 * Rejet automatique du workflow (`kyc/workflow.ts`) — notamment sur
 * détection de spoof (anti-usurpation) par le service d'inférence biométrique
 * auto-hébergé. Ne modifie JAMAIS le LoA (contrairement à `approveAuto`).
 *
 * Idempotente sur les états terminaux : un retry de step / rejeu du workflow
 * après une décision déjà `approved`/`rejected` ne ré-écrit rien.
 */
export const rejectAuto = internalMutation({
  args: {
    kycRequestId: v.id("kycRequest"),
    rejectionReason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc) throw new Error("KYC request not found")

    if (kyc.status === "approved" || kyc.status === "rejected") {
      return null
    }

    const now = Date.now()
    await ctx.db.patch(args.kycRequestId, {
      status: "rejected",
      rejectionReason: args.rejectionReason,
      reviewedAt: now,
      updatedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: undefined, // action système (workflow)
      action: "kyc_rejected",
      targetType: "kyc",
      targetId: args.kycRequestId,
      metadata: { auto: true, reason: args.rejectionReason },
    })
    await ctx.runMutation(internal.notifications.dispatchKyc, {
      userId: kyc.userId,
      kind: "rejected",
      kycRequestId: args.kycRequestId,
      detail: args.rejectionReason,
    })
    return null
  },
})

/**
 * Lecture minimale d'une demande KYC pour le pipeline d'inférence
 * auto-hébergé (`kyc/actions.ts`, actions "use node" — pas d'accès direct
 * à `ctx.db`). Isolée ici (fichier sans "use node") pour rester appelable
 * via `ctx.runQuery` depuis les actions.
 */
export const _getForInference = internalQuery({
  args: { kycRequestId: v.id("kycRequest") },
  returns: v.union(
    v.object({
      documentType: v.string(),
      documentImages: v.object({
        front: v.optional(v.id("_storage")),
        back: v.optional(v.id("_storage")),
      }),
      selfieImage: v.optional(v.id("_storage")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc) return null
    return {
      documentType: kyc.documentType,
      documentImages: kyc.documentImages,
      selfieImage: kyc.selfieImage,
    }
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
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc) throw new Error("Demande KYC introuvable")

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

    // Le citoyen doit savoir que son dossier part en revue manuelle : sans ce
    // dispatch il reste sans nouvelle jusqu'à la décision de l'agent, qui peut
    // prendre des jours (et c'est le chemin par défaut tant que l'OCR CNI
    // n'est pas calibré).
    await ctx.runMutation(internal.notifications.dispatchKyc, {
      userId: kyc.userId,
      kind: "under_review",
      kycRequestId: args.kycRequestId,
    })
  },
})
