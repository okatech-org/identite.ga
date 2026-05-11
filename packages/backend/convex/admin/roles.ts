import { ConvexError, v } from "convex/values"

import { components, internal } from "../_generated/api"
import { mutation, query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"
import { ROLES } from "../schema"

/**
 * Gestion des rôles & habilitations (§3.9 onglet 6).
 *
 * Les rôles sont stockés dans `userRole` (notre table). Better Auth gère
 * les utilisateurs eux-mêmes dans le namespace du composant ; on joint
 * via l'adapter du composant pour récupérer email + nom.
 *
 * MFA obligatoire pour les mutations d'assignation/révocation — vérifié
 * au niveau Better Auth (twoFactor plugin, ADR-0005 §3.2).
 */

const ROLE = v.union(...ROLES.map((r) => v.literal(r)))

type Role = (typeof ROLES)[number]

/**
 * Résumé pour les cartes Rôles & habilitations : nombre d'agents par rôle.
 */
export const listRolesSummary = query({
  args: {},
  returns: v.array(
    v.object({
      role: v.string(),
      count: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const counts: Record<Role, number> = {
      admin: 0,
      identity_controller: 0,
      developer: 0,
    }
    const rows = await ctx.db.query("userRole").collect()
    for (const r of rows) {
      if (!r.revokedAt)
        counts[r.role as Role] = (counts[r.role as Role] ?? 0) + 1
    }
    return ROLES.map((r) => ({ role: r, count: counts[r] }))
  },
})

/**
 * Liste les opérateurs avec leur email. Limité à 200 pour la V1.
 */
export const listOperators = query({
  args: { role: v.optional(ROLE), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      userId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      role: v.string(),
      assignedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const limit = Math.min(args.limit ?? 200, 500)

    let rows
    if (args.role) {
      const r = args.role
      rows = await ctx.db
        .query("userRole")
        .withIndex("by_role", (q) => q.eq("role", r))
        .order("desc")
        .take(limit * 2)
    } else {
      rows = await ctx.db.query("userRole").order("desc").take(limit * 2)
    }

    const active = rows.filter((r) => !r.revokedAt).slice(0, limit)

    const results: Array<{
      userId: string
      email: string
      name?: string
      role: string
      assignedAt: number
    }> = []
    for (const r of active) {
      const user = (await ctx.runQuery(
        components.betterAuth.adapter.findOne,
        {
          model: "user",
          where: [{ field: "_id", value: r.userId }],
        },
      )) as { email?: string; name?: string } | null
      if (!user) continue
      results.push({
        userId: r.userId,
        email: user.email ?? "",
        name: user.name,
        role: r.role,
        assignedAt: r.assignedAt,
      })
    }
    return results
  },
})

/**
 * Assigne un rôle (idempotent — réactive si soft-deleted). Audit log.
 */
export const assign = mutation({
  args: { userId: v.string(), role: ROLE },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx)

    const existing = await ctx.db
      .query("userRole")
      .withIndex("by_userId_role", (q) =>
        q.eq("userId", args.userId).eq("role", args.role),
      )
      .unique()

    if (!existing) {
      await ctx.db.insert("userRole", {
        userId: args.userId,
        role: args.role,
        assignedAt: Date.now(),
        assignedBy: actor.userId,
      })
    } else if (existing.revokedAt) {
      await ctx.db.patch(existing._id, { revokedAt: undefined })
    } else {
      return null
    }

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: actor.userId,
      action: "role_assigned",
      targetType: "user",
      targetId: args.userId,
      metadata: { role: args.role },
    })

    return null
  },
})

/**
 * Révoque un rôle (soft-delete). On empêche un admin de se révoquer
 * lui-même son rôle admin pour éviter le lockout.
 */
export const revoke = mutation({
  args: { userId: v.string(), role: ROLE },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx)
    if (actor.userId === args.userId && args.role === "admin") {
      throw new ConvexError({
        code: "FORBIDDEN_SELF_REVOKE",
        message:
          "Vous ne pouvez pas révoquer votre propre rôle administrateur.",
      })
    }

    const existing = await ctx.db
      .query("userRole")
      .withIndex("by_userId_role", (q) =>
        q.eq("userId", args.userId).eq("role", args.role),
      )
      .unique()

    if (!existing || existing.revokedAt) return null

    await ctx.db.patch(existing._id, { revokedAt: Date.now() })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: actor.userId,
      action: "role_revoked",
      targetType: "user",
      targetId: args.userId,
      metadata: { role: args.role },
    })

    return null
  },
})
