import {
  AIProviderError,
  type AICompletionRequest,
  type AICompletionResult,
  type AIProvider,
} from "../types"

/**
 * Provider IA Anthropic — STUB (non implémenté Phase 1).
 *
 * Le squelette est posé pour valider que l'interface `AIProvider` est
 * suffisante. L'implémentation REST sera ajoutée Phase 2 :
 *   • endpoint POST https://api.anthropic.com/v1/messages
 *   • headers x-api-key + anthropic-version: 2023-06-01
 *   • prompt caching natif sur `system` pour les CV récurrents
 *   • modèle par défaut : claude-haiku-4-5
 *
 * Variables d'env attendues (à poser le moment venu) :
 *   • ANTHROPIC_API_KEY
 *   • ANTHROPIC_MODEL (défaut claude-haiku-4-5)
 */

export function createAnthropicProvider(): AIProvider | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  return new AnthropicProvider()
}

class AnthropicProvider implements AIProvider {
  readonly id = "anthropic" as const
  readonly defaultModel =
    process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"

  async complete(_req: AICompletionRequest): Promise<AICompletionResult> {
    throw new AIProviderError(
      "Provider Anthropic non implémenté (Phase 2). Utilisez Gemini ou Mock.",
      "NOT_IMPLEMENTED",
      this.id,
      false,
    )
  }
}
