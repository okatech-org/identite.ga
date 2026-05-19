import {
  AIProviderError,
  type AICompletionRequest,
  type AICompletionResult,
  type AIProvider,
} from "../types"

/**
 * Provider IA Mock — utilisé dans les tests et en dev sans clé API.
 *
 * Stratégie : renvoie une réponse déterministe basée sur `request.task`.
 * Si un `jsonSchema` est fourni, on renvoie un objet vide (`{}`) en `json`
 * — les tests doivent s'attendre à ça ou poser un mock plus précis via
 * monkey-patching.
 */

export function createMockProvider(): AIProvider {
  return new MockProvider()
}

class MockProvider implements AIProvider {
  readonly id = "mock" as const
  readonly defaultModel = "mock-1"

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    // Petite latence simulée pour rapprocher du comportement réel.
    await new Promise((r) => setTimeout(r, 25))

    const responses = MOCK_RESPONSES[req.task]
    if (req.jsonSchema) {
      const json = responses?.json ?? {}
      return {
        json,
        provider: this.id,
        model: this.defaultModel,
        tokensIn: estimateTokens(req.system + req.prompt),
        tokensOut: estimateTokens(JSON.stringify(json)),
        latencyMs: 25,
      }
    }
    const text = responses?.text ?? `[mock] task=${req.task}`
    return {
      text,
      provider: this.id,
      model: this.defaultModel,
      tokensIn: estimateTokens(req.system + req.prompt),
      tokensOut: estimateTokens(text),
      latencyMs: 25,
    }
  }
}

function estimateTokens(text: string): number {
  // ~4 caractères par token (heuristique commune Anglais/Français).
  return Math.max(1, Math.round(text.length / 4))
}

/**
 * Réponses mockées par task — alignées sur la forme attendue côté `cv/ai.ts`.
 * Les tests peuvent surcharger en remplaçant `MOCK_RESPONSES[task]`.
 */
const MOCK_RESPONSES: Record<
  string,
  { text?: string; json?: Record<string, unknown> }
> = {
  "cv.improve_summary": {
    json: {
      rewrittenSummary:
        "Professionnel expérimenté, orienté impact, capable de combiner expertise technique et leadership pour livrer des produits à fort impact.",
    },
  },
  "cv.suggest_skills": {
    json: {
      suggestions: [
        { name: "TypeScript", level: "Avancé", rationale: "mentionné dans 2 expériences" },
        { name: "Leadership", level: "Intermédiaire", rationale: "implicite dans le poste de chef de projet" },
        { name: "Communication", level: "Avancé", rationale: "essentiel pour les rôles transverses" },
      ],
    },
  },
  "cv.optimize_job": {
    json: {
      tailoredSummary:
        "Profil parfaitement aligné avec les exigences du poste — combinant expertise produit, capacité d'exécution et leadership transverse.",
      prioritizedExperienceIds: [],
      suggestedSkills: ["Product Management", "Stakeholder Management"],
      addedKeywords: ["agile", "roadmap", "stakeholders"],
    },
  },
  "cv.generate_letter": {
    json: {
      letter:
        "Madame, Monsieur,\n\nC'est avec un vif intérêt que je vous adresse ma candidature pour le poste de [INTITULÉ DU POSTE].\n\n[Corps de la lettre généré par le mock — à remplacer par le vrai provider en prod.]\n\nCordialement.",
      suggestedSubject: "Candidature au poste de [INTITULÉ DU POSTE]",
    },
  },
  "cv.ats_check": {
    json: {
      score: 72,
      breakdown: {
        keywords: 18,
        structure: 22,
        length: 16,
        readability: 16,
      },
      recommendations: [
        "Ajoutez plus de mots-clés sectoriels (cible: 8-12).",
        "Évitez les blocs de texte de plus de 4 lignes.",
        "Mentionnez explicitement les outils utilisés dans chaque expérience.",
      ],
    },
  },
  "cv.import_extract": {
    json: {
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean.dupont@example.com",
      phone: "+241 06 12 34 56",
      summary: "Profil extrait depuis le PDF mock.",
      experiences: [],
      education: [],
      skills: [],
      languages: [],
    },
  },
}

/**
 * Helper test — permet de surcharger une réponse mock pour un test donné.
 * À utiliser avec parcimonie (idéalement via beforeEach + afterEach).
 */
export function setMockResponse(
  task: string,
  response: { text?: string; json?: Record<string, unknown> },
) {
  MOCK_RESPONSES[task] = response
}

export function throwOnNextMockCall(
  errorCode: AIProviderError["code"] = "NETWORK",
) {
  const original = MockProvider.prototype.complete
  MockProvider.prototype.complete = async function (_req) {
    MockProvider.prototype.complete = original
    throw new AIProviderError("Mock failure", errorCode, "mock", true)
  }
}
