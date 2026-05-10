import { WorkflowManager } from "@convex-dev/workflow"
import { v } from "convex/values"

import { components, internal } from "../_generated/api"

/**
 * Workflow KYC L2 (cf. stack-technique §7.5).
 *
 * Étapes durables, idempotentes, replay déterministe :
 *   1. OCR + lecture MRZ du document
 *   2. Liveness check + face match selfie ↔ document
 *   3. Décision automatique (score ≥ seuil) OU mise en file pour revue contrôleur
 *   4. Notification email à l'utilisateur (approuvé / rejeté / en revue)
 *
 * Phase 1 : actions OCR / biométrie sont des stubs déterministes
 * (score = 0.7). Phase 2 : intégration Smile ID via webhook.
 */

export const workflow = new WorkflowManager(components.workflow)

export const kycLevel2 = workflow.define({
  args: {
    userId: v.string(),
    kycRequestId: v.id("kycRequest"),
  },
  handler: async (step, args): Promise<{ autoApproved: boolean }> => {
    // 1. OCR + MRZ — retry avec backoff exponentiel
    const ocr = await step.runAction(
      internal.kyc.actions.runOcr,
      { kycRequestId: args.kycRequestId },
      { retry: { maxAttempts: 3, initialBackoffMs: 1000, base: 2 } },
    )

    // 2. Liveness + face match
    const biometric = await step.runAction(
      internal.kyc.actions.runBiometric,
      { kycRequestId: args.kycRequestId },
      { retry: { maxAttempts: 3, initialBackoffMs: 1000, base: 2 } },
    )

    // 3. Décision : auto si confiance haute, sinon revue manuelle
    const autoApproved =
      ocr.confidence >= 0.95 &&
      biometric.faceMatch >= 0.6 &&
      biometric.liveness === "real"

    if (autoApproved) {
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
      })
      // Phase 2 : on attendra l'événement `kyc-decision-{userId}` pendant
      // 7 jours max. Phase 1 : le workflow se termine, le contrôleur reprend
      // via la console.
    }

    // 4. Notification email (envoyée par les mutations elles-mêmes via Resend)
    return { autoApproved }
  },
})
