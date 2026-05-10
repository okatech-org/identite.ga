import { v } from "convex/values"

import { mutation, query } from "../_generated/server"
import { requireDeveloper } from "../lib/auth"

/**
 * Portail développeur — apps OAuth (§3.11).
 * Création soumise à validation admin avant production.
 */

export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      clientId: v.string(),
      name: v.string(),
      status: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireDeveloper(ctx)
    // TODO(idn): authComponent.adapter(ctx).findMany("oauthApplication", { where: { ownerId: user.userId } })
    return []
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    redirectUris: v.array(v.string()),
    scopes: v.array(v.string()),
    logo: v.optional(v.string()),
  },
  returns: v.object({
    clientId: v.string(),
    clientSecret: v.string(), // ⚠️ retourné UNE SEULE FOIS
  }),
  handler: async (ctx, args) => {
    await requireDeveloper(ctx)
    void args
    // TODO(idn): create via Better Auth oidcProvider plugin admin endpoint
    // → status: "pending_approval", génère clientId stable + clientSecret hashé
    // → email admin pour validation, audit log oauth_app_created
    throw new Error("Not implemented yet")
  },
})

export const rotateSecret = mutation({
  args: { clientId: v.string() },
  returns: v.object({ clientSecret: v.string() }),
  handler: async (ctx, args) => {
    await requireDeveloper(ctx)
    void args
    // TODO(idn): regen secret + invalidation 24h grace period + email
    throw new Error("Not implemented yet")
  },
})
