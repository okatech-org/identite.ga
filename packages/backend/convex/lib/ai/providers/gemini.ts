import {
  GoogleGenerativeAI,
  type GenerateContentRequest,
  type Part,
} from "@google/generative-ai"

import {
  AIProviderError,
  type AICompletionRequest,
  type AICompletionResult,
  type AIProvider,
} from "../types"

/**
 * Provider IA Gemini (Google), via le SDK officiel `@google/generative-ai`.
 *
 * On utilisait avant un appel `fetch` direct vers l'API REST — fonctionnel
 * mais bricolé (parsing manuel des erreurs, des usages, des parts
 * multimodales). Le SDK officiel fait tout ça proprement et reste léger.
 *
 * Variables d'env :
 *   • `GEMINI_API_KEY` — obligatoire pour activer le provider.
 *   • `GEMINI_MODEL` — défaut `gemini-2.5-flash`.
 *
 * Cf. https://ai.google.dev/api/generate-content pour le contrat.
 */

const DEFAULT_MODEL = "gemini-2.5-flash"

export function createGeminiProvider(): AIProvider | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  return new GeminiProvider(apiKey)
}

class GeminiProvider implements AIProvider {
  readonly id = "gemini" as const
  readonly defaultModel: string
  private readonly client: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.defaultModel = process.env.GEMINI_MODEL ?? DEFAULT_MODEL
    this.client = new GoogleGenerativeAI(apiKey)
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const model = this.client.getGenerativeModel({
      model: this.defaultModel,
      systemInstruction: req.system,
    })

    const generationConfig: GenerateContentRequest["generationConfig"] = {
      temperature: req.temperature ?? 0.4,
      // Plafond généreux par défaut — extraction CV génère facilement
      // > 4k tokens et la troncature côté Gemini donne du JSON cassé.
      maxOutputTokens: req.maxTokens ?? 16384,
    }
    if (req.jsonSchema) {
      generationConfig.responseMimeType = "application/json"
      // Le SDK type `responseSchema` comme un sous-set strict (Schema). On
      // cast — notre IMPORT_SCHEMA est volontairement plus laxiste et le
      // serveur Google accepte la forme JSON Schema standard.
      ;(generationConfig as { responseSchema?: unknown }).responseSchema =
        req.jsonSchema
    }

    const parts: Part[] = []
    for (const att of req.attachments ?? []) {
      parts.push({
        inlineData: { mimeType: att.mimeType, data: att.data },
      })
    }
    parts.push({ text: req.prompt })

    const started = Date.now()
    let response
    try {
      response = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig,
      })
    } catch (e) {
      throw mapSdkError(e, this.id)
    }
    const latencyMs = Date.now() - started

    const text = response.response.text()
    const usage = response.response.usageMetadata

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
        model: this.defaultModel,
        tokensIn: usage?.promptTokenCount ?? 0,
        tokensOut: usage?.candidatesTokenCount ?? 0,
        latencyMs,
      }
    }

    return {
      text,
      provider: this.id,
      model: this.defaultModel,
      tokensIn: usage?.promptTokenCount ?? 0,
      tokensOut: usage?.candidatesTokenCount ?? 0,
      latencyMs,
    }
  }
}

/**
 * Normalise les erreurs du SDK Gemini vers `AIProviderError`.
 * Le SDK throw des `GoogleGenerativeAIFetchError` qui exposent `status` et
 * `statusText`, sinon des erreurs natives sur les soucis réseau.
 */
function mapSdkError(e: unknown, id: AIProvider["id"]): AIProviderError {
  const err = e as { status?: number; message?: string }
  const message = err.message ?? "Échec de l'appel Gemini."
  const status = err.status

  if (status === 401 || status === 403) {
    return new AIProviderError(`Gemini AUTH : ${message}`, "AUTH", id, false)
  }
  if (status === 429) {
    return new AIProviderError(`Gemini RATE_LIMIT : ${message}`, "RATE_LIMIT", id, true)
  }
  if (status === 400) {
    return new AIProviderError(`Gemini 400 : ${message}`, "INVALID_RESPONSE", id, false)
  }
  if (status !== undefined && status >= 500) {
    return new AIProviderError(`Gemini ${status} : ${message}`, "NETWORK", id, true)
  }
  // Sans status, on suppose un échec réseau (timeout, DNS, etc.) → retryable.
  return new AIProviderError(`Échec réseau Gemini : ${message}`, "NETWORK", id, true)
}

/**
 * Parse JSON tolérant aux artefacts de modèles génératifs :
 *   1. Parse direct (cas heureux : responseSchema renvoie du JSON pur).
 *   2. Extraction du premier bloc `{...}` via regex (texte autour / fence
 *      markdown).
 *   3. Réparation de troncature : si la réponse est coupée par
 *      maxOutputTokens, on retire la dernière clé incomplète et on ferme
 *      les structures ouvertes — permet de récupérer un CV partiel plutôt
 *      que d'échouer complètement.
 */
function parseJsonResilient(raw: string): Record<string, unknown> | null {
  if (!raw || !raw.trim()) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    // continue
  }
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0]) as Record<string, unknown>
    } catch {
      // continue
    }
  }
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
  const lastComma = s.lastIndexOf(",")
  if (lastComma > 0) s = s.slice(0, lastComma)
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
  if (inString) return null
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
