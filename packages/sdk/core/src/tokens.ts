import type { DiscoveryDocument, IDNTokens, IDNUser } from "./types.js"

interface TokenResponseRaw {
  access_token: string
  refresh_token?: string
  id_token: string
  token_type: string
  expires_in: number
  scope?: string
}

const tokenFromResponse = (raw: TokenResponseRaw): IDNTokens => ({
  accessToken: raw.access_token,
  refreshToken: raw.refresh_token,
  idToken: raw.id_token,
  tokenType: "Bearer",
  expiresAt: Math.floor(Date.now() / 1000) + raw.expires_in,
  scope: raw.scope,
})

const postForm = async (
  url: string,
  body: Record<string, string>,
): Promise<TokenResponseRaw> => {
  const params = new URLSearchParams(body)
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`[@idn/core] Token endpoint ${res.status} — ${text}`)
  }
  return (await res.json()) as TokenResponseRaw
}

export const exchangeCode = async (params: {
  discovery: DiscoveryDocument
  clientId: string
  code: string
  codeVerifier: string
  redirectUri: string
}): Promise<IDNTokens> => {
  const raw = await postForm(params.discovery.token_endpoint, {
    grant_type: "authorization_code",
    code: params.code,
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
    redirect_uri: params.redirectUri,
  })
  return tokenFromResponse(raw)
}

export const refreshAccessToken = async (params: {
  discovery: DiscoveryDocument
  clientId: string
  refreshToken: string
}): Promise<IDNTokens> => {
  const raw = await postForm(params.discovery.token_endpoint, {
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    client_id: params.clientId,
  })
  return tokenFromResponse(raw)
}

export const fetchUserInfo = async (
  discovery: DiscoveryDocument,
  accessToken: string,
): Promise<IDNUser> => {
  const res = await fetch(discovery.userinfo_endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    throw new Error(`[@idn/core] userinfo ${res.status}`)
  }
  return (await res.json()) as IDNUser
}

export const revokeToken = async (params: {
  discovery: DiscoveryDocument
  clientId: string
  token: string
  tokenTypeHint?: "access_token" | "refresh_token"
}): Promise<void> => {
  if (!params.discovery.revocation_endpoint) return
  const body: Record<string, string> = {
    token: params.token,
    client_id: params.clientId,
  }
  if (params.tokenTypeHint) body.token_type_hint = params.tokenTypeHint
  await fetch(params.discovery.revocation_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  }).catch(() => undefined) // best-effort
}
