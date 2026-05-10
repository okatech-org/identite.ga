import { v } from "convex/values"

import { mutation } from "./_generated/server"
import { requireAuth } from "./lib/auth"
import { internal } from "./_generated/api"

/**
 * Données & confidentialité (§3.4).
 *
 * Phase 1 : scaffolds RBAC. L'export RGPD asynce et la suppression de compte
 * (anonymisation + cooldown 30 j) sont des workflows complets — implémentés
 * quand on construira l'UI Paramètres / Confidentialité.
 */

export const requestDataExport = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    // TODO(idn): lancer un workflow `dataExport` qui paginé toutes les tables
    // de l'utilisateur, génère un JSON chiffré, l'envoie par email avec lien.
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "admin_action",
      targetType: "user",
      targetId: user.userId,
      metadata: { kind: "data_export_requested" },
    })
    return null
  },
})

export const requestAccountDeletion = mutation({
  args: { confirmEmail: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    if (args.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error("Confirmation invalide.")
    }
    // TODO(idn): workflow suppression — 30 j de cooldown, anonymisation,
    // conservation logs d'audit anonymisés (loi gabonaise 001/2011).
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_disabled",
      targetType: "user",
      targetId: user.userId,
      metadata: { kind: "deletion_requested" },
    })
    return null
  },
})
