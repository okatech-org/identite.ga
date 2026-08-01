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
