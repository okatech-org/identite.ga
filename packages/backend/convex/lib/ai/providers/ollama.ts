import {
  AIProviderError,
  type AICompletionRequest,
  type AICompletionResult,
  type AIProvider,
} from "../types"

/**
 * Provider IA Ollama (self-hosted) — STUB (non implémenté Phase 1).
 *
 * Squelette pour la Phase 2 :
 *   • endpoint POST $OLLAMA_BASE_URL/api/chat
 *   • format: "json" si jsonSchema fourni (Ollama supporte structured output)
 *   • modèle par défaut : llama3.1:8b
 *
 * Variables d'env attendues :
 *   • OLLAMA_BASE_URL (défaut http://localhost:11434)
 *   • OLLAMA_MODEL (défaut llama3.1:8b)
 *
 * Pas de clé API — c'est self-hosted. L'activation se fait via AI_PROVIDER=ollama.
 */

export function createOllamaProvider(): AIProvider | null {
  // Self-hosted : si AI_PROVIDER=ollama n'est pas explicitement demandé, on
  // n'instancie pas (évite de tenter une connexion locale inutile).
  if (process.env.AI_PROVIDER !== "ollama") return null
  return new OllamaProvider()
}

class OllamaProvider implements AIProvider {
  readonly id = "ollama" as const
  readonly defaultModel = process.env.OLLAMA_MODEL ?? "llama3.1:8b"

  async complete(_req: AICompletionRequest): Promise<AICompletionResult> {
    throw new AIProviderError(
      "Provider Ollama non implémenté (Phase 2). Utilisez Gemini ou Mock.",
      "NOT_IMPLEMENTED",
      this.id,
      false,
    )
  }
}
