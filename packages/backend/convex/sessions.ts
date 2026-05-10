import { v } from "convex/values"

import { query, mutation } from "./_generated/server"
import { requireAuth } from "./lib/auth"

/**
 * Sessions utilisateur (§3.4 — Paramètres / Appareils & sessions).
 *
 * Les sessions sont gérées par Better Auth (table `session` dans le composant
 * isolé). On expose ici des wrappers RBAC + audit ; la lecture/révocation
 * effective se fait via les routes Better Auth (/api/auth/list-sessions,
 * /api/auth/revoke-session) côté frontend, et l'audit log est enregistré
 * via les hooks Better Auth (à câbler quand on construira l'UI).
 *
 * TODO(idn): brancher la lecture des sessions depuis Better Auth admin API
 * via authComponent.adapter(ctx).findMany("session", { where: { userId } })
 * une fois qu'on attaquera l'UI Sessions.
 */

export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      ip: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      createdAt: v.number(),
      expiresAt: v.optional(v.number()),
      isCurrent: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    await requireAuth(ctx)
    // TODO(idn): lecture via authComponent / Better Auth admin
    return []
  },
})

export const revoke = mutation({
  args: { sessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAuth(ctx)
    void args.sessionId
    // TODO(idn): révocation via authComponent / Better Auth admin
    return null
  },
})

export const revokeAllOthers = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await requireAuth(ctx)
    // TODO(idn): revoke-other-sessions
    return null
  },
})
