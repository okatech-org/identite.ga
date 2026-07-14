"use node"

import { GoogleAuth, type IdTokenClient } from "google-auth-library"
import { v } from "convex/values"

import { internal } from "../_generated/api"
import { internalAction } from "../_generated/server"

/**
 * Actions KYC — appellent NOTRE microservice d'inférence biométrique
 * auto-hébergé (souveraineté : plus de dépendance à un SaaS tiers type
 * Smile ID).
 *
 * ADAPTER — contrat de NOTRE service kyc-inference. À respecter EXACTEMENT
 * (l'équipe qui implémente le service le fait en miroir de ce contrat) :
 *
 *   • Auth sortante : header `X-Signature` = HMAC-SHA256(hex) du body JSON
 *     BRUT (la chaîne exacte envoyée, avant tout re-sérialisation) avec
 *     `KYC_INFERENCE_SECRET`, + header `X-Timestamp` (ISO 8601).
 *     Base URL = `KYC_INFERENCE_URL`.
 *   • Défense en profondeur : le service Cloud Run est déployé PRIVÉ
 *     (`--no-allow-unauthenticated`). En plus du HMAC applicatif, chaque
 *     appel porte un header `Authorization: Bearer <ID token OIDC Google>`
 *     dont l'audience = `KYC_INFERENCE_URL` (URL racine du service), minté
 *     via `KYC_INVOKER_SA_KEY`. Voir `getInvokerAuthHeader` ci-dessous.
 *   • `POST {KYC_INFERENCE_URL}/v1/ocr`
 *       body     : { documentType, frontImageUrl, backImageUrl? }
 *       réponse  : { confidence: 0..1, fields: Record<string,string>,
 *                    docAuthentic?: boolean }
 *   • `POST {KYC_INFERENCE_URL}/v1/biometric`
 *       body     : { selfieUrl, docFaceUrl }
 *       réponse  : { faceMatch: 0..1, liveness: "real"|"spoof"|"uncertain",
 *                    livenessScore: number }
 *
 * Erreur réseau / timeout / réponse non-OK → throw : le workflow
 * (`kyc/workflow.ts`) retry déjà ces actions (backoff exponentiel), pas de
 * retry ad-hoc ici.
 *
 * EXCEPTION — dégradation OCR : le moteur OCR (PaddleOCR) est temporairement
 * désactivé côté service (segfault amd64, cf. TODO côté kyc-inference — à
 * réactiver via Tesseract). `/v1/ocr` renvoie alors `503`. Plutôt que de
 * bloquer tout le pipeline KYC (retry × 3 puis échec du workflow), `runOcr`
 * traite CE cas précis comme un signal « pas de lecture OCR disponible » :
 * il renvoie `{ confidence: 0, extractedFields: {} }` sans throw. Une
 * confiance à 0 est structurellement sous `KYC_OCR_THRESHOLD`, donc
 * `decideKycOutcome` ne peut jamais auto-approuver sur cette base — la
 * demande part en revue manuelle (le contrôleur vérifie le document à
 * l'œil), pendant que le face-match + liveness (`runBiometric`, inchangé)
 * continuent d'être évalués normalement, spoof compris (auto-rejet toujours
 * actif). Toute AUTRE erreur (réseau, timeout, 4xx, 5xx ≠ 503) continue de
 * throw → retry workflow, comme avant.
 */

// Env requis — voir .env.example / `bunx convex env set` :
//   KYC_INFERENCE_URL      — URL RACINE du microservice (ex. https://kyc-inference-xxxx.run.app).
//                            Sert aussi d'audience pour l'ID token OIDC ci-dessous : NE PAS
//                            pointer vers un sous-chemin (`/v1/...`).
//   KYC_INFERENCE_SECRET   — clé HMAC partagée pour signer les appels sortants
//   KYC_INVOKER_SA_KEY     — JSON complet d'une clé de compte de service Google (string),
//                            autorisé en IAM invoker sur le service Cloud Run privé. Optionnel :
//                            absent → pas de header Authorization, dégrade vers HMAC seul
//                            (dev local sans service privé).
const INFERENCE_TIMEOUT_MS = 15_000

// Cache le client ID-token par audience au niveau module — évite de recréer
// un client (et de re-parser la clé SA) à chaque appel ; `google-auth-library`
// gère le refresh du token en interne.
const idTokenClients = new Map<string, IdTokenClient>()

/**
 * OIDC Cloud Run — jeton d'identité Google, audience = URL du service.
 * Défense en profondeur en plus du HMAC applicatif : le service kyc-inference
 * est déployé en privé (`--no-allow-unauthenticated`), donc l'appelant doit
 * aussi prouver son identité IAM via un ID token Google dont l'audience est
 * l'URL racine du service.
 *
 * Si `KYC_INVOKER_SA_KEY` n'est pas configuré (ex. dev local sans service
 * privé), retourne `null` — l'appelant n'attache pas de `Authorization` et
 * dégrade vers HMAC seul.
 */
async function getInvokerAuthHeader(
  audience: string,
): Promise<Record<string, string> | null> {
  const saKeyJson = process.env.KYC_INVOKER_SA_KEY
  if (!saKeyJson) return null

  let client = idTokenClients.get(audience)
  if (!client) {
    let credentials: object
    try {
      credentials = JSON.parse(saKeyJson)
    } catch {
      throw new Error(
        "[kyc/actions] KYC_INVOKER_SA_KEY invalide (JSON de clé de compte de service Google attendu)",
      )
    }
    const auth = new GoogleAuth({ credentials })
    client = await auth.getIdTokenClient(audience)
    idTokenClients.set(audience, client)
  }

  // `getRequestHeaders()` renvoie un `Headers` (fetch) potentiellement
  // enrichi d'autres headers internes à la lib — on n'extrait QUE
  // `Authorization` (lookup insensible à la casse via `.get()`).
  const headers = await client.getRequestHeaders()
  const authorization = headers.get("Authorization")
  return authorization ? { Authorization: authorization } : null
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `[kyc/actions] ${name} non configuré (bunx convex env set ${name} ...)`,
    )
  }
  return value
}

// Web Crypto (`crypto.subtle`) plutôt que `node:crypto` — pas besoin du
// runtime Node pour du HMAC-SHA256, et ça reste exécutable tel quel sous
// convex-test (même schéma que `convex/presentation.ts` / `convex/audit.ts`).
function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  )
  return toHex(sig)
}

/**
 * Erreur HTTP typée sur un appel `callInference` — porte le status code pour
 * permettre à l'appelant de distinguer un 503 « moteur indisponible » d'une
 * vraie panne (réseau/timeout/4xx/5xx≠503) sans reparser le message.
 */
class InferenceHttpError extends Error {
  readonly status: number
  constructor(path: string, status: number) {
    super(`[kyc/actions] ${path} HTTP ${status}`)
    this.name = "InferenceHttpError"
    this.status = status
  }
}

/**
 * Appel signé vers le microservice d'inférence. Isolé pour partager la
 * logique de signature/timeout entre `runOcr` et `runBiometric`.
 */
async function callInference<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = requireEnv("KYC_INFERENCE_URL").replace(/\/+$/, "")
  const secret = requireEnv("KYC_INFERENCE_SECRET")

  const payload = JSON.stringify(body)
  const timestamp = new Date().toISOString()
  const signature = await hmacSha256Hex(secret, payload)
  // OIDC Cloud Run — audience = URL racine du service (baseUrl), pas le path.
  const authHeader = await getInvokerAuthHeader(baseUrl)

  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature": signature,
      "X-Timestamp": timestamp,
      ...authHeader,
    },
    body: payload,
    signal: AbortSignal.timeout(INFERENCE_TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new InferenceHttpError(path, res.status)
  }
  return (await res.json()) as T
}

export const runOcr = internalAction({
  args: {
    kycRequestId: v.id("kycRequest"),
  },
  returns: v.object({
    confidence: v.number(),
    extractedFields: v.optional(v.record(v.string(), v.string())),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    confidence: number
    extractedFields: Record<string, string> | undefined
  }> => {
    const kyc = await ctx.runQuery(internal.kyc.mutations._getForInference, {
      kycRequestId: args.kycRequestId,
    })
    if (!kyc) throw new Error("[kyc/actions] KYC request not found")
    if (!kyc.documentImages.front) {
      throw new Error("[kyc/actions] document recto manquant")
    }

    const [frontImageUrl, backImageUrl] = await Promise.all([
      ctx.storage.getUrl(kyc.documentImages.front),
      kyc.documentImages.back
        ? ctx.storage.getUrl(kyc.documentImages.back)
        : Promise.resolve(null),
    ])
    if (!frontImageUrl) {
      throw new Error("[kyc/actions] URL document recto indisponible")
    }

    // ADAPTER — contrat de NOTRE service kyc-inference : POST /v1/ocr
    let result: {
      confidence: number
      fields: Record<string, string>
      docAuthentic?: boolean
    }
    try {
      result = await callInference("/v1/ocr", {
        documentType: kyc.documentType,
        frontImageUrl,
        ...(backImageUrl ? { backImageUrl } : {}),
      })
    } catch (err) {
      // Dégradation OCR (cf. docstring de fichier) : le moteur OCR est
      // temporairement désactivé côté service (PaddleOCR, segfault amd64) —
      // il renvoie 503. On ne bloque PAS tout le pipeline KYC dessus : une
      // confiance à 0 échoue structurellement le seuil d'auto-approbation,
      // donc la demande part en revue manuelle (cf. `decideKycOutcome`) au
      // lieu de faire échouer le workflow après 3 retries. Toute AUTRE
      // erreur (réseau, timeout, 4xx, 5xx ≠ 503) continue de throw.
      if (err instanceof InferenceHttpError && err.status === 503) {
        console.warn(
          "[kyc/actions] /v1/ocr indisponible (503) — dégradation vers revue manuelle",
        )
        return { confidence: 0, extractedFields: {} }
      }
      throw err
    }

    return {
      confidence: result.confidence,
      extractedFields: result.fields,
    }
  },
})

export const runBiometric = internalAction({
  args: {
    kycRequestId: v.id("kycRequest"),
  },
  returns: v.object({
    faceMatch: v.number(),
    liveness: v.union(
      v.literal("real"),
      v.literal("spoof"),
      v.literal("uncertain"),
    ),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    faceMatch: number
    liveness: "real" | "spoof" | "uncertain"
  }> => {
    const kyc = await ctx.runQuery(internal.kyc.mutations._getForInference, {
      kycRequestId: args.kycRequestId,
    })
    if (!kyc) throw new Error("[kyc/actions] KYC request not found")
    if (!kyc.selfieImage || !kyc.documentImages.front) {
      throw new Error("[kyc/actions] selfie ou document recto manquant")
    }

    const [selfieUrl, docFaceUrl] = await Promise.all([
      ctx.storage.getUrl(kyc.selfieImage),
      ctx.storage.getUrl(kyc.documentImages.front),
    ])
    if (!selfieUrl || !docFaceUrl) {
      throw new Error("[kyc/actions] URLs image indisponibles")
    }

    // ADAPTER — contrat de NOTRE service kyc-inference : POST /v1/biometric
    const result = await callInference<{
      faceMatch: number
      liveness: "real" | "spoof" | "uncertain"
      livenessScore: number
    }>("/v1/biometric", { selfieUrl, docFaceUrl })

    return {
      faceMatch: result.faceMatch,
      liveness: result.liveness,
    }
  },
})
