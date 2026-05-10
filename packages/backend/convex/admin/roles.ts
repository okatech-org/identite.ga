import { v } from "convex/values"

import { mutation, query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"
import { ROLES } from "../schema"

/**
 * Gestion des rôles & habilitations (§3.9 onglet 6).
 *
 * Better Auth admin plugin gère le rôle directement sur la table user
 * du composant. On expose ici les wrappers RBAC + audit log.
 *
 * MFA obligatoire pour ces mutations — vérifié au niveau Better Auth.
 */

const ROLE = v.union(...ROLES.map((r) => v.literal(r)))

export const listAdmins = query({
  args: {},
  returns: v.array(
    v.object({
      userId: v.string(),
      email: v.string(),
      role: v.string(),
      assignedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    // TODO(idn): authComponent.adapter(ctx).findMany("user", { where: { role: { in: ["admin", "identity_controller"] } } })
    return []
  },
})

export const assign = mutation({
  args: { userId: v.string(), role: ROLE },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    void args
    // TODO(idn): set role via Better Auth admin plugin + audit + notification
    return null
  },
})

export const revoke = mutation({
  args: { userId: v.string(), role: ROLE },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    void args
    // TODO(idn): set role to "user" + audit + notification
    return null
  },
})
