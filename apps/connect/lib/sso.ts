const SSO_CHECKED_PARAM = "sso_checked"

const isInternalPath = (value: string): boolean =>
  value.startsWith("/") && !value.startsWith("//")

export function resolveIdnWebUrl(
  configuredUrl: string | undefined,
  connectOrigin: string,
): string {
  if (configuredUrl) return configuredUrl

  const current = new URL(connectOrigin)
  if (current.hostname === "localhost" || current.hostname === "127.0.0.1") {
    return `${current.protocol}//${current.hostname}:3000`
  }
  return "https://identite.ga"
}

/**
 * Un login fédéré peut arriver directement depuis oidcProvider (paramètres
 * OAuth en query) ou depuis la page de consentement via redirect_to.
 */
export function isFederatedSignIn(params: URLSearchParams): boolean {
  if (params.get("client_id") && params.get("response_type")) return true

  const redirectTo = params.get("redirect_to")
  if (!redirectTo || !isInternalPath(redirectTo)) return false

  const url = new URL(redirectTo, "https://connect.identite.ga")
  return url.pathname === "/oauth/authorize"
}

export function hasCheckedPortalSession(params: URLSearchParams): boolean {
  return params.get(SSO_CHECKED_PARAM) === "1"
}

/** URL à reprendre une fois que connect.identite.ga possède la session. */
export function buildPostLoginRedirect(params: URLSearchParams): string {
  if (!params.get("client_id") || !params.get("response_type")) {
    const redirectTo = params.get("redirect_to")
    return redirectTo && isInternalPath(redirectTo) ? redirectTo : "/"
  }

  const oauthParams = new URLSearchParams(params)
  oauthParams.delete("redirect_to")
  oauthParams.delete(SSO_CHECKED_PARAM)
  return `/api/auth/oauth2/authorize?${oauthParams.toString()}`
}

/**
 * Construit le détour silencieux par identite.ga. Si le portail n'a aucune
 * session, il renverra vers fallback_to avec sso_checked=1 pour afficher le
 * formulaire sans créer de boucle.
 */
export function buildPortalSsoUrl({
  idnWebUrl,
  connectOrigin,
  postLoginPath,
  signInParams,
}: {
  idnWebUrl: string
  connectOrigin: string
  postLoginPath: string
  signInParams: URLSearchParams
}): string {
  if (!isInternalPath(postLoginPath)) {
    throw new Error("postLoginPath must be internal")
  }

  const connect = new URL(connectOrigin)
  const returnTo = new URL(postLoginPath, connect)

  const fallback = new URL("/sign-in", connect)
  const fallbackParams = new URLSearchParams(signInParams)
  fallbackParams.set(SSO_CHECKED_PARAM, "1")
  fallback.search = fallbackParams.toString()

  const sso = new URL("/sso", idnWebUrl)
  sso.searchParams.set("return_to", returnTo.toString())
  sso.searchParams.set("fallback_to", fallback.toString())
  return sso.toString()
}
