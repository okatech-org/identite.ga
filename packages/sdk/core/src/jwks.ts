/**
 * Vérification d'ID token OIDC — signature RS256/ES256 via JWKS, claims standards.
 *
 * Implémentation WebCrypto pure, zéro dépendance.
 */

interface JwkKey {
  kty: string
  kid?: string
  alg?: string
  use?: string
  n?: string
  e?: string
  crv?: string
  x?: string
  y?: string
}

interface JwksDocument {
  keys: JwkKey[]
}

const base64UrlDecode = (input: string): Uint8Array => {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4))
  const base64 = (input + pad).replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const decodeJwtPart = <T>(part: string): T => {
  const decoder = new TextDecoder()
  return JSON.parse(decoder.decode(base64UrlDecode(part))) as T
}

const ALLOWED_ALGS = new Set(["RS256", "ES256"])

const jwksCache = new Map<string, { doc: JwksDocument; fetchedAt: number }>()
const JWKS_TTL_MS = 60 * 60 * 1000

const fetchJwks = async (jwksUri: string): Promise<JwksDocument> => {
  const cached = jwksCache.get(jwksUri)
  if (cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) return cached.doc
  const res = await fetch(jwksUri, { headers: { Accept: "application/json" } })
  if (!res.ok) {
    throw new Error(`[@idn/core] JWKS fetch failed (${res.status}) ${jwksUri}`)
  }
  const doc = (await res.json()) as JwksDocument
  jwksCache.set(jwksUri, { doc, fetchedAt: Date.now() })
  return doc
}

const importKey = async (jwk: JwkKey, alg: string): Promise<CryptoKey> => {
  if (alg === "RS256") {
    return crypto.subtle.importKey(
      "jwk",
      jwk as JsonWebKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    )
  }
  if (alg === "ES256") {
    return crypto.subtle.importKey(
      "jwk",
      jwk as JsonWebKey,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    )
  }
  throw new Error(`[@idn/core] Algorithme non supporté : ${alg}`)
}

const verifySignature = async (
  key: CryptoKey,
  alg: string,
  signedInput: string,
  signature: Uint8Array,
): Promise<boolean> => {
  const data = new TextEncoder().encode(signedInput) as BufferSource
  const sig = signature as BufferSource
  if (alg === "RS256") {
    return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, data)
  }
  return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, sig, data)
}

export interface VerifyOptions {
  issuer: string
  audience: string
  jwksUri: string
  /** Nonce attendu (vérifié si fourni) */
  nonce?: string
  /** Tolérance d'horloge en secondes (défaut : 60) */
  clockSkew?: number
}

export interface DecodedIdToken {
  header: { alg: string; kid?: string; typ?: string }
  payload: {
    iss: string
    aud: string | string[]
    sub: string
    exp: number
    iat: number
    nbf?: number
    nonce?: string
    [claim: string]: unknown
  }
}

export const verifyIdToken = async (
  token: string,
  opts: VerifyOptions,
): Promise<DecodedIdToken> => {
  const parts = token.split(".")
  if (parts.length !== 3) {
    throw new Error("[@idn/core] ID token mal formé (≠ 3 segments)")
  }
  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string]
  const header = decodeJwtPart<DecodedIdToken["header"]>(headerB64)
  const payload = decodeJwtPart<DecodedIdToken["payload"]>(payloadB64)

  if (!ALLOWED_ALGS.has(header.alg)) {
    throw new Error(
      `[@idn/core] Algo ID token refusé : ${header.alg} (autorisés : RS256, ES256)`,
    )
  }

  const jwks = await fetchJwks(opts.jwksUri)
  const jwk =
    (header.kid ? jwks.keys.find((k) => k.kid === header.kid) : undefined) ??
    jwks.keys[0]
  if (!jwk) throw new Error("[@idn/core] Aucune clé JWKS trouvée")

  const cryptoKey = await importKey(jwk, header.alg)
  const signature = base64UrlDecode(signatureB64)
  const valid = await verifySignature(
    cryptoKey,
    header.alg,
    `${headerB64}.${payloadB64}`,
    signature,
  )
  if (!valid) throw new Error("[@idn/core] Signature ID token invalide")

  if (payload.iss !== opts.issuer) {
    throw new Error(
      `[@idn/core] Issuer mismatch : attendu ${opts.issuer}, reçu ${payload.iss}`,
    )
  }
  const audOk = Array.isArray(payload.aud)
    ? payload.aud.includes(opts.audience)
    : payload.aud === opts.audience
  if (!audOk) {
    throw new Error("[@idn/core] Audience mismatch")
  }
  const now = Math.floor(Date.now() / 1000)
  const skew = opts.clockSkew ?? 60
  if (payload.exp + skew < now) throw new Error("[@idn/core] ID token expiré")
  if (payload.iat - skew > now) throw new Error("[@idn/core] ID token iat dans le futur")
  if (payload.nbf !== undefined && payload.nbf - skew > now) {
    throw new Error("[@idn/core] ID token nbf dans le futur")
  }
  if (opts.nonce !== undefined && payload.nonce !== opts.nonce) {
    throw new Error("[@idn/core] Nonce mismatch")
  }

  return { header, payload }
}

export const clearJwksCache = (jwksUri?: string): void => {
  if (jwksUri) jwksCache.delete(jwksUri)
  else jwksCache.clear()
}
