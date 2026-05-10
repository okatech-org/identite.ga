import { v } from "convex/values"

import { mutation, query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"

/**
 * Gestion des applications OAuth (§3.9 onglet "Applications OAuth").
 *
 * Better Auth oidcProvider plugin gère la table `oauthApplication` dans
 * son composant. On expose ici des wrappers RBAC + audit. Implémentation
 * complète quand on construira l'UI Console admin.
 */

export const listApps = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      id: v.string(),
      clientId: v.string(),
      name: v.string(),
      status: v.string(),
      trusted: v.boolean(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    // TODO(idn): authComponent.adapter(ctx).findMany("oauthApplication", ...)
    return []
  },
})

export const approveApp = mutation({
  args: { clientId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    void args.clientId
    // TODO(idn): mise à jour status=active + notification email owner
    return null
  },
})

export const disableApp = mutation({
  args: { clientId: v.string(), reason: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    void args
    // TODO(idn): status=disabled + audit + email owner
    return null
  },
})
