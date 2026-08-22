import { WorkflowManager } from "@convex-dev/workflow"
import { v } from "convex/values"

import { components, internal } from "../_generated/api"

/**
 * Workflow KYC L2 (cf. stack-technique §7.5).
 *
 * Étapes durables, idempotentes, replay déterministe :
 *   1. OCR + lecture document (via notre microservice d'inférence
 *      auto-hébergé — cf. kyc/actions.ts, contrat `KYC_INFERENCE_URL`)
 *   2. Liveness check + face match selfie ↔ document (même service)
 *   3. Décision automatique (score ≥ seuils) OU rejet auto (spoof) OU mise
 *      en file pour revue contrôleur
 *   4. Notification à l'utilisateur (approuvé / rejeté / en revue)
 *
 * Souveraineté : le pipeline biométrique est auto-hébergé (plus de SaaS
 * tiers type Smile ID) — cf. ADR sur la biométrie KYC.
 */

export const workflow = new WorkflowManager(components.workflow)

// Seuils de décision auto — configurables via env (`bunx convex env set`)
// pour ajuster sans redéploiement de code. Défauts documentés ici et dans
// .env.example : KYC_OCR_THRESHOLD / KYC_MATCH_THRESHOLD.
export const KYC_OCR_THRESHOLD = Number(process.env.KYC_OCR_THRESHOLD ?? 0.9)
export const KYC_MATCH_THRESHOLD = Number(
  process.env.KYC_MATCH_THRESHOLD ?? 0.6,
)

const REJECT_REASON_SPOOF = "Détection anti-usurpation"

export type KycOcrResult = { confidence: number }
export type KycBiometricResult = {
  faceMatch: number
  liveness: "real" | "spoof" | "uncertain"
}

/**
 * Signaux de doublon issus du pipeline.
 *
 * `available: false` signifie « la recherche n'a pas pu être faite » — service
 * antérieur au déploiement, moteur dégradé, ou replay d'un workflow journalisé
 * avant l'ajout de ces champs. À traiter comme les autres indisponibilités :
 * revue manuelle, jamais auto-approbation.
 */
export type KycDedupResult = {
  duplicateFound: boolean
  available: boolean
}
export type KycDecision = "approve" | "reject" | "review"
export type KycInferenceAvailability = {
  ocrAvailable: boolean
  biometricAvailable: boolean
}

/**
 * Décision pure (aucun I/O) à partir des résultats OCR + biométrie —
 * extraite pour être testable unitairement indépendamment de
 * l'orchestration du workflow (cf. workflow.test.ts).
 *
 *   • `liveness === "spoof"` → rejet automatique (anti-usurpation), quels
 *     que soient les scores OCR/face-match — un spoof avéré ne doit jamais
 *     finir en revue humaine "peut-être".
 *   • un moteur indisponible (OCR, biométrie ou déduplication) → revue.
 *   • un doublon détecté (visage ou pièce déjà rattachés à un autre compte)
 *     → revue manuelle, JAMAIS rejet automatique : les vrais jumeaux ont des
 *     empreintes ArcFace très proches, et le coût d'un faux positif est le
 *     refus d'identité opposé à une personne réelle.
 *   • confiance OCR ET face-match au-dessus des seuils ET `liveness ===
 *     "real"` → approbation auto.
 *   • sinon (scores bas, `liveness === "uncertain"`...) → revue manuelle
 *     (fail-safe : un signal ambigu ne déclenche jamais une auto-approbation).
 *
 * L'ordre des règles est délibéré : le rejet pour spoof précède le doublon,
 * parce qu'une présentation frauduleuse reste un rejet même quand elle
 * ressemble par ailleurs à un compte existant.
 */
export function decideKycOutcome(
  ocr: KycOcrResult,
  biometric: KycBiometricResult,
  availability: KycInferenceAvailability = {
    ocrAvailable: true,
    biometricAvailable: true,
  },
  // Valeur par défaut neutre : les appelants qui ignorent la déduplication
  // conservent le comportement antérieur.
  dedup: KycDedupResult = { duplicateFound: false, available: true },
): KycDecision {
  if (availability.biometricAvailable && biometric.liveness === "spoof") {
    return "reject"
  }
  if (!availability.ocrAvailable || !availability.biometricAvailable) {
    return "review"
  }
  if (!dedup.available || dedup.duplicateFound) {
    return "review"
  }
  if (
    ocr.confidence >= KYC_OCR_THRESHOLD &&
    biometric.faceMatch >= KYC_MATCH_THRESHOLD &&
    biometric.liveness === "real"
  ) {
    return "approve"
  }
  return "review"
}

export const kycLevel2 = workflow.define({
  args: {
    userId: v.string(),
    kycRequestId: v.id("kycRequest"),
  },
  handler: async (step, args): Promise<{ decision: KycDecision }> => {
    // 1. OCR — retry avec backoff exponentiel
    let ocr: KycOcrResult & { documentReuse?: boolean }
    let ocrAvailable = true
    try {
      ocr = await step.runAction(
        internal.kyc.actions.runOcr,
        { kycRequestId: args.kycRequestId },
        { retry: { maxAttempts: 3, initialBackoffMs: 1000, base: 2 } },
      )
    } catch (error) {
      // Après épuisement des retries, on ne laisse jamais le dossier bloqué
      // en `submitted`. L'absence de signal vaut score nul et impose la revue.
      console.error("[kyc/workflow] OCR indisponible, revue manuelle requise", error)
      ocr = { confidence: 0, documentReuse: undefined }
      ocrAvailable = false
    }

    // 2. Liveness + face match
    let biometric: KycBiometricResult & {
      faceDuplicate?: boolean
      dedupAvailable?: boolean
    }
    let biometricAvailable = true
    try {
      biometric = await step.runAction(
        internal.kyc.actions.runBiometric,
        { kycRequestId: args.kycRequestId },
        { retry: { maxAttempts: 3, initialBackoffMs: 1000, base: 2 } },
      )
    } catch (error) {
      console.error(
        "[kyc/workflow] biométrie indisponible, revue manuelle requise",
        error,
      )
      biometric = {
        faceMatch: 0,
        liveness: "uncertain",
        faceDuplicate: undefined,
        dedupAvailable: false,
      }
      biometricAvailable = false
    }

    // 3. Décision : rejet auto (spoof) / approbation auto / revue manuelle
    const availability = { ocrAvailable, biometricAvailable }

    // Signaux de doublon rendus par les deux steps ci-dessus. `undefined` sur
    // un workflow journalisé avant le déploiement de la déduplication : on le
    // lit alors comme « pas de recherche faite », donc revue manuelle. Le
    // fail-safe est ici essentiel — l'interpréter comme « aucun doublon »
    // auto-approuverait précisément les dossiers qu'on cherche à retenir.
    const dedupAvailable =
      biometric.dedupAvailable !== false && ocr.documentReuse !== undefined
    const duplicateFound =
      biometric.faceDuplicate === true || ocr.documentReuse === true
    const dedup = { duplicateFound, available: dedupAvailable }

    const decision = decideKycOutcome(ocr, biometric, availability, dedup)

    if (decision === "reject") {
      await step.runMutation(internal.kyc.mutations.rejectAuto, {
        kycRequestId: args.kycRequestId,
        rejectionReason: REJECT_REASON_SPOOF,
      })
    } else if (decision === "approve") {
      await step.runMutation(internal.kyc.mutations.approveAuto, {
        kycRequestId: args.kycRequestId,
        score: ocr.confidence,
        faceMatchScore: biometric.faceMatch,
      })
    } else {
      await step.runMutation(internal.kyc.mutations.enqueueForReview, {
        kycRequestId: args.kycRequestId,
        score: ocr.confidence,
        faceMatchScore: biometric.faceMatch,
        livenessVerdict: biometric.liveness,
        ...availability,
        // Le contrôleur doit savoir qu'il regarde un dossier retenu POUR
        // doublon : sans cette information, il approuverait à la main
        // exactement ce que la détection venait d'arrêter.
        duplicateFlagged: duplicateFound,
      })
    }

    // 4. Notification (envoyée par les mutations elles-mêmes)
    return { decision }
  },
})
