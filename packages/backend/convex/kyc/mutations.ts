import { v } from "convex/values"

import { internal } from "../_generated/api"
import { internalQuery } from "../_generated/server"
import { internalMutation } from "../functions"
import { raiseDuplicateFlag } from "../lib/duplicateFlags"

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

    // L'empreinte faciale entre en galerie : à partir de maintenant, ce visage
    // est celui d'une identité vérifiée et fait obstacle aux suivantes.
    await ctx.runMutation(internal.kyc.mutations.activateFaceTemplate, {
      kycRequestId: args.kycRequestId,
    })

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

    // Dossier rejeté : l'empreinte n'entrera jamais en galerie, elle n'a donc
    // plus de finalité. Une donnée biométrique sans usage est une donnée à
    // supprimer, pas à conserver « au cas où ».
    await ctx.runMutation(internal.kyc.mutations.discardFaceTemplate, {
      kycRequestId: args.kycRequestId,
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
      // Nécessaire au rapprochement d'identité : c'est le compte auquel
      // rattacher une empreinte, et celui qu'il faut exclure des résultats
      // pour ne pas se signaler soi-même.
      userId: v.string(),
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
      userId: kyc.userId,
      documentType: kyc.documentType,
      documentImages: kyc.documentImages,
      selfieImage: kyc.selfieImage,
    }
  },
})

/**
 * Clé de galerie composite.
 *
 * `VectorFilterBuilder` n'expose que `eq` et `or` — pas de `and`. Filtrer à la
 * fois sur l'activité et sur la version du modèle impose donc de fondre les
 * deux dimensions dans un seul champ. Ce n'est pas une coquetterie : comparer
 * des empreintes produites par deux packs de modèles différents rend des
 * scores dénués de sens, sans jamais lever d'erreur.
 */
export function galleryKey(modelVersion: string, active: boolean): string {
  return `${modelVersion}|${active ? "active" : "pending"}`
}

/**
 * Dépose l'empreinte faciale d'un dossier, hors galerie.
 *
 * Déposée `pending` et non `active` : tant que le dossier n'est pas approuvé,
 * rien ne dit que ce visage correspond à une identité réelle. Une galerie
 * peuplée de dossiers en cours rapprocherait des candidats sur des identités
 * qui n'ont jamais été vérifiées.
 *
 * Idempotent sur `by_kycRequestId` : le rejeu d'un step de workflow ne doit
 * pas empiler les empreintes d'un même dossier.
 */
export const upsertFaceTemplate = internalMutation({
  args: {
    kycRequestId: v.id("kycRequest"),
    userId: v.string(),
    embedding: v.array(v.float64()),
    modelVersion: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("faceTemplate")
      .withIndex("by_kycRequestId", (q) =>
        q.eq("kycRequestId", args.kycRequestId),
      )
      .first()

    if (existing) {
      // Ne jamais rétrograder une empreinte déjà entrée en galerie.
      if (existing.active) return null
      await ctx.db.patch(existing._id, {
        embedding: args.embedding,
        modelVersion: args.modelVersion,
        gallery: galleryKey(args.modelVersion, false),
      })
      return null
    }

    await ctx.db.insert("faceTemplate", {
      userId: args.userId,
      kycRequestId: args.kycRequestId,
      embedding: args.embedding,
      modelVersion: args.modelVersion,
      gallery: galleryKey(args.modelVersion, false),
      active: false,
      createdAt: Date.now(),
    })
    return null
  },
})

/** Fait entrer l'empreinte en galerie — appelé à l'approbation, jamais avant. */
export const activateFaceTemplate = internalMutation({
  args: { kycRequestId: v.id("kycRequest") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const t = await ctx.db
      .query("faceTemplate")
      .withIndex("by_kycRequestId", (q) =>
        q.eq("kycRequestId", args.kycRequestId),
      )
      .first()
    if (!t || t.active) return null
    await ctx.db.patch(t._id, {
      active: true,
      gallery: galleryKey(t.modelVersion, true),
    })
    return null
  },
})

/**
 * Supprime l'empreinte d'un dossier rejeté.
 *
 * Une donnée biométrique conservée sans finalité est une donnée à supprimer :
 * un dossier rejeté n'entrera jamais en galerie, son empreinte n'a donc plus
 * d'usage.
 */
export const discardFaceTemplate = internalMutation({
  args: { kycRequestId: v.id("kycRequest") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const t = await ctx.db
      .query("faceTemplate")
      .withIndex("by_kycRequestId", (q) =>
        q.eq("kycRequestId", args.kycRequestId),
      )
      .first()
    if (t && !t.active) await ctx.db.delete(t._id)
    return null
  },
})

/** Résout les résultats d'une recherche vectorielle en comptes. */
export const _resolveTemplates = internalQuery({
  args: { ids: v.array(v.id("faceTemplate")) },
  returns: v.array(v.object({ id: v.id("faceTemplate"), userId: v.string() })),
  handler: async (ctx, args) => {
    const out = []
    for (const id of args.ids) {
      const t = await ctx.db.get(id)
      if (t) out.push({ id, userId: t.userId })
    }
    return out
  },
})

/**
 * Enregistre l'empreinte de la pièce présentée et signale sa réutilisation.
 *
 * Écrit depuis l'action OCR plutôt que retourné par le step : les valeurs de
 * retour d'un step sont persistées dans le journal du composant workflow, que
 * la purge RGPD n'atteint pas. Une empreinte de pièce d'identité n'a rien à y
 * faire.
 *
 * Renvoie `true` si la même pièce est déjà rattachée à un dossier APPROUVÉ
 * d'un autre compte. On se limite aux dossiers approuvés : un dossier rejeté
 * ou en cours ne prouve rien, et un citoyen qui resoumet après un rejet
 * présente légitimement la même pièce.
 */
export const recordDocumentFingerprint = internalMutation({
  args: {
    kycRequestId: v.id("kycRequest"),
    documentNumberHash: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc) throw new Error("Demande KYC introuvable")

    await ctx.db.patch(args.kycRequestId, {
      documentNumberHash: args.documentNumberHash,
      updatedAt: Date.now(),
    })

    const others = await ctx.db
      .query("kycRequest")
      .withIndex("by_documentNumberHash", (q) =>
        q.eq("documentNumberHash", args.documentNumberHash),
      )
      .take(20)

    let reuse = false
    for (const other of others) {
      if (other._id === args.kycRequestId) continue
      if (other.userId === kyc.userId) continue
      if (other.status !== "approved") continue

      reuse = true
      await raiseDuplicateFlag(ctx, {
        userId: kyc.userId,
        matchedUserId: other.userId,
        signal: "document",
        groupKey: args.documentNumberHash,
        sourceKycRequestId: args.kycRequestId,
      })
    }

    if (reuse) {
      await ctx.db.patch(args.kycRequestId, { duplicateFlagged: true })
    }
    return reuse
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
    ocrAvailable: v.boolean(),
    biometricAvailable: v.boolean(),
    duplicateFlagged: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const kyc = await ctx.db.get(args.kycRequestId)
    if (!kyc) throw new Error("Demande KYC introuvable")

    const now = Date.now()
    await ctx.db.patch(args.kycRequestId, {
      status: "under_review",
      // Jamais rabaissé à false : `recordDocumentFingerprint` a pu lever le
      // drapeau plus tôt dans le pipeline, et l'écraser ici masquerait au
      // contrôleur la raison même de la mise en revue.
      ...(args.duplicateFlagged ? { duplicateFlagged: true } : {}),
      score: args.score,
      faceMatchScore: args.faceMatchScore,
      livenessVerdict: args.livenessVerdict,
      ocrAvailable: args.ocrAvailable,
      biometricAvailable: args.biometricAvailable,
      updatedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: undefined,
      action: "kyc_under_review",
      targetType: "kyc",
      targetId: args.kycRequestId,
      metadata: {
        score: args.score,
        faceMatch: args.faceMatchScore,
        ocrAvailable: args.ocrAvailable,
        biometricAvailable: args.biometricAvailable,
      },
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
