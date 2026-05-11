import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { internalAction, internalMutation } from "../_generated/server"
import { authComponent, createAuth } from "../auth"

/**
 * Script de seed — crée un utilisateur Better Auth + lui assigne le rôle
 * `admin` (super-administrateur). À utiliser uniquement en développement,
 * via :
 *
 *   bunx convex run scripts/createAdminUser:run \
 *     '{"email":"admin@test.identite.ga","password":"...","name":"Admin Système"}'
 *
 * Provisionne le premier compte super-admin pour pouvoir se connecter à
 * la console `apps/admin` (cf. ADR-0005 — pas d'inscription publique pour
 * ce rôle).
 *
 * Sécurité : ce sont des fonctions `internal*`, invocables uniquement via
 * `convex run` (CLI/dashboard), jamais depuis le client public.
 *
 * Architecture : on passe par une *action* (et pas une mutation) parce
 * que Better Auth signUp déclenche un check HIBP qui requiert `fetch`,
 * autorisé uniquement dans les actions. L'action enchaîne ensuite sur
 * une mutation interne pour poser le rôle.
 *
 * Idempotent : si l'email existe déjà, on pose quand même le rôle admin
 * (utile pour promouvoir un compte existant).
 */

export const run = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.object({
    userId: v.string(),
    email: v.string(),
    created: v.boolean(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ userId: string; email: string; created: boolean }> => {
    if (args.password.length < 12) {
      throw new ConvexError({
        code: "PASSWORD_TOO_SHORT",
        message: "Le mot de passe doit faire au moins 12 caractères.",
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
          name: args.name ?? "Admin Système",
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

      // Compte déjà créé — on récupère l'userId via l'adapter Better Auth
      // pour poser le rôle quand même.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = (authComponent as any).adapter(ctx)
      const existing = await adapter.findOne?.("user", {
        where: [{ field: "email", value: args.email }],
      })
      userId = existing?.id ?? existing?._id ?? ""
      if (!userId) {
        throw new ConvexError({
          code: "USER_NOT_FOUND",
          message:
            "Compte existant détecté mais impossible de récupérer son identifiant.",
        })
      }
    }

    await ctx.runMutation(internal.scripts.createAdminUser.grantAdminRole, {
      userId,
    })

    return { userId, email: args.email, created }
  },
})

/**
 * Pose (idempotent) le rôle `admin` sur un userId. Réactive si soft-deleted.
 */
export const grantAdminRole = internalMutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userRole")
      .withIndex("by_userId_role", (q) =>
        q.eq("userId", args.userId).eq("role", "admin"),
      )
      .unique()

    if (!existing) {
      await ctx.db.insert("userRole", {
        userId: args.userId,
        role: "admin",
        assignedAt: Date.now(),
        assignedBy: "scripts/createAdminUser",
      })
    } else if (existing.revokedAt) {
      await ctx.db.patch(existing._id, { revokedAt: undefined })
    }
    return null
  },
})
