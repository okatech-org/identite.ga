const ALLOWED_RETURN_PATHS = new Set([
  "/api/auth/oauth2/authorize",
  "/oauth/authorize",
])

export function resolveConnectOrigin(
  configuredUrl: string | undefined,
  portalOrigin: string,
): string {
  if (configuredUrl) return new URL(configuredUrl).origin

  const current = new URL(portalOrigin)
  if (current.hostname === "localhost" || current.hostname === "127.0.0.1") {
    return `${current.protocol}//${current.hostname}:3004`
  }
  return "https://connect.identite.ga"
}

export function getAllowedConnectUrl(
  raw: string | null,
  connectOrigin: string,
  kind: "return" | "fallback",
): URL | null {
  if (!raw) return null

  try {
    const url = new URL(raw)
    if (url.origin !== new URL(connectOrigin).origin) return null

    const validPath =
      kind === "return"
        ? ALLOWED_RETURN_PATHS.has(url.pathname)
        : url.pathname === "/sign-in" &&
          url.searchParams.get("sso_checked") === "1"

    return validPath ? url : null
  } catch {
    return null
  }
}

export function buildConnectSessionHandoffUrl({
  connectOrigin,
  returnTo,
  token,
}: {
  connectOrigin: string
  returnTo: string
  token: string
}): string {
  const url = new URL("/session-handoff", connectOrigin)
  url.searchParams.set("handoff_token", token)
  url.searchParams.set("return_to", returnTo)
  return url.toString()
}
