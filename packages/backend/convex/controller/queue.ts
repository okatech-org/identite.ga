import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { query } from "../_generated/server"
import { mutation } from "../functions"
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

const PRIORITY_THRESHOLD_MS = 60 * 60 * 1000 // > 1h en attente → "haute"
const TARGET_LOA = 2 as const // KYC L2 — cf. workflow approveAuto

const QUEUE_ITEM = v.object({
  _id: v.id("kycRequest"),
  ref: v.string(),
  name: v.string(),
  documentType: v.string(),
  targetLoa: v.union(v.literal(1), v.literal(2), v.literal(3)),
  priority: v.union(v.literal("haute"), v.literal("normale")),
  submittedAt: v.optional(v.number()),
  reviewerId: v.optional(v.string()),
})

export const listPendingEnriched = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(QUEUE_ITEM),
  handler: async (ctx, args) => {
    await requireController(ctx)
    const limit = Math.min(args.limit ?? 30, 100)
    const docs = await ctx.db
      .query("kycRequest")
      .withIndex("by_status", (q) => q.eq("status", "under_review"))
      .order("asc")
      .take(limit)

    const now = Date.now()
    const results = await Promise.all(
      docs.map(async (d) => {
        const profile = await ctx.db
          .query("userProfile")
          .withIndex("by_userId", (q) => q.eq("userId", d.userId))
          .unique()
        const firstName = profile?.pivot?.firstName ?? ""
        const lastName = profile?.pivot?.lastName ?? ""
        const name = [firstName, lastName].filter(Boolean).join(" ") || "—"
        const ageMs = now - (d.submittedAt ?? d._creationTime)
        const priority: "haute" | "normale" =
          ageMs > PRIORITY_THRESHOLD_MS ? "haute" : "normale"
        return {
          _id: d._id,
          ref: shortRef(d._id),
          name,
          documentType: d.documentType,
          targetLoa: TARGET_LOA,
          priority,
          submittedAt: d.submittedAt,
          reviewerId: d.reviewerId,
        }
      }),
    )
    return results
  },
})

export const pendingCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireController(ctx)
    const docs = await ctx.db
      .query("kycRequest")
      .withIndex("by_status", (q) => q.eq("status", "under_review"))
      .collect()
    return docs.length
  },
})

export const myCurrent = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("kycRequest"),
      ref: v.string(),
      documentType: v.string(),
      docFrontUrl: v.union(v.string(), v.null()),
      docBackUrl: v.union(v.string(), v.null()),
      selfieUrl: v.union(v.string(), v.null()),
      score: v.optional(v.number()),
      faceMatchScore: v.optional(v.number()),
      livenessVerdict: v.optional(
        v.union(v.literal("real"), v.literal("spoof"), v.literal("uncertain")),
      ),
      ocrAvailable: v.optional(v.boolean()),
      biometricAvailable: v.optional(v.boolean()),
      citizen: v.object({
        firstName: v.string(),
        lastName: v.string(),
        idnId: v.optional(v.string()),
        currentLoa: v.union(v.literal(1), v.literal(2), v.literal(3)),
      }),
    }),
  ),
  handler: async (ctx) => {
    const me = await requireController(ctx)
    const claimed = await ctx.db
      .query("kycRequest")
      .withIndex("by_reviewer", (q) => q.eq("reviewerId", me.userId))
      .order("desc")
      .first()
    if (!claimed || claimed.status !== "under_review") return null

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", claimed.userId))
      .unique()

    const docFrontUrl = claimed.documentImages.front
      ? await ctx.storage.getUrl(claimed.documentImages.front)
      : null
    const docBackUrl = claimed.documentImages.back
      ? await ctx.storage.getUrl(claimed.documentImages.back)
      : null
    const selfieUrl = claimed.selfieImage
      ? await ctx.storage.getUrl(claimed.selfieImage)
      : null

    return {
      _id: claimed._id,
      ref: shortRef(claimed._id),
      documentType: claimed.documentType,
      docFrontUrl,
      docBackUrl,
      selfieUrl,
      score: claimed.score,
      faceMatchScore: claimed.faceMatchScore,
      livenessVerdict: claimed.livenessVerdict,
      ocrAvailable: claimed.ocrAvailable,
      biometricAvailable: claimed.biometricAvailable,
      citizen: {
        firstName: profile?.pivot?.firstName ?? "",
        lastName: profile?.pivot?.lastName ?? "",
        idnId: profile?.idnId,
        currentLoa: profile?.loa ?? 1,
      },
    }
  },
})

/**
 * Convertit un Convex ID en référence courte type "KYC-XXX-XXX".
 * Stable (déterministe) — pas un identifiant cryptographique, juste un
 * affichage compact lisible par le contrôleur.
 */
function shortRef(id: string): string {
  const trimmed = id.replace(/[^a-z0-9]/gi, "").toUpperCase()
  const a = trimmed.slice(-6, -3) || "000"
  const b = trimmed.slice(-3) || "000"
  return `KYC-${a}-${b}`
}

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
    // Cohérence d'état : on ne peut « prendre en charge » qu'une demande
    // encore dans la file d'examen — pas une demande déjà tranchée
    // (`approved`/`rejected`) ni pas encore soumise/en attente OCR
    // (`pending`/`submitted`). Inoffensif en soi (`claim` ne change que
    // `reviewerId`), mais évite d'assigner un dossier clos à un contrôleur
    // et prépare le terrain pour les gardes `approve`/`reject` ci-dessous.
    if (kyc.status !== "under_review") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cette demande n'est pas dans la file d'examen.",
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

    // Garde d'intégrité (four-eyes) : n'autorise l'approbation QUE depuis
    // `under_review` — empêche d'écraser une décision déjà terminale
    // (`approved`/`rejected`) ou d'agir sur une demande pas encore prête
    // (`pending`/`submitted`/`complement_required`). Exige aussi que ce soit
    // BIEN le contrôleur qui a `claim` le dossier (séparation des tâches :
    // le flux légitime — cf. `myCurrent` + UI `case-detail.tsx` — ne montre
    // jamais un dossier non réclamé par l'appelant).
    if (kyc.status !== "under_review") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cette demande n'est pas en attente de décision.",
      })
    }
    if (kyc.reviewerId && kyc.reviewerId !== controller.userId) {
      throw new ConvexError({
        code: "NOT_CLAIMED",
        message: "Cette demande est assignée à un autre contrôleur.",
      })
    }

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
    await ctx.runMutation(internal.notifications.dispatchKyc, {
      userId: kyc.userId,
      kind: "approved",
      kycRequestId: args.kycRequestId,
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
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc) throw new ConvexError({ code: "NOT_FOUND", message: "Demande introuvable." })

    // Même garde d'intégrité que `approve` (four-eyes) — cf. commentaire
    // ci-dessus. Un rejet écrasant un `approved`/`rejected` déjà en place, ou
    // agissant sur une demande pas encore en revue, romprait la même
    // propriété d'intégrité que l'approbation non gardée.
    if (kyc.status !== "under_review") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cette demande n'est pas en attente de décision.",
      })
    }
    if (kyc.reviewerId && kyc.reviewerId !== controller.userId) {
      throw new ConvexError({
        code: "NOT_CLAIMED",
        message: "Cette demande est assignée à un autre contrôleur.",
      })
    }

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
    await ctx.runMutation(internal.notifications.dispatchKyc, {
      userId: kyc.userId,
      kind: "rejected",
      kycRequestId: args.kycRequestId,
      detail: args.reason.trim(),
    })
    return null
  },
})

export const requestComplement = mutation({
  args: {
    kycRequestId: v.id("kycRequest"),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx)
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Demande introuvable.",
      })
    }

    // Garde d'état : une demande déjà tranchée (`approved`/`rejected`,
    // terminale) ne doit pas pouvoir être « rouverte » vers
    // `complement_required` — seul un dossier encore `under_review` peut en
    // sortir vers ce statut. Même contrôle de propriété que
    // `approve`/`reject` (four-eyes).
    if (kyc.status !== "under_review") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cette demande n'est pas en attente de décision.",
      })
    }
    if (kyc.reviewerId && kyc.reviewerId !== controller.userId) {
      throw new ConvexError({
        code: "NOT_CLAIMED",
        message: "Cette demande est assignée à un autre contrôleur.",
      })
    }

    const message = args.message.trim()
    if (message.length < 5) {
      throw new ConvexError({
        code: "INVALID",
        message: "Précisez ce que doit fournir le citoyen (min. 5 caractères).",
      })
    }

    const now = Date.now()
    await ctx.db.patch(args.kycRequestId, {
      status: "complement_required",
      reviewerId: controller.userId,
      complementRequest: {
        message,
        requestedAt: now,
        requestedBy: controller.userId,
      },
      updatedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: controller.userId,
      action: "kyc_complement_requested",
      targetType: "kyc",
      targetId: args.kycRequestId,
      metadata: { message },
    })
    await ctx.runMutation(internal.notifications.dispatchKyc, {
      userId: kyc.userId,
      kind: "complement_requested",
      kycRequestId: args.kycRequestId,
      detail: message,
    })
    return null
  },
})
