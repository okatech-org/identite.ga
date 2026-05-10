import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import { mutation } from "./_generated/server"
import { authComponent, createAuth } from "./auth"
import { requireVerifiedAuth } from "./lib/auth"

/**
 * Gestion du compte (mot de passe, 2FA TOTP).
 *
 * Wrappers autour de Better Auth pour exposer les actions via Convex
 * mutations (avec audit log applicatif).
 */

export const changePassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)

    if (args.newPassword.length < 12) {
      throw new ConvexError({
        code: "PASSWORD_TOO_SHORT",
        message: "Le nouveau mot de passe doit contenir au moins 12 caractères.",
      })
    }
    if (args.currentPassword === args.newPassword) {
      throw new ConvexError({
        code: "SAME_PASSWORD",
        message: "Le nouveau mot de passe doit être différent de l'ancien.",
      })
    }

    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    try {
      await auth.api.changePassword({
        body: {
          currentPassword: args.currentPassword,
          newPassword: args.newPassword,
          revokeOtherSessions: true,
        },
        headers,
      })
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de modifier le mot de passe."
      // Better Auth jette des erreurs INVALID_PASSWORD / PASSWORD_COMPROMISED, etc.
      throw new ConvexError({ code: "PASSWORD_CHANGE_FAILED", message })
    }

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "password_changed",
      targetType: "user",
      targetId: user.userId,
    })

    return null
  },
})
