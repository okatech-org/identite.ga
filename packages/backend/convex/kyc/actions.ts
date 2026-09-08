"use node"

import { GoogleAuth, type IdTokenClient } from "google-auth-library"
import { v } from "convex/values"

import type { GenericActionCtx } from "convex/server"

import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"
import { internalAction } from "../_generated/server"
import { galleryKey } from "./mutations"

/** Dimension du pack ArcFace `buffalo_l`, figée dans le `vectorIndex`. */
const FACE_EMBEDDING_DIMENSIONS = 512

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
 *   • Défense en profondeur (mode normal) : chaque appel porte aussi un header
 *     `Authorization: Bearer <ID token OIDC Google>` dont l'audience =
 *     `KYC_INFERENCE_URL`, minté via `KYC_INVOKER_SA_KEY`.
 *   • Contournement temporaire Cloud Run : `KYC_INFERENCE_DISABLE_OIDC=true`
 *     supprime ce header lorsque le frontal IAM Google renvoie son 404 avant
 *     le conteneur. Le HMAC reste obligatoire sur toutes les routes métier.
 *   • `POST {KYC_INFERENCE_URL}/v1/ocr`
 *       body     : { documentType, frontImageUrl, backImageUrl? }
 *       réponse  : { confidence: 0..1, fields: Record<string,string>,
 *                    docAuthentic?: boolean }
 *   • `POST {KYC_INFERENCE_URL}/v1/biometric`
 *       body     : { selfieUrl, docFaceUrl }
 *       réponse  : { faceMatch: 0..1, liveness: "real"|"spoof"|"uncertain",
 *                    livenessScore: number,
 *                    embedding?: number[512], embeddingModel?: string }
 *
 *     `embedding` (ArcFace, L2-normalisé) alimente la déduplication 1:N :
 *     un même visage ne doit pas obtenir deux identités vérifiées. Absent si
 *     le service est antérieur à cette fonctionnalité ou son moteur dégradé —
 *     la déduplication est alors déclarée indisponible, ce qui force la revue
 *     manuelle plutôt que de laisser croire à une absence de doublon.
 *
 *     ATTENTION AUX ÉCHELLES : `faceMatch` est un cosinus remappé sur [0, 1] ;
 *     la similarité entre deux `embedding` est un cosinus brut dans [-1, 1].
 *     D'où deux seuils distincts (`KYC_MATCH_THRESHOLD` et
 *     `KYC_FACE_DEDUPE_THRESHOLD`), à ne jamais interchanger.
 *
 * VARIABLES D'ENVIRONNEMENT SUPPLÉMENTAIRES
 *   • `IDENTITY_HASH_PEPPER`      — poivre du hachage des numéros de pièce.
 *     Sans lui, le rapprochement par document est désactivé (un SHA-256 nu sur
 *     un numéro de CNI se casse hors ligne).
 *   • `KYC_FACE_DEDUPE_THRESHOLD` — seuil de rapprochement biométrique,
 *     en cosinus brut. Défaut 0.5, à calibrer sur données réelles.
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
//   KYC_INFERENCE_DISABLE_OIDC — `true` uniquement pour le contournement temporaire
//                            du 404 Google Frontend. La clé SA reste configurée pour
//                            permettre un retour immédiat au mode IAM + HMAC.
const INFERENCE_TIMEOUT_MS = 15_000

// Cache le client ID-token par audience au niveau module — évite de recréer
// un client (et de re-parser la clé SA) à chaque appel ; `google-auth-library`
// gère le refresh du token en interne.
const idTokenClients = new Map<string, IdTokenClient>()

/**
 * OIDC Cloud Run — jeton d'identité Google, audience = URL du service.
 * Défense en profondeur en plus du HMAC applicatif dans le mode normal.
 *
 * Si `KYC_INFERENCE_DISABLE_OIDC=true` ou si `KYC_INVOKER_SA_KEY` n'est pas
 * configuré, retourne `null` — l'appelant n'attache pas de `Authorization` et
 * utilise uniquement le HMAC applicatif.
 */
async function getInvokerAuthHeader(
  audience: string,
): Promise<Record<string, string> | null> {
  const oidcDisabled =
    process.env.KYC_INFERENCE_DISABLE_OIDC?.trim().toLowerCase() === "true"
  if (oidcDisabled) return null

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
    /**
     * `optional` par nécessité, pas par confort : au replay d'un workflow
     * journalisé avant ce déploiement, la valeur mémorisée ne portera pas ce
     * champ. `undefined` doit alors se lire « information indisponible », donc
     * revue manuelle — jamais « aucune réutilisation ».
     */
    documentReuse: v.optional(v.boolean()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    confidence: number
    extractedFields: Record<string, string> | undefined
    documentReuse?: boolean
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
        return { confidence: 0, extractedFields: {}, documentReuse: false }
      }
      throw err
    }

    // Empreinte de la pièce présentée — bloque sa réutilisation sous une autre
    // identité. Le numéro lui-même n'est jamais stocké : il n'a aucun usage
    // produit, seulement une valeur de rapprochement.
    let documentReuse: boolean | undefined
    const documentNumberHash = await fingerprintDocument(
      kyc.documentType,
      result.fields?.documentNumber,
    )
    if (documentNumberHash) {
      documentReuse = await ctx.runMutation(
        internal.kyc.mutations.recordDocumentFingerprint,
        { kycRequestId: args.kycRequestId, documentNumberHash },
      )
    } else {
      // Pièce sans numéro lisible : rien à rapprocher, mais ce n'est pas une
      // absence de réutilisation — c'est une absence de signal.
      documentReuse = undefined
    }

    return {
      confidence: result.confidence,
      extractedFields: result.fields,
      documentReuse,
    }
  },
})

/**
 * Empreinte non réversible d'un numéro de pièce, poivrée.
 *
 * Le poivre (`IDENTITY_HASH_PEPPER`) n'est pas décoratif : un numéro de CNI a
 * une entropie faible et un format contraint, si bien qu'un SHA-256 nu se
 * casserait par force brute hors ligne en quelques minutes. Le type de
 * document entre dans l'empreinte pour éviter qu'un même numéro porté par un
 * passeport et une carte ne se rapproche à tort.
 *
 * Renvoie `null` quand l'OCR n'a pas lu de numéro exploitable, ou quand le
 * poivre n'est pas configuré — mieux vaut ne pas rapprocher que rapprocher sur
 * une empreinte devinable.
 */
async function fingerprintDocument(
  documentType: string,
  rawNumber: string | undefined,
): Promise<string | null> {
  const normalized = rawNumber?.replace(/[\s-]+/g, "").toUpperCase()
  if (!normalized || normalized.length < 4) return null

  const pepper = process.env.IDENTITY_HASH_PEPPER?.trim()
  if (!pepper) {
    console.warn(
      "[kyc/actions] IDENTITY_HASH_PEPPER absent — rapprochement par numéro de pièce désactivé",
    )
    return null
  }
  return await hmacSha256Hex(pepper, `${documentType}|${normalized}`)
}

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
    /**
     * Résultat de la déduplication 1:N. `optional` par nécessité : au replay
     * d'un workflow journalisé avant ce déploiement, ces champs seront
     * `undefined`, et `undefined` doit se lire « information indisponible »
     * — donc revue manuelle — jamais « aucun doublon ».
     */
    faceDuplicate: v.optional(v.boolean()),
    dedupAvailable: v.optional(v.boolean()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    faceMatch: number
    liveness: "real" | "spoof" | "uncertain"
    faceDuplicate?: boolean
    dedupAvailable?: boolean
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
      embedding?: number[]
      embeddingModel?: string
    }>("/v1/biometric", { selfieUrl, docFaceUrl })

    // Déduplication 1:N — logée DANS ce step et non dans un step distinct.
    // `@convex-dev/workflow` échoue sur une violation de déterminisme dès
    // qu'un step est ajouté, retiré ou déplacé : introduire ici un
    // `runIdentityDedup` bloquerait définitivement en `submitted` tous les
    // dossiers en cours de traitement au moment du déploiement.
    const dedup = await searchFaceDuplicates(ctx, {
      kycRequestId: args.kycRequestId,
      userId: kyc.userId,
      embedding: result.embedding,
      modelVersion: result.embeddingModel,
    })

    return {
      faceMatch: result.faceMatch,
      liveness: result.liveness,
      faceDuplicate: dedup.duplicateFound,
      dedupAvailable: dedup.available,
    }
  },
})

/** Seuil de rapprochement biométrique — **cosinus brut**, dans [-1, 1].
 *
 * À NE PAS CONFONDRE avec `KYC_MATCH_THRESHOLD`, qui s'applique au `faceMatch`
 * déjà remappé sur [0, 1] par le service (`_normalize_cosine`). Réutiliser 0.6
 * ici reviendrait à un cosinus de 0.2 — assez laxiste pour rapprocher deux
 * inconnus.
 *
 * 0.5 est un point de départ prudent pour ArcFace, à calibrer sur la
 * population réelle. L'asymétrie des coûts invite à ne pas serrer trop vite :
 * un faux positif ne coûte qu'une revue manuelle, un faux négatif laisse
 * passer un doublon.
 */
const KYC_FACE_DEDUPE_THRESHOLD = Number(
  process.env.KYC_FACE_DEDUPE_THRESHOLD ?? 0.5,
)

/**
 * Cherche le visage dans la galerie des identités déjà vérifiées, puis dépose
 * l'empreinte du dossier courant.
 *
 * L'ORDRE COMPTE : déposer avant de chercher ferait se trouver soi-même, avec
 * une similarité de 1.0, et mettrait chaque dossier en revue.
 *
 * Ne lève jamais : la déduplication est un signal supplémentaire, pas une
 * dépendance du KYC. En cas d'échec, on rend `available: false`, ce que le
 * workflow interprète en revue manuelle plutôt qu'en absence de doublon.
 */
async function searchFaceDuplicates(
  ctx: GenericActionCtx<DataModel>,
  args: {
    kycRequestId: Id<"kycRequest">
    userId: string
    embedding: number[] | undefined
    modelVersion: string | undefined
  },
): Promise<{ duplicateFound: boolean; available: boolean }> {
  // Service antérieur à l'exposition des empreintes, ou moteur dégradé.
  if (!args.embedding || !args.modelVersion) {
    return { duplicateFound: false, available: false }
  }
  if (args.embedding.length !== FACE_EMBEDDING_DIMENSIONS) {
    console.error(
      `[kyc/actions] empreinte de dimension ${args.embedding.length}, ${FACE_EMBEDDING_DIMENSIONS} attendues — déduplication ignorée`,
    )
    return { duplicateFound: false, available: false }
  }

  try {
    const hits = await ctx.vectorSearch("faceTemplate", "by_embedding", {
      vector: args.embedding,
      limit: 10,
      // Le filtre ne sait pas exprimer « userId ≠ le mien » (`eq`/`or`
      // seulement), d'où l'exclusion a posteriori ci-dessous.
      filter: (q) => q.eq("gallery", galleryKey(args.modelVersion!, true)),
    })

    const above = hits.filter((h) => h._score >= KYC_FACE_DEDUPE_THRESHOLD)
    const resolved = above.length
      ? await ctx.runQuery(internal.kyc.mutations._resolveTemplates, {
          ids: above.map((h) => h._id),
        })
      : []
    const scoreById = new Map(above.map((h) => [h._id, h._score]))

    let duplicateFound = false
    for (const r of resolved) {
      // Un dossier ultérieur du même citoyen n'est pas un doublon.
      if (r.userId === args.userId) continue
      duplicateFound = true
      await ctx.runMutation(internal.duplicates.mutations.raiseFlag, {
        userId: args.userId,
        matchedUserId: r.userId,
        signal: "face",
        groupKey: "",
        score: scoreById.get(r.id),
        sourceKycRequestId: args.kycRequestId,
      })
    }

    await ctx.runMutation(internal.kyc.mutations.upsertFaceTemplate, {
      kycRequestId: args.kycRequestId,
      userId: args.userId,
      embedding: args.embedding,
      modelVersion: args.modelVersion,
    })

    return { duplicateFound, available: true }
  } catch (err) {
    console.error("[kyc/actions] déduplication biométrique indisponible", err)
    return { duplicateFound: false, available: false }
  }
}
