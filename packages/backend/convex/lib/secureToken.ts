/**
 * Primitives de jetons API « maison » (zéro dépendance tierce).
 *
 * Même schéma cryptographique que les `clientSecret` OAuth de
 * developer/apps.ts (SHA-256 + `crypto.getRandomValues` + base64url), mais
 * isolé ici pour être réutilisable par developer/apiKeys.ts (émission/listing)
 * ET par la validation HTTP (hash du jeton présenté). Tout tourne dans le
 * runtime V8 de Convex — pas de `"use node"`.
 *
 * Le secret n'est jamais stocké : on persiste uniquement son hash SHA-256.
 */

/** Préfixe des Personal Access Tokens développeur (cf. `idn_sk_*` pour OAuth). */
const PAT_PREFIX = "idn_pat_"

/** Nombre d'octets d'entropie du secret (192 bits). */
const SECRET_BYTES = 24

function randomBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(n)
  crypto.getRandomValues(bytes)
  return bytes
}

function base64Url(bytes: Uint8Array): string {
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** SHA-256 → hex. Utilisé pour le stockage et la validation. */
export async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token) as BufferSource,
  )
  const arr = new Uint8Array(buf)
  let hex = ""
  for (let i = 0; i < arr.length; i++) {
    hex += arr[i]!.toString(16).padStart(2, "0")
  }
  return hex
}

/**
 * Génère un nouveau jeton API.
 *
 *   • `token`       : secret complet, retourné UNE SEULE FOIS au développeur.
 *   • `tokenHash`   : SHA-256 hex à persister (jamais le secret en clair).
 *   • `tokenPrefix` : début tronqué, sûr à afficher dans la liste des clés.
 */
export async function generateApiToken(): Promise<{
  token: string
  tokenHash: string
  tokenPrefix: string
}> {
  const token = `${PAT_PREFIX}${base64Url(randomBytes(SECRET_BYTES))}`
  const tokenHash = await hashToken(token)
  // Préfixe = marqueur + 6 premiers caractères du secret, ex. `idn_pat_ab12cd…`.
  const tokenPrefix = `${token.slice(0, PAT_PREFIX.length + 6)}…`
  return { token, tokenHash, tokenPrefix }
}

/** Valide grossièrement la forme d'un jeton présenté (avant tout hash/DB). */
export function looksLikeApiToken(value: string): boolean {
  return new RegExp(`^${PAT_PREFIX}[A-Za-z0-9_-]{8,}$`).test(value)
}
