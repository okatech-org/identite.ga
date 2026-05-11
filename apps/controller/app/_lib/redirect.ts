/**
 * Helpers de redirection sûrs — anti open-redirect.
 * Copie de `apps/web/app/(auth)/_lib/redirect.ts`.
 */
export function safeRedirectTo(input: string | null, fallback: string): string {
  if (!input) return fallback
  if (!input.startsWith("/")) return fallback
  if (input.startsWith("//") || input.startsWith("/\\")) return fallback
  return input
}
