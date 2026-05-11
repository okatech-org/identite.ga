import { v } from "convex/values"

import { query } from "../_generated/server"
import { requireController } from "../lib/auth"

/**
 * Espace contrôleur — historique des contrôles (§3.10 onglet 4).
 *
 * Retourne les entrées d'audit où le contrôleur courant est l'acteur.
 * Filtré sur les actions qui le concernent : revues KYC + contrôles
 * d'identité terrain + vérifications de signature.
 *
 * Phase 1 : pas de jointure citoyen/lieu (la table audit ne stocke
 * pas le `loc` du mockup ; on l'expose via metadata quand il sera
 * persisté côté scanner). On retourne la cible KYC pour pouvoir
 * remonter le nom citoyen côté UI.
 */

const ACTIONS_DE_CONTROLE = [
  "kyc_approved",
  "kyc_rejected",
  "identity_check_performed",
  "signature_verified",
] as const

type ControleAction = (typeof ACTIONS_DE_CONTROLE)[number]

const HISTORY_ENTRY = v.object({
  _id: v.id("auditLog"),
  action: v.string(),
  targetType: v.string(),
  targetId: v.string(),
  createdAt: v.number(),
  /** Nom à afficher pour la cible (citoyen) — vide si non disponible. */
  citizenName: v.string(),
  /** Lieu de contrôle (si stocké en metadata par le scanner). */
  location: v.string(),
  /** Verdict affiché : "valide" / "expiré". */
  result: v.union(v.literal("valide"), v.literal("expiré")),
})

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(HISTORY_ENTRY),
  handler: async (ctx, args) => {
    const me = await requireController(ctx)
    const limit = Math.min(args.limit ?? 50, 200)

    const entries = await ctx.db
      .query("auditLog")
      .withIndex("by_actor", (q) => q.eq("actorId", me.userId))
      .order("desc")
      .take(limit * 4) // sur-pioche pour filtrer les actions hors périmètre

    const filtered = entries.filter((e) =>
      (ACTIONS_DE_CONTROLE as readonly string[]).includes(e.action),
    )

    const enriched = await Promise.all(
      filtered.slice(0, limit).map(async (e) => {
        let citizenName = ""
        if (e.targetType === "kyc") {
          // L'audit conserve l'ID brut (string) ; on le re-normalise pour
          // ctx.db.get. Si l'ID n'est plus valide (table purgée), on
          // saute l'enrichissement et on garde l'entrée historique.
          const kycId = ctx.db.normalizeId("kycRequest", e.targetId)
          if (kycId) {
            const kyc = await ctx.db.get(kycId)
            if (kyc) {
              const profile = await ctx.db
                .query("userProfile")
                .withIndex("by_userId", (q) => q.eq("userId", kyc.userId))
                .unique()
              const fn = profile?.pivot?.firstName ?? ""
              const ln = profile?.pivot?.lastName ?? ""
              citizenName = [fn, ln].filter(Boolean).join(" ")
            }
          }
        }
        const meta = (e.metadata ?? {}) as Record<string, unknown>
        const location =
          typeof meta.location === "string" ? (meta.location as string) : ""
        const result: "valide" | "expiré" =
          (e.action as ControleAction) === "kyc_rejected" ? "expiré" : "valide"
        return {
          _id: e._id,
          action: e.action,
          targetType: e.targetType,
          targetId: e.targetId,
          createdAt: e.createdAt,
          citizenName,
          location,
          result,
        }
      }),
    )
    return enriched
  },
})

export const todayCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const me = await requireController(ctx)
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const since = startOfDay.getTime()

    const entries = await ctx.db
      .query("auditLog")
      .withIndex("by_actor", (q) =>
        q.eq("actorId", me.userId).gte("createdAt", since),
      )
      .collect()
    return entries.filter((e) =>
      (ACTIONS_DE_CONTROLE as readonly string[]).includes(e.action),
    ).length
  },
})
