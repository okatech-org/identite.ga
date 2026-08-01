export function buildKycHandoffUrl({
  idnWebUrl,
  continueUrl,
  targetLoa,
  token,
}: {
  idnWebUrl: string
  continueUrl: string
  targetLoa: number
  token: string
}): string {
  const url = new URL("/session-handoff", idnWebUrl)
  url.searchParams.set("handoff_token", token)
  url.searchParams.set("return_to", continueUrl)
  url.searchParams.set("target", String(targetLoa))
  return url.toString()
}

type CurrentUser = {
  profile?: {
    loa?: number
  } | null
} | null

/**
 * `profile.getCurrentUser` nests the assurance level under `profile`.
 * Keep that response-shape knowledge out of the consent page so a missing
 * profile safely falls back to the base assurance level.
 */
export function getCurrentUserLoa(user: CurrentUser): 1 | 2 | 3 {
  const loa = user?.profile?.loa
  return loa === 2 || loa === 3 ? loa : 1
}
