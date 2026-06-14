import { v } from "convex/values"

import { internalQuery } from "./_generated/server"

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
    if (loa >= 2) {
      return { loa, status: "approved" as const, actionRequired: false, message: null, updatedAt }
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
