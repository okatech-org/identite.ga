import { ConvexError } from "convex/values";

import { authComponent } from "../auth";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { ROLES } from "../schema";

type AuthCtx = QueryCtx | MutationCtx;
type Role = (typeof ROLES)[number];

/**
 * Helpers RBAC IDN.
 *
 * Better Auth gère les rôles via le plugin `admin` ; ici on enrobe
 * `authComponent.getAuthUser(ctx)` pour fournir des assertions claires
 * réutilisables dans les mutations sensibles (admin, contrôleur, dev).
 */

export type AuthUser = {
  userId: string;
  email: string;
  emailVerified: boolean;
  role: Role | "user" | null;
};

/**
 * Renvoie l'utilisateur authentifié, ou jette `UNAUTHENTICATED`.
 */
export async function requireAuth(ctx: AuthCtx): Promise<AuthUser> {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Vous devez être connecté.",
    });
  }
  return {
    userId: user._id ?? user.userId ?? user._id,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    // Better Auth admin plugin ajoute `role` sur user
    role: (user as { role?: Role | "user" | null }).role ?? "user",
  };
}

/**
 * Renvoie l'utilisateur courant ou null (sans throw).
 */
export async function getCurrentAuthUser(
  ctx: AuthCtx,
): Promise<AuthUser | null> {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) return null;
  return {
    userId: user._id ?? user.userId ?? user._id,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    role: (user as { role?: Role | "user" | null }).role ?? "user",
  };
}

/**
 * Vérifie que l'utilisateur a le rôle requis (ou un rôle parmi).
 * Jette `FORBIDDEN` sinon.
 */
export async function requireRole(
  ctx: AuthCtx,
  ...allowed: Role[]
): Promise<AuthUser> {
  const user = await requireAuth(ctx);
  if (!user.role || !allowed.includes(user.role as Role)) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Action réservée aux administrateurs habilités.",
    });
  }
  return user;
}

export const requireAdmin = (ctx: AuthCtx) => requireRole(ctx, "admin");
export const requireController = (ctx: AuthCtx) =>
  requireRole(ctx, "identity_controller");
export const requireDeveloper = (ctx: AuthCtx) => requireRole(ctx, "developer");

/**
 * Garantit que l'email est vérifié — sinon `EMAIL_NOT_VERIFIED`.
 * Utilisé sur les mutations sensibles (KYC, paramètres compte).
 */
export async function requireVerifiedAuth(ctx: AuthCtx): Promise<AuthUser> {
  const user = await requireAuth(ctx);
  if (!user.emailVerified) {
    throw new ConvexError({
      code: "EMAIL_NOT_VERIFIED",
      message: "Vérifiez votre adresse email avant de continuer.",
    });
  }
  return user;
}
