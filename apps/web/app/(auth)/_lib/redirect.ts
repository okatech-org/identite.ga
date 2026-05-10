/**
 * Helpers de redirection sûrs — anti open-redirect.
 *
 * On n'accepte qu'un chemin commençant par `/` qui ne tente pas de
 * sortir vers un autre site (`//evil.com` ou `/\evil.com`).
 */

export function safeRedirectTo(input: string | null, fallback: string): string {
  if (!input) return fallback
  if (!input.startsWith("/")) return fallback
  if (input.startsWith("//") || input.startsWith("/\\")) return fallback
  return input
}
