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
      maxOutputTokens: req.maxTokens ?? 4096,
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
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(text) as Record<string, unknown>
      } catch (e) {
        throw new AIProviderError(
          `Gemini a renvoyé un JSON invalide : ${(e as Error).message}`,
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
