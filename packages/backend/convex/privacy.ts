import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import { mutation, query } from "./_generated/server"
import { authComponent, createAuth } from "./auth"
import { requireAuth } from "./lib/auth"
import { rateLimiter } from "./rateLimiter"

/**
 * Données & confidentialité (§3.4 + Apple Guideline 5.1.1(v) +
 * loi gabonaise 001/2011 + RGPD).
 *
 * Public API :
 *   - `requestAccountDeletion` — pose la demande (30 j de cooldown)
 *     puis le cron `internal.privacy.deletion.processScheduledDeletions`
 *     finalise l'anonymisation
 *   - `cancelAccountDeletion` — annule la demande dans la fenêtre
 *   - `getDeletionStatus` — état courant pour l'UI
 *   - `requestDataExport` — déclenche l'export RGPD (action async qui
 *     collecte + stocke + envoie un email avec lien signé 24h)
 *
 * Logique interne :
 *   - `privacy/deletion.ts` — anonymisation + cron
 *   - `privacy/export.ts`   — collecte + email
 */

const DELETION_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000 // 30 jours

export const requestAccountDeletion = mutation({
  args: { confirmEmail: v.string() },
  returns: v.object({
    deletionRequestedAt: v.number(),
    deletionScheduledAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    if (args.confirmEmail.toLowerCase() !== user.email.toLowerCase()) {
      throw new ConvexError({
        code: "EMAIL_MISMATCH",
        message: "L'adresse email ne correspond pas à votre compte.",
      })
    }

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!profile) {
      throw new ConvexError({
        code: "PROFILE_NOT_FOUND",
        message: "Profil introuvable.",
      })
    }

    const now = Date.now()
    const scheduledAt = now + DELETION_COOLDOWN_MS

    await ctx.db.patch(profile._id, {
      deletionRequestedAt: now,
      deletionScheduledAt: scheduledAt,
      updatedAt: now,
    })

    // Révoque toutes les sessions sauf la courante — l'utilisateur garde
    // un canal pour annuler avant la fin du délai s'il le souhaite, puis
    // se déconnectera manuellement.
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)
    try {
      await auth.api.revokeOtherSessions({ headers })
    } catch {
      // Best effort : ne bloque pas la demande de suppression.
    }

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_disabled",
      targetType: "user",
      targetId: user.userId,
      metadata: {
        kind: "deletion_requested",
        scheduledAt,
      },
    })

    return { deletionRequestedAt: now, deletionScheduledAt: scheduledAt }
  },
})

export const cancelAccountDeletion = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!profile) {
      throw new ConvexError({
        code: "PROFILE_NOT_FOUND",
        message: "Profil introuvable.",
      })
    }
    if (!profile.deletionScheduledAt) {
      // Idempotent : pas de demande en cours, rien à annuler.
      return null
    }

    await ctx.db.patch(profile._id, {
      deletionRequestedAt: undefined,
      deletionScheduledAt: undefined,
      updatedAt: Date.now(),
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "admin_action",
      targetType: "user",
      targetId: user.userId,
      metadata: { kind: "deletion_cancelled" },
    })

    return null
  },
})

export const getDeletionStatus = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      deletionRequestedAt: v.number(),
      deletionScheduledAt: v.number(),
      daysRemaining: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (
      !profile ||
      !profile.deletionRequestedAt ||
      !profile.deletionScheduledAt
    ) {
      return null
    }
    const msRemaining = profile.deletionScheduledAt - Date.now()
    return {
      deletionRequestedAt: profile.deletionRequestedAt,
      deletionScheduledAt: profile.deletionScheduledAt,
      daysRemaining: Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000))),
    }
  },
})

export const requestDataExport = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)

    // Rate limit : 1 export par 24h par utilisateur.
    await rateLimiter.limit(ctx, "dataExport", {
      key: user.userId,
      throws: true,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "admin_action",
      targetType: "user",
      targetId: user.userId,
      metadata: { kind: "data_export_requested" },
    })

    // Schedule l'action async qui collecte + écrit dans _storage + email.
    await ctx.scheduler.runAfter(0, internal.privacy.exportRun.runDataExport, {
      userId: user.userId,
      email: user.email,
    })

    return null
  },
})
