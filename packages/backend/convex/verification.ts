import { v } from "convex/values"

import { internalQuery, query } from "./_generated/server"
import { mutation } from "./functions"
import {
  canJoinScheduledInterview,
  joinOpensAt,
} from "./level3/schedulingPolicy"
import { requireVerifiedAuth } from "./lib/auth"
import { KYC_DOCUMENT_TYPES } from "./schema"
import {
  activeLevel3Row,
  latestKycRow,
  openVerificationRequest,
} from "./verification/requestFlow"
import {
  isDocumentTrackReadyForBooking,
  type DocumentTrackStatus,
} from "./verification/requestPolicy"

/**
 * Statut de vérification d'identité exposé aux applications tierces via
 * l'endpoint HTTP `/api/auth/oauth2/verification` (http.ts).
 *
 * Le claim OIDC `loa`/`acr` (dans /userinfo) ne donne que le niveau COURANT,
 * figé au moment du login. Cet endpoint, lui, est interrogeable à tout moment
 * avec l'access token et reflète l'état VIVANT d'une demande de vérification :
 * en cours, action requise (complément), refusée. C'est ce qui permet à une
 * app (ex. démarches consulaires) d'afficher « Ton identité est en cours de
 * vérification » ou « Action requise → [lien] ».
 *
 * Le mapping ci-dessous traduit les statuts internes `kycRequest` (pending,
 * submitted, under_review, complement_required, approved, rejected, expired)
 * en un contrat public stable et minimal.
 */

const PUBLIC_STATUS = v.union(
  v.literal("none"), // aucune vérification — l'utilisateur peut en démarrer une
  v.literal("in_progress"), // soumise / en cours d'examen automatique ou manuel
  v.literal("action_required"), // l'utilisateur doit agir (compléter / finir)
  v.literal("approved"), // identité vérifiée (loa ≥ 2)
  v.literal("rejected"), // demande refusée
)

export const getStatusForUser = internalQuery({
  args: { userId: v.string() },
  returns: v.object({
    loa: v.number(),
    status: PUBLIC_STATUS,
    actionRequired: v.boolean(),
    message: v.union(v.string(), v.null()),
    updatedAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
    const loa = profile?.loa ?? 1

    const latest = await ctx.db
      .query("kycRequest")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .first()

    const updatedAt = latest?.updatedAt ?? null

    // Niveau déjà atteint → vérifié, peu importe l'historique de demandes.
    // Un Niveau 3 en cours par-dessus un Niveau 2 acquis ne rouvre PAS ce
    // statut : au sens de la plateforme (REQUIRED_LOA = 2) l'identité est
    // vérifiée, et repasser en `in_progress` ferait réapparaître les bandeaux
    // « vérification en cours » chez toutes les relying party.
    if (loa >= 2) {
      return { loa, status: "approved" as const, actionRequired: false, message: null, updatedAt }
    }

    // Parcours FUSIONNÉ — un LoA 1 peut avoir une demande Niveau 3 en cours
    // (cf. verification/requestPolicy.ts). Sans cette branche, l'endpoint
    // répondrait « none » à une app tierce alors qu'un entretien est déjà
    // planifié, et l'app inviterait le citoyen à tout recommencer.
    const level3 = await activeLevel3Row(ctx, userId)
    if (level3) {
      const track = level3.kycRequestId
        ? await ctx.db.get(level3.kycRequestId)
        : latest
      const trackStatus = (track?.status ?? null) as DocumentTrackStatus | null
      if (trackStatus === "complement_required") {
        return {
          loa,
          status: "action_required" as const,
          actionRequired: true,
          message: track?.complementRequest?.message ?? null,
          updatedAt,
        }
      }
      // Pièces pas encore soumises, ou créneau pas encore réservé : dans les
      // deux cas la balle est dans le camp du citoyen.
      const ready = isDocumentTrackReadyForBooking(loa, trackStatus)
      if (!ready || level3.scheduledAt === undefined) {
        return { loa, status: "action_required" as const, actionRequired: true, message: null, updatedAt }
      }
      return { loa, status: "in_progress" as const, actionRequired: false, message: null, updatedAt }
    }

    if (!latest) {
      return { loa, status: "none" as const, actionRequired: true, message: null, updatedAt: null }
    }

    switch (latest.status) {
      case "submitted":
      case "under_review":
        return { loa, status: "in_progress" as const, actionRequired: false, message: null, updatedAt }
      case "complement_required":
        return {
          loa,
          status: "action_required" as const,
          actionRequired: true,
          message: latest.complementRequest?.message ?? null,
          updatedAt,
        }
      case "pending": // demande créée mais documents non finalisés
        return { loa, status: "action_required" as const, actionRequired: true, message: null, updatedAt }
      case "rejected":
        return { loa, status: "rejected" as const, actionRequired: true, message: latest.rejectionReason ?? null, updatedAt }
      case "approved": // loa pas encore propagé (cas transitoire) — traité comme in_progress
        return { loa, status: "in_progress" as const, actionRequired: false, message: null, updatedAt }
      case "expired":
      default:
        return { loa, status: "none" as const, actionRequired: true, message: null, updatedAt: null }
    }
  },
})

/* ------------------------------------------------------------------------
 * Entrée UNIQUE du parcours de vérification (Niveau 2 ou Niveau 3).
 *
 * Le citoyen demande directement le niveau qu'il vise, sans enchaînement
 * obligatoire. Doctrine et invariant de preuve documentaire :
 * `verification/requestPolicy.ts` ; exécution : `verification/requestFlow.ts`.
 *
 * Ce bloc ne REMPLACE pas les modules historiques : `kyc.*` porte toujours la
 * collecte des pièces et `level3.*` l'entretien et la décision. Il décide
 * lequel ouvrir, et les relie.
 * --------------------------------------------------------------------- */

const DOC_TYPE = v.union(...KYC_DOCUMENT_TYPES.map((t) => v.literal(t)))
const TARGET_LOA = v.union(v.literal(2), v.literal(3))

/**
 * Demande de vérification d'identité au niveau visé.
 *
 * `documentType` n'est exigé que lorsque l'appel va effectivement créer une
 * demande KYC (Niveau 2, ou Niveau 3 depuis le LoA 1) — sinon il est ignoré,
 * la piste documentaire existante étant rattachée telle quelle.
 */
export const request = mutation({
  args: {
    targetLoa: TARGET_LOA,
    documentType: v.optional(DOC_TYPE),
  },
  returns: v.object({
    targetLoa: TARGET_LOA,
    kycRequestId: v.optional(v.id("kycRequest")),
    verificationId: v.optional(v.id("level3Verification")),
  }),
  handler: async (ctx, args) => {
    const me = await requireVerifiedAuth(ctx)
    return await openVerificationRequest(ctx, {
      userId: me.userId,
      targetLoa: args.targetLoa,
      documentType: args.documentType,
    })
  },
})

const CONSOLIDATED_STATE = v.object({
  currentLoa: v.union(v.literal(1), v.literal(2), v.literal(3)),
  documentTrack: v.union(
    v.null(),
    v.object({
      _id: v.id("kycRequest"),
      status: v.string(),
      documentType: v.string(),
      submittedAt: v.optional(v.number()),
      /** Rattachée à la demande Niveau 3 en cours (parcours fusionné). */
      attachedToLevel3: v.boolean(),
    }),
  ),
  level3: v.union(
    v.null(),
    v.object({
      _id: v.id("level3Verification"),
      status: v.string(),
      requestedAt: v.number(),
      scheduledAt: v.optional(v.number()),
      scheduledEndAt: v.optional(v.number()),
      canJoin: v.boolean(),
      joinOpensAt: v.optional(v.number()),
      /**
       * Le citoyen peut-il réserver ou replanifier son créneau ? En parcours
       * fusionné, faux tant que les pièces ne sont pas soumises.
       */
      canBookAppointment: v.boolean(),
    }),
  ),
})

/**
 * État consolidé des deux pistes pour le citoyen courant.
 *
 * Le détail reste servi par `kyc.getActiveRequest` et `level3.getMine`. Ce que
 * cette query apporte, c'est le LIEN entre les deux et le drapeau
 * `canBookAppointment`, qui ne se déduit d'aucune des deux prise isolément.
 */
export const getMine = query({
  args: {},
  returns: CONSOLIDATED_STATE,
  handler: async (ctx) => {
    const me = await requireVerifiedAuth(ctx)
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", me.userId))
      .unique()
    const currentLoa = profile?.loa ?? 1

    const level3 = await activeLevel3Row(ctx, me.userId)
    const kyc = level3?.kycRequestId
      ? await ctx.db.get(level3.kycRequestId)
      : await latestKycRow(ctx, me.userId)

    const ready = isDocumentTrackReadyForBooking(
      currentLoa,
      kyc ? (kyc.status as DocumentTrackStatus) : null,
    )
    const now = Date.now()

    return {
      currentLoa,
      documentTrack: kyc
        ? {
            _id: kyc._id,
            status: kyc.status,
            documentType: kyc.documentType,
            submittedAt: kyc.submittedAt,
            attachedToLevel3: level3?.kycRequestId === kyc._id,
          }
        : null,
      level3: level3
        ? {
            _id: level3._id,
            status: level3.status,
            requestedAt: level3.requestedAt,
            scheduledAt: level3.scheduledAt,
            scheduledEndAt: level3.scheduledEndAt,
            canJoin: canJoinScheduledInterview(
              level3.scheduledAt,
              level3.scheduledEndAt,
              now,
            ),
            joinOpensAt: joinOpensAt(level3.scheduledAt),
            canBookAppointment:
              ready &&
              currentLoa < 3 &&
              (level3.status === "waiting_controller" ||
                level3.status === "claimed"),
          }
        : null,
    }
  },
})
