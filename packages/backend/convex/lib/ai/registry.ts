import { AIProviderError, type AIProvider, type AIProviderId } from "./types"
import { createMockProvider } from "./providers/mock"
import { createGeminiProvider } from "./providers/gemini"
import { createAnthropicProvider } from "./providers/anthropic"
import { createOpenAIProvider } from "./providers/openai"
import { createOllamaProvider } from "./providers/ollama"
import { createVLLMProvider } from "./providers/vllm"

/**
 * Registre runtime des providers IA.
 *
 * - Sélection du primary via `process.env.AI_PROVIDER` (défaut: `gemini`).
 * - Fallback optionnel via `process.env.AI_PROVIDER_FALLBACK` — utilisé
 *   par `withFallback()` quand l'appel primaire échoue avec un code
 *   `retryable` (network/timeout, rate-limit).
 *
 * Instanciation paresseuse : un provider sans clé API ne s'enregistre pas.
 * Si l'utilisateur demande un provider non configuré, on retombe sur le
 * mock (équivalent dev sans clé) et on logge un warn.
 */

type Factory = () => AIProvider | null

const FACTORIES: Record<AIProviderId, Factory> = {
  gemini: createGeminiProvider,
  anthropic: createAnthropicProvider,
  openai: createOpenAIProvider,
  ollama: createOllamaProvider,
  vllm: createVLLMProvider,
  mock: createMockProvider,
}

const cache = new Map<AIProviderId, AIProvider>()

function resolve(id: AIProviderId): AIProvider | null {
  const cached = cache.get(id)
  if (cached) return cached
  const factory = FACTORIES[id]
  if (!factory) return null
  const instance = factory()
  if (instance) cache.set(id, instance)
  return instance
}

function readProviderId(envKey: string, fallback: AIProviderId): AIProviderId {
  const raw = (process.env[envKey] ?? "").toLowerCase()
  if (raw && raw in FACTORIES) return raw as AIProviderId
  return fallback
}

export function getActiveProvider(): AIProvider {
  const id = readProviderId("AI_PROVIDER", "gemini")
  const provider = resolve(id) ?? resolve("mock")
  if (!provider) {
    throw new AIProviderError(
      "Aucun provider IA disponible (mock indisponible — vérifier la configuration).",
      "MISSING_KEY",
      "mock",
    )
  }
  if (provider.id !== id) {
    console.warn(
      `[ai/registry] Provider "${id}" non configuré, fallback sur "${provider.id}".`,
    )
  }
  return provider
}

export function getFallbackProvider(): AIProvider | null {
  const raw = (process.env.AI_PROVIDER_FALLBACK ?? "").toLowerCase()
  if (!raw || !(raw in FACTORIES)) return null
  return resolve(raw as AIProviderId)
}

/**
 * Exécute `fn` avec le provider actif ; en cas d'erreur retryable
 * (`retryable: true`), retente une fois avec le provider de fallback s'il
 * existe. Pas de retry sinon — l'appelant gère.
 */
export async function withFallback<T>(
  fn: (provider: AIProvider) => Promise<T>,
): Promise<T> {
  const primary = getActiveProvider()
  try {
    return await fn(primary)
  } catch (err) {
    if (err instanceof AIProviderError && err.retryable) {
      const fallback = getFallbackProvider()
      if (fallback && fallback.id !== primary.id) {
        console.warn(
          `[ai/registry] Primary "${primary.id}" échoué (${err.code}), retry sur fallback "${fallback.id}".`,
        )
        return await fn(fallback)
      }
    }
    throw err
  }
}
