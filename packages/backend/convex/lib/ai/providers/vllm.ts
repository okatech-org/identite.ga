import {
  AIProviderError,
  type AICompletionRequest,
  type AICompletionResult,
  type AIProvider,
} from "../types"

/**
 * Provider IA vLLM (self-hosted, endpoint OpenAI-compatible) — STUB.
 *
 * Squelette Phase 2+ :
 *   • endpoint POST $VLLM_BASE_URL/v1/chat/completions (compatible OpenAI)
 *   • header Authorization si VLLM_API_KEY défini (sinon pas d'auth)
 *   • modèle dépend du déploiement (ex: Qwen2.5-7B-Instruct)
 *
 * Variables d'env attendues :
 *   • VLLM_BASE_URL (obligatoire pour activer)
 *   • VLLM_MODEL (défaut: dépend du déploiement)
 *   • VLLM_API_KEY (optionnel)
 */

export function createVLLMProvider(): AIProvider | null {
  if (!process.env.VLLM_BASE_URL) return null
  return new VLLMProvider()
}

class VLLMProvider implements AIProvider {
  readonly id = "vllm" as const
  readonly defaultModel = process.env.VLLM_MODEL ?? "default"

  async complete(_req: AICompletionRequest): Promise<AICompletionResult> {
    throw new AIProviderError(
      "Provider vLLM non implémenté (Phase 2). Utilisez Gemini ou Mock.",
      "NOT_IMPLEMENTED",
      this.id,
      false,
    )
  }
}
