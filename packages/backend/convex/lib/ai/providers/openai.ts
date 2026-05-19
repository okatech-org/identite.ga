import {
  AIProviderError,
  type AICompletionRequest,
  type AICompletionResult,
  type AIProvider,
} from "../types"

/**
 * Provider IA OpenAI — STUB (non implémenté Phase 1).
 *
 * Squelette pour la Phase 2 :
 *   • endpoint POST https://api.openai.com/v1/chat/completions
 *   • header Authorization: Bearer $OPENAI_API_KEY
 *   • structured output via response_format: { type: "json_schema", ... }
 *   • modèle par défaut : gpt-4.1-mini
 *
 * Variables d'env attendues (à poser le moment venu) :
 *   • OPENAI_API_KEY
 *   • OPENAI_MODEL (défaut gpt-4.1-mini)
 *   • OPENAI_BASE_URL (défaut https://api.openai.com/v1) — utile pour pointer
 *     vers un proxy compatible OpenAI (Azure, Together, etc.).
 */

export function createOpenAIProvider(): AIProvider | null {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  return new OpenAIProvider()
}

class OpenAIProvider implements AIProvider {
  readonly id = "openai" as const
  readonly defaultModel = process.env.OPENAI_MODEL ?? "gpt-4.1-mini"

  async complete(_req: AICompletionRequest): Promise<AICompletionResult> {
    throw new AIProviderError(
      "Provider OpenAI non implémenté (Phase 2). Utilisez Gemini ou Mock.",
      "NOT_IMPLEMENTED",
      this.id,
      false,
    )
  }
}
