import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { internalMutation, mutation } from "../functions"
import { requireAdmin } from "../lib/auth"
import { raiseDuplicateFlag } from "../lib/duplicateFlags"
import { DUPLICATE_SIGNALS } from "../schema"

const SIGNAL = v.union(...DUPLICATE_SIGNALS.map((s) => v.literal(s)))

/**
 * Ouverture d'un dossier de rapprochement depuis une **action** (pipeline
 * KYC), qui n'a pas accès à `ctx.db`. Les appelants déjà en mutation utilisent
 * directement `raiseDuplicateFlag` (`lib/duplicateFlags.ts`), pour écrire le
 * signal dans la même transaction que ce qui l'a déclenché.
 */
export const raiseFlag = internalMutation({
  args: {
    userId: v.string(),
    matchedUserId: v.optional(v.string()),
    signal: SIGNAL,
    groupKey: v.string(),
    score: v.optional(v.number()),
    sourceKycRequestId: v.optional(v.id("kycRequest")),
  },
  returns: v.union(v.id("duplicateSignal"), v.null()),
  handler: async (ctx, args) => await raiseDuplicateFlag(ctx, args),
})

/**
 * Arbitrage humain d'un signal.
 *
 * `confirmed` acte que les deux comptes sont bien la même personne, `dismissed`
 * qu'il s'agit d'un homonyme ou d'un faux positif. Ni l'un ni l'autre ne touche
 * aux comptes : fermer un dossier n'est pas supprimer un compte. La suppression
 * ou l'anonymisation reste un acte distinct et explicite
 * (`admin/accounts.ts`), avec sa propre confirmation.
 *
 * Les champs de détection ne sont jamais réécrits — seule la résolution l'est.
 */
export const resolveFlag = mutation({
  args: {
    flagId: v.id("duplicateSignal"),
    resolution: v.union(v.literal("confirmed"), v.literal("dismissed")),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)

    const flag = await ctx.db.get(args.flagId)
    if (!flag) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Signalement introuvable.",
      })
    }
    if (flag.status !== "open") {
      throw new ConvexError({
        code: "ALREADY_RESOLVED",
        message: "Ce signalement a déjà été traité.",
      })
    }

    await ctx.db.patch(args.flagId, {
      status: args.resolution,
      resolvedAt: Date.now(),
      resolvedBy: admin.userId,
      notes: args.notes,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: admin.userId,
      action: "duplicate_flag_resolved",
      targetType: "user",
      targetId: flag.userId,
      metadata: {
        resolution: args.resolution,
        signal: flag.signal,
        matchedUserId: flag.matchedUserId,
      },
    })
    return null
  },
})
