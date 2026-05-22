import {
  AIProviderError,
  type AICompletionRequest,
  type AICompletionResult,
  type AIProvider,
} from "../types"

/**
 * Provider IA Gemini (Google).
 *
 * Implémentation REST directe via `fetch` plutôt que via `@google/genai` :
 *   • zéro dépendance npm supplémentaire (le SDK pèse plusieurs MB) ;
 *   • exécutable dans le runtime Convex V8 sans `"use node"`, donc
 *     utilisable depuis les `action` qui appellent ce provider sans avoir
 *     besoin de basculer en Node (cf. cv/ai.ts qui doit rester action V8).
 *
 * Variables d'env :
 *   • `GEMINI_API_KEY` — obligatoire pour activer le provider.
 *   • `GEMINI_MODEL` — défaut `gemini-2.5-flash`.
 *   • `GEMINI_BASE_URL` — défaut `https://generativelanguage.googleapis.com/v1beta`.
 *
 * Cf. https://ai.google.dev/api/generate-content pour le contrat REST.
 */

const DEFAULT_MODEL = "gemini-2.5-flash"
const DEFAULT_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta"

export function createGeminiProvider(): AIProvider | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  return new GeminiProvider(apiKey)
}

class GeminiProvider implements AIProvider {
  readonly id = "gemini" as const
  readonly defaultModel: string

  constructor(private readonly apiKey: string) {
    this.defaultModel = process.env.GEMINI_MODEL ?? DEFAULT_MODEL
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const baseUrl = process.env.GEMINI_BASE_URL ?? DEFAULT_BASE_URL
    const model = this.defaultModel
    const url = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`

    const generationConfig: Record<string, unknown> = {
      temperature: req.temperature ?? 0.4,
      // Plafond généreux par défaut — l'extraction CV peut produire
      // facilement > 4k tokens sur un CV touffu et la troncature côté
      // Gemini donne un JSON cassé ("Unterminated string"). Le SDK
      // facture aux tokens consommés, pas au plafond.
      maxOutputTokens: req.maxTokens ?? 16384,
    }
    if (req.jsonSchema) {
      generationConfig.responseMimeType = "application/json"
      generationConfig.responseSchema = req.jsonSchema
    }

    const userParts: Array<Record<string, unknown>> = []
    for (const att of req.attachments ?? []) {
      userParts.push({
        inlineData: { mimeType: att.mimeType, data: att.data },
      })
    }
    userParts.push({ text: req.prompt })

    const body = {
      systemInstruction: { parts: [{ text: req.system }] },
      contents: [{ role: "user", parts: userParts }],
      generationConfig,
    }

    const started = Date.now()
    let response: Response
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } catch (e) {
      throw new AIProviderError(
        `Échec réseau Gemini : ${(e as Error).message}`,
        "NETWORK",
        this.id,
        true,
      )
    }
    const latencyMs = Date.now() - started

    if (!response.ok) {
      const errorBody = await safeReadJson(response)
      const code = response.status
      const message = extractErrorMessage(errorBody) ?? `HTTP ${code}`
      // Mapping codes
      let mapped: AIProviderError["code"] = "UNKNOWN"
      let retryable = false
      if (code === 401 || code === 403) mapped = "AUTH"
      else if (code === 429) {
        mapped = "RATE_LIMIT"
        retryable = true
      } else if (code === 400) mapped = "INVALID_RESPONSE"
      else if (code >= 500) {
        mapped = "NETWORK"
        retryable = true
      }
      throw new AIProviderError(
        `Gemini ${code}: ${message}`,
        mapped,
        this.id,
        retryable,
      )
    }

    const payload = (await safeReadJson(response)) as GeminiResponse | null
    if (!payload) {
      throw new AIProviderError(
        "Réponse Gemini invalide (JSON vide).",
        "INVALID_RESPONSE",
        this.id,
        false,
      )
    }

    const text = extractText(payload)
    const usage = payload.usageMetadata ?? {}

    if (req.jsonSchema) {
      const parsed = parseJsonResilient(text)
      if (!parsed) {
        throw new AIProviderError(
          "Gemini a renvoyé un JSON invalide (ou tronqué).",
          "INVALID_RESPONSE",
          this.id,
          false,
        )
      }
      return {
        json: parsed,
        provider: this.id,
        model,
        tokensIn: usage.promptTokenCount ?? 0,
        tokensOut: usage.candidatesTokenCount ?? 0,
        latencyMs,
      }
    }

    return {
      text,
      provider: this.id,
      model,
      tokensIn: usage.promptTokenCount ?? 0,
      tokensOut: usage.candidatesTokenCount ?? 0,
      latencyMs,
    }
  }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
    finishReason?: string
  }>
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
  }
  error?: { message?: string }
}

function extractText(payload: GeminiResponse): string {
  const parts = payload.candidates?.[0]?.content?.parts ?? []
  return parts.map((p) => p.text ?? "").join("")
}

async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null
  const candidate = (payload as { error?: { message?: string } }).error?.message
  return candidate ?? null
}

/**
 * Parse JSON tolérant aux artefacts de modèles génératifs :
 *   1. Parse direct (cas heureux : responseSchema renvoie du JSON pur).
 *   2. Extraction du premier bloc `{...}` via regex (si le modèle a ajouté
 *      du texte autour, ou si une fence markdown est présente).
 *   3. Si la chaîne est tronquée (réponse coupée par maxOutputTokens), on
 *      tente de "réparer" en fermant les structures ouvertes — utile pour
 *      récupérer un CV partiel plutôt que d'échouer complètement.
 *
 * Renvoie null si rien n'a pu être parsé.
 */
function parseJsonResilient(raw: string): Record<string, unknown> | null {
  if (!raw || !raw.trim()) return null
  // 1. Parse direct
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    // continue
  }
  // 2. Extraire le premier { ... } (cas markdown / texte autour)
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0]) as Record<string, unknown>
    } catch {
      // continue
    }
  }
  // 3. JSON tronqué : on coupe la dernière clé incomplète et on ferme
  //    les accolades / crochets ouverts.
  const repaired = repairTruncatedJson(raw)
  if (repaired) {
    try {
      return JSON.parse(repaired) as Record<string, unknown>
    } catch {
      return null
    }
  }
  return null
}

function repairTruncatedJson(raw: string): string | null {
  const start = raw.indexOf("{")
  if (start < 0) return null
  let s = raw.slice(start)
  // Coupe à la dernière virgule (on perd la propriété tronquée mais on
  // garde tout ce qui précède).
  const lastComma = s.lastIndexOf(",")
  if (lastComma > 0) s = s.slice(0, lastComma)
  // Compte les ouvertures vs fermetures, hors string.
  let depthCurly = 0
  let depthSquare = 0
  let inString = false
  let escape = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (escape) {
      escape = false
      continue
    }
    if (c === "\\") {
      escape = true
      continue
    }
    if (c === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (c === "{") depthCurly++
    else if (c === "}") depthCurly--
    else if (c === "[") depthSquare++
    else if (c === "]") depthSquare--
  }
  if (inString) return null // milieu de string, abandon
  while (depthSquare > 0) {
    s += "]"
    depthSquare--
  }
  while (depthCurly > 0) {
    s += "}"
    depthCurly--
  }
  return s
}
