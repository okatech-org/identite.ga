import { ConvexError } from "convex/values"

import { authComponent } from "../auth"
import type { QueryCtx, MutationCtx } from "../_generated/server"
import type { ROLES } from "../schema"

type AuthCtx = QueryCtx | MutationCtx
type Role = (typeof ROLES)[number]

/**
 * Helpers RBAC IDN.
 *
 * Better Auth gère l'authentification (user / sessions / OIDC), mais on
 * stocke les **rôles** dans notre table `userRole` plutôt que via le
 * plugin admin de Better Auth — ce dernier ajoute des colonnes que
 * l'adapter @convex-dev/better-auth ne reconnaît pas encore.
 */

export type AuthUser = {
  userId: string
  email: string
  emailVerified: boolean
  roles: Role[]
}

async function loadAuth(ctx: AuthCtx): Promise<AuthUser | null> {
  // `authComponent.getAuthUser(ctx)` jette `Unauthenticated` quand le client
  // n'a pas envoyé de JWT valide (ex: session expirée, JWT pas encore récupéré
  // par ConvexBetterAuthProvider lors d'un premier render). On l'attrape
  // pour distinguer "pas connecté" (null) de "vraie erreur" — `requireAuth`
  // s'occupera de jeter `UNAUTHENTICATED` proprement si besoin.
  let user
  try {
    user = await authComponent.getAuthUser(ctx)
  } catch {
    return null
  }
  if (!user) return null
  const userId = user._id ?? user.userId ?? ""
  const roleRows = await ctx.db
    .query("userRole")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect()
  const roles = roleRows
    .filter((r) => !r.revokedAt)
    .map((r) => r.role) as Role[]
  return {
    userId,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    roles,
  }
}

/**
 * Renvoie l'utilisateur authentifié, ou jette `UNAUTHENTICATED`.
 */
export async function requireAuth(ctx: AuthCtx): Promise<AuthUser> {
  const user = await loadAuth(ctx)
  if (!user) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Vous devez être connecté.",
    })
  }
  return user
}

/**
 * Renvoie l'utilisateur courant ou null (sans throw).
 */
export async function getCurrentAuthUser(
  ctx: AuthCtx,
): Promise<AuthUser | null> {
  return loadAuth(ctx)
}

/**
 * Vérifie que l'utilisateur a au moins un des rôles requis.
 * Jette `FORBIDDEN` sinon.
 */
export async function requireRole(
  ctx: AuthCtx,
  ...allowed: Role[]
): Promise<AuthUser> {
  const user = await requireAuth(ctx)
  if (!user.roles.some((r) => allowed.includes(r))) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Action réservée aux opérateurs habilités.",
    })
  }
  return user
}

export const requireAdmin = (ctx: AuthCtx) => requireRole(ctx, "admin")
export const requireController = (ctx: AuthCtx) =>
  requireRole(ctx, "identity_controller")
export const requireDeveloper = (ctx: AuthCtx) => requireRole(ctx, "developer")

/**
 * Garantit que l'email est vérifié — sinon `EMAIL_NOT_VERIFIED`.
 * Utilisé sur les mutations sensibles (KYC, paramètres compte).
 */
export async function requireVerifiedAuth(ctx: AuthCtx): Promise<AuthUser> {
  const user = await requireAuth(ctx)
  if (!user.emailVerified) {
    throw new ConvexError({
      code: "EMAIL_NOT_VERIFIED",
      message: "Vérifiez votre adresse email avant de continuer.",
    })
  }
  return user
}
