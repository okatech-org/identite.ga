import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import {
  action,
  internalMutation,
  internalQuery,
} from "../_generated/server"
import { authComponent, createAuth } from "../auth"
import { requireAdmin } from "../lib/auth"
import { ROLES } from "../schema"
import { components } from "../_generated/api"

/**
 * Création d'un compte opérateur (contrôleur ou développeur) par le
 * super-admin.
 *
 * - Pas d'inscription publique pour `identity_controller`.
 * - Création d'un compte `developer` aussi possible depuis cette UI
 *   (les devs ont par ailleurs leur propre signup sur developers.identite.ga,
 *   mais le super-admin peut pré-créer un compte sur invitation).
 *
 * Architecture : action (Better Auth signUpEmail → HIBP → fetch) +
 * internalMutation (pose du rôle + audit). RBAC vérifié dans la mutation.
 */

const OPERATOR_ROLE = v.union(
  v.literal("identity_controller"),
  v.literal("developer"),
)

type OperatorRole = "identity_controller" | "developer"

export const createOperator = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: OPERATOR_ROLE,
    verified: v.optional(v.boolean()),
  },
  returns: v.object({
    userId: v.string(),
    created: v.boolean(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ userId: string; created: boolean }> => {
    // Pré-vérifie le rôle admin avant de toucher Better Auth (évite de
    // créer un compte si l'appelant n'a pas les droits).
    await ctx.runQuery(internal.admin.operators._requireAdminCheck, {})

    if (args.password.length < 12) {
      throw new ConvexError({
        code: "PASSWORD_TOO_SHORT",
        message: "Le mot de passe doit faire au moins 12 caractères.",
      })
    }
    if (!args.email.trim() || !args.email.includes("@")) {
      throw new ConvexError({
        code: "INVALID_EMAIL",
        message: "Adresse email invalide.",
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { auth, headers } = await (authComponent as any).getAuth(
      createAuth,
      ctx,
    )

    let userId = ""
    let created = false
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: args.email,
          password: args.password,
          name: args.name,
        },
        headers,
      })
      userId = (result as { user?: { id?: string } })?.user?.id ?? ""
      created = Boolean(userId)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Création utilisateur impossible."
      const looksLikeExisting =
        /exist|already|déjà|registered/i.test(message) ||
        /USER_ALREADY_EXISTS|INVALID_EMAIL_OR_PASSWORD/i.test(message)
      if (!looksLikeExisting) {
        throw new ConvexError({ code: "SIGNUP_FAILED", message })
      }
      // Compte existe déjà — on récupère son userId pour pouvoir poser
      // le rôle quand même (mode "promotion").
      const existing = (await ctx.runQuery(
        components.betterAuth.adapter.findOne,
        {
          model: "user",
          where: [{ field: "email", value: args.email }],
        },
      )) as { _id?: string } | null
      userId = existing?._id ?? ""
      if (!userId) {
        throw new ConvexError({
          code: "USER_NOT_FOUND",
          message:
            "Compte existant détecté mais impossible de récupérer son identifiant.",
        })
      }
    }

    await ctx.runMutation(internal.admin.operators._grantRole, {
      userId,
      role: args.role,
      verified: args.verified ?? false,
    })

    return { userId, created }
  },
})

/**
 * Pose / réactive (idempotent) un rôle opérateur. Internal — appelé
 * uniquement par `createOperator` action.
 */
export const _grantRole = internalMutation({
  args: {
    userId: v.string(),
    role: v.union(...ROLES.map((r) => v.literal(r))),
    verified: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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
        assignedBy: "admin.operators.createOperator",
        verified: args.verified,
        verifiedAt: args.verified ? Date.now() : undefined,
      })
    } else if (existing.revokedAt) {
      await ctx.db.patch(existing._id, {
        revokedAt: undefined,
        verified: args.verified ?? existing.verified,
      })
    } else if (args.verified !== undefined && existing.verified !== args.verified) {
      await ctx.db.patch(existing._id, {
        verified: args.verified,
        verifiedAt: args.verified ? Date.now() : undefined,
      })
    }

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: "admin",
      action: "role_assigned",
      targetType: "user",
      targetId: args.userId,
      metadata: { role: args.role, by: "createOperator" },
    })
    return null
  },
})

/**
 * Garde RBAC réutilisée depuis l'action (qui ne peut pas appeler
 * directement requireAdmin sans contexte db). On expose une query
 * interne qui throw si l'appelant n'est pas admin.
 */
export const _requireAdminCheck = internalQuery({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return null
  },
})
