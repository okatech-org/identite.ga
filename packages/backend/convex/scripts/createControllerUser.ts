import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { action, internalMutation } from "../_generated/server"
import { authComponent, createAuth } from "../auth"

/**
 * Script de seed — crée un utilisateur Better Auth + lui assigne le rôle
 * `identity_controller`. À utiliser uniquement en développement, via :
 *
 *   bunx convex run scripts/createControllerUser:run \
 *     '{"email":"controleur@test.identite.ga","password":"Controleur123!@#"}'
 *
 * En attendant la console super-admin (Phase 2), c'est le seul moyen
 * pratique de provisionner un compte contrôleur pour tester l'app
 * `apps/controller`.
 *
 * NB : le 2FA TOTP n'est pas enrôlé ici — le contrôleur devra l'activer
 * lui-même via `/account/2fa` dans apps/web. Tant que ce n'est pas fait,
 * la connexion réussit sans second facteur (Phase 1, MFA enforcement
 * dans une PR ultérieure).
 *
 * Implémenté en `action` : le plugin `haveIBeenPwned` de Better Auth fait
 * un fetch HTTP (api.pwnedpasswords.com), interdit dans une mutation Convex.
 * L'insert `userRole` passe par une `internalMutation`.
 */
export const run = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.object({
    userId: v.string(),
    email: v.string(),
  }),
  handler: async (ctx, args) => {
    // Garde-fou : refuse sur le déploiement de production IDN.
    // Sur Convex Cloud `NODE_ENV` vaut toujours "production", donc on
    // se base sur le préfixe `CONVEX_DEPLOYMENT` (dev: vs prod:) qui est
    // posé par la CLI Convex selon le déploiement courant. À supprimer
    // quand la console super-admin sera disponible (Phase 2).
    const deployment = process.env.CONVEX_DEPLOYMENT ?? ""
    if (deployment.startsWith("prod:")) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message:
          "createControllerUser est réservé aux déploiements dev — interdit en prod.",
      })
    }
    if (args.password.length < 12) {
      throw new ConvexError({
        code: "PASSWORD_TOO_SHORT",
        message: "Le mot de passe doit faire au moins 12 caractères.",
      })
    }

    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    let userId: string
    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: args.email,
          password: args.password,
          name: args.name ?? "Agent Contrôleur",
        },
        headers,
      })
      userId = (result as { user?: { id?: string } })?.user?.id ?? ""
      if (!userId) {
        throw new Error("Better Auth n'a pas renvoyé d'identifiant utilisateur.")
      }
    } catch (err) {
      // Si l'email existe déjà (re-run du script), on bascule sur signIn
      // pour récupérer l'ID et n'ajouter que le rôle. Permet de réparer un
      // user orphelin créé lors d'un échec antérieur (ex: HIBP fetch raté
      // après le create).
      const message =
        err instanceof Error ? err.message : "Création utilisateur impossible."
      const isExisting =
        /already|exist|taken|in use/i.test(message) ||
        (err as { code?: string } | undefined)?.code === "USER_ALREADY_EXISTS"
      if (!isExisting) {
        throw new ConvexError({ code: "SIGNUP_FAILED", message })
      }
      try {
        const result = await auth.api.signInEmail({
          body: { email: args.email, password: args.password },
          headers,
        })
        userId = (result as { user?: { id?: string } })?.user?.id ?? ""
        if (!userId) {
          throw new Error("Better Auth n'a pas renvoyé d'identifiant.")
        }
      } catch (signInErr) {
        const m =
          signInErr instanceof Error
            ? signInErr.message
            : "Lookup utilisateur impossible."
        throw new ConvexError({ code: "USER_LOOKUP_FAILED", message: m })
      }
    }

    await ctx.runMutation(internal.scripts.createControllerUser.assignRole, {
      userId,
    })

    return { userId, email: args.email }
  },
})

export const assignRole = internalMutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userRole")
      .withIndex("by_userId_role", (q) =>
        q.eq("userId", args.userId).eq("role", "identity_controller"),
      )
      .unique()

    if (!existing) {
      await ctx.db.insert("userRole", {
        userId: args.userId,
        role: "identity_controller",
        assignedAt: Date.now(),
      })
    } else if (existing.revokedAt) {
      await ctx.db.patch(existing._id, { revokedAt: undefined })
    }
    return null
  },
})
