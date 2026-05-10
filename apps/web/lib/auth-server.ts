import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs"

/**
 * Server-side proxy entre Next.js et les routes Better Auth montées sur
 * le déploiement Convex (cf. packages/backend/convex/http.ts).
 *
 * Cette factory expose :
 *   • `handler.{GET,POST}` à brancher sur app/api/auth/[...all]/route.ts
 *   • `getToken()` / `isAuthenticated()` pour les Server Components
 *   • `preloadAuthQuery` / `fetchAuthQuery` pour SSR
 */
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL")
}
if (!convexSiteUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_SITE_URL — should be the .convex.site URL",
  )
}

// Le type concret pourrait être destructuré, mais TypeScript veut alors
// référencer des chemins internes (convex-helpers) non portables. On garde
// une référence opaque qu'on consomme au point d'usage.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: any = convexBetterAuthNextJs({
  convexUrl,
  convexSiteUrl,
})

export const handler = auth.handler as {
  GET: (request: Request) => Promise<Response>
  POST: (request: Request) => Promise<Response>
}

export const getToken = auth.getToken as () => Promise<string | undefined>
export const isAuthenticated = auth.isAuthenticated as () => Promise<boolean>
