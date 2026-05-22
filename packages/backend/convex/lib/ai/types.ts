/**
 * Interface commune des providers IA pour le projet IDN.
 *
 * Objectif : permettre de switcher entre Gemini, Anthropic, OpenAI ou un
 * modèle open-source self-hosted (Ollama/vLLM) sans toucher au code métier
 * des features (`cv/ai.ts`, `cv/import.ts`, etc.).
 *
 * Convention : chaque provider expose un `id` stable (utilisé dans les logs
 * et stocké sur `citizenCvAiJob.provider`) et une méthode `complete()` qui
 * accepte un `AICompletionRequest` et retourne un `AICompletionResult`.
 */

export type AIProviderId =
  | "gemini"
  | "anthropic"
  | "openai"
  | "ollama" // self-hosted Phase 2+
  | "vllm" // self-hosted Phase 2+
  | "mock"; // tests + dev sans clé API

export interface AICompletionRequest {
  /**
   * Identifiant logique de la tâche. Sert au logging et permet à un
   * provider futur de router vers un modèle adapté (ex: tâches courtes →
   * modèle rapide, tâches longues → modèle robuste).
   */
  task: string;
  /** Prompt système (instruction métier). */
  system: string;
  /** Prompt utilisateur (input réel, généralement le CV sérialisé). */
  prompt: string;
  /**
   * JSON Schema strict décrivant la forme de la réponse attendue.
   * Si fourni, le provider DOIT renvoyer un objet conforme (parsé) dans
   * `result.json`. Sinon, la réponse est rendue en `result.text`.
   */
  jsonSchema?: Record<string, unknown>;
  /** Plafond de tokens en sortie. Défaut provider-dépendant (~4 096). */
  maxTokens?: number;
  /** 0..1 — défaut 0.4 pour les features iCV (équilibre créativité/cohérence). */
  temperature?: number;
  /**
   * Pièces jointes multimodales (PDF, images). Encodées en base64.
   * Utilisé par l'import iCV qui envoie le fichier brut à un modèle
   * capable de l'analyser nativement (Gemini, Claude…).
   * Provider sans support multimodal → AIProviderError("NOT_IMPLEMENTED").
   */
  attachments?: Array<{ mimeType: string; data: string }>;
}

export interface AICompletionResult {
  /** Texte brut. Renseigné si pas de `jsonSchema` ou si le parse a échoué (fallback). */
  text?: string;
  /** Objet parsé. Renseigné si `jsonSchema` fourni et parse OK. */
  json?: Record<string, unknown>;
  provider: AIProviderId;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

export interface AIProvider {
  readonly id: AIProviderId;
  /** Modèle par défaut affiché à l'utilisateur dans l'historique des jobs. */
  readonly defaultModel: string;
  complete(req: AICompletionRequest): Promise<AICompletionResult>;
}

/**
 * Erreur normalisée — chaque implémentation jette `AIProviderError` plutôt
 * que des erreurs propres au SDK. Permet à l'appelant de distinguer les
 * cas (retry, fallback, surface message à l'utilisateur).
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "AUTH"
      | "RATE_LIMIT"
      | "INVALID_RESPONSE"
      | "NETWORK"
      | "TIMEOUT"
      | "NOT_IMPLEMENTED"
      | "MISSING_KEY"
      | "UNKNOWN",
    public readonly provider: AIProviderId,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
