import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireAuth } from "./lib/auth"

/**
 * Consentements OAuth (§3.3).
 * Gérés par Better Auth oidcProvider plugin (table `oauthConsent` dans le
 * composant). On expose un wrapper RBAC + audit. La lecture/révocation
 * effective viendra avec l'UI portail citoyen.
 */

export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      clientId: v.string(),
      appName: v.string(),
      scopes: v.array(v.string()),
      grantedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireAuth(ctx)
    // TODO(idn): lecture via authComponent / oidcProvider plugin
    return []
  },
})

export const revoke = mutation({
  args: { consentId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx)
    void args.consentId
    // TODO(idn): révocation via Better Auth + audit log + email
    return null
  },
})
