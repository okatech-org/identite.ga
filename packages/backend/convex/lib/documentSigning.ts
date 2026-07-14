import { ConvexError } from "convex/values"

/**
 * Signature RS256 « attestation simple » de documents (feature « Signer un
 * document »). PAS une signature eIDAS qualifiée : c'est un JWT RS256
 * standard (header.payload.signature) qui atteste que le sha256 d'un
 * document a été signé par une identité IDN précise à un instant T,
 * vérifiable par un tiers indépendamment de Convex via la JWKS exposée à
 * `GET /.well-known/document-signing-jwks.json` (cf. http.ts) — n'importe
 * quelle lib JWT/JWKS standard (jose, jsonwebtoken, jwt.io…) peut vérifier
 * la signature.
 *
 * Pourquoi un keypair dédié plutôt que la JWKS RS256 déjà émise par le
 * plugin better-auth `jwt` (cf. auth.ts) : ce plugin ne signe qu'à travers
 * des endpoints better-auth invoqués via de vraies requêtes HTTP (le
 * contexte interne `runWithEndpointContext` d'AsyncLocalStorage, alimenté
 * par `auth.handler(request)` / `auth.api.*`) — tout l'usage existant dans
 * ce repo passe par `http.ts`, jamais par une query/mutation Convex. Le
 * reproduire hors HTTP est un chemin non éprouvé ici, et son composant
 * (@convex-dev/better-auth) est explicitement traité comme hors de portée
 * pour convex-test ailleurs dans ce repo (cf. commentaire dans
 * `iboite/messages.test.ts` sur le coût de seeder ses tables internes).
 * Un keypair RS256 « maison », généré une fois et stocké en env Convex,
 * donne la même propriété de vérifiabilité publique tout en restant
 * entièrement testable en WebCrypto pur (même idiome que
 * `presentation.ts` pour l'HMAC).
 *
 * Génération du keypair (une fois, en dev puis en prod), ex. via Node :
 *   node -e "crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',
 *     modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},
 *     true,['sign','verify']).then(async k=>{
 *       const priv=Buffer.from(await crypto.subtle.exportKey('pkcs8',k.privateKey)).toString('base64');
 *       const pub=Buffer.from(await crypto.subtle.exportKey('spki',k.publicKey)).toString('base64');
 *       console.log('DOCUMENT_SIGNING_PRIVATE_KEY='+priv);
 *       console.log('DOCUMENT_SIGNING_PUBLIC_KEY='+pub);
 *     })"
 * puis :
 *   bunx convex env set DOCUMENT_SIGNING_PRIVATE_KEY "<pkcs8_b64>"
 *   bunx convex env set DOCUMENT_SIGNING_PUBLIC_KEY  "<spki_b64>"
 */

const ALG = "RS256"
const RSA_PARAMS = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" } as const

/** Identifiant de clé courant (à incrémenter en cas de rotation). */
export const DOCUMENT_SIGNING_KEY_ID = "doc-sign-1"

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin)
}

function base64urlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "")
}

function base64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4))
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/") + pad
  return base64ToBytes(b64)
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new ConvexError({
      code: "CONFIG_MISSING",
      message:
        `${name} non configurée. Générer un keypair RSA-2048 (cf. commentaire ` +
        `en tête de convex/lib/documentSigning.ts) puis ` +
        `\`bunx convex env set ${name} "..."\`.`,
    })
  }
  return value
}

async function importPrivateKey(): Promise<CryptoKey> {
  const b64 = requireEnv("DOCUMENT_SIGNING_PRIVATE_KEY")
  return await crypto.subtle.importKey(
    "pkcs8",
    base64ToBytes(b64) as BufferSource,
    RSA_PARAMS,
    false,
    ["sign"],
  )
}

/** `extractable: true` — c'est la clé PUBLIQUE, exposée telle quelle via la JWKS. */
async function importPublicKey(): Promise<CryptoKey> {
  const b64 = requireEnv("DOCUMENT_SIGNING_PUBLIC_KEY")
  return await crypto.subtle.importKey(
    "spki",
    base64ToBytes(b64) as BufferSource,
    RSA_PARAMS,
    true,
    ["verify"],
  )
}

export type DocumentSignaturePayload = {
  sub: string // userId signataire
  name: string // identité affichée (pivot ou email en repli)
  idnId?: string
  hash: string // sha256 hex du document au moment de la signature
  documentItemId?: string
  documentName?: string
  iat: number // ms epoch
}

/** Signe un payload d'attestation en JWT RS256 (header.payload.signature). */
export async function signDocument(
  payload: DocumentSignaturePayload,
): Promise<string> {
  const header = { alg: ALG, typ: "JWT", kid: DOCUMENT_SIGNING_KEY_ID }
  const headerEncoded = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(header)),
  )
  const payloadEncoded = base64urlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  )
  const signingInput = `${headerEncoded}.${payloadEncoded}`

  const privateKey = await importPrivateKey()
  const sig = await crypto.subtle.sign(
    RSA_PARAMS.name,
    privateKey,
    new TextEncoder().encode(signingInput),
  )
  return `${signingInput}.${base64urlEncode(new Uint8Array(sig))}`
}

export type DocumentSignatureVerification =
  | { valid: true; payload: DocumentSignaturePayload }
  | { valid: false }

/**
 * Vérifie un JWT RS256 émis par `signDocument`. Ne throw jamais — toute
 * anomalie (format, algo, signature, JSON) renvoie `{ valid: false }`.
 */
export async function verifyDocumentToken(
  token: string,
): Promise<DocumentSignatureVerification> {
  const parts = token.split(".")
  if (parts.length !== 3) return { valid: false }
  const [headerEncoded, payloadEncoded, sigEncoded] = parts as [
    string,
    string,
    string,
  ]

  let header: { alg?: string }
  try {
    header = JSON.parse(
      new TextDecoder().decode(base64urlDecode(headerEncoded)),
    )
  } catch {
    return { valid: false }
  }
  if (header.alg !== ALG) return { valid: false }

  let ok: boolean
  try {
    const publicKey = await importPublicKey()
    ok = await crypto.subtle.verify(
      RSA_PARAMS.name,
      publicKey,
      base64urlDecode(sigEncoded),
      new TextEncoder().encode(`${headerEncoded}.${payloadEncoded}`),
    )
  } catch {
    return { valid: false }
  }
  if (!ok) return { valid: false }

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(payloadEncoded)),
    ) as DocumentSignaturePayload
    return { valid: true, payload }
  } catch {
    return { valid: false }
  }
}

/** JWK public — servi par `GET /.well-known/document-signing-jwks.json`. */
export async function getPublicJwk(): Promise<Record<string, unknown>> {
  const key = await importPublicKey()
  const jwk = await crypto.subtle.exportKey("jwk", key)
  return { ...jwk, kid: DOCUMENT_SIGNING_KEY_ID, alg: ALG, use: "sig" }
}
