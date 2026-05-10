import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/**
 * Better Auth React client — utilisé côté apps/web (identite.ga).
 *
 * Phase 1 : Better Auth est monté dans apps/web. Quand on créera apps/auth
 * sur connexion.identite.ga, on basculera la `baseURL` ici vers ce sous-domaine
 * et on ajoutera le plugin `crossDomain` (cookie .identite.ga partagé entre les
 * deux apps Next.js).
 *
 * Usage : `import { authClient } from "@/lib/auth-client"` puis
 * `authClient.signIn.email({...})`, `authClient.useSession()`, etc.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authClient: any = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL,
  plugins: [convexClient()],
});
