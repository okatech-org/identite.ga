/**
 * PKCE — Proof Key for Code Exchange (RFC 7636).
 *
 * Toujours S256 dans IDN — pas d'option pour `plain` (cahier des charges §8.1).
 */

const subtle = (): SubtleCrypto => {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error(
      "[@idn/core] WebCrypto indisponible — PKCE S256 requiert globalThis.crypto.subtle",
    )
  }
  return crypto.subtle
}

const base64UrlEncode = (bytes: Uint8Array): string => {
  let str = ""
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]!)
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** 32 bytes aléatoires encodés base64url — ~43 caractères. */
export const generateVerifier = (): string => {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

/** Challenge S256 du verifier — SHA-256 puis base64url. */
export const challengeS256 = async (verifier: string): Promise<string> => {
  const data = new TextEncoder().encode(verifier)
  const digest = await subtle().digest("SHA-256", data)
  return base64UrlEncode(new Uint8Array(digest))
}

/** Random URL-safe utilisé pour `state` et `nonce` (32 bytes). */
export const randomString = (): string => {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}
