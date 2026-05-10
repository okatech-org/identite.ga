"use node"

import { v } from "convex/values"

import { internalAction } from "../_generated/server"

/**
 * Actions KYC — Phase 1 : stubs déterministes pour valider le pipeline.
 *
 * Phase 2 : remplacer par appels Smile ID :
 *   • submit_job (photos document + selfie)
 *   • liveness_check (anti-spoofing ISO/IEC 30107-3 niveau 2)
 *   • document_verification (OCR + détection faux)
 *   • biometric_kyc (face match doc ↔ selfie)
 * Webhook → mutation interne pour update kycRequest.status.
 */

export const runOcr = internalAction({
  args: {
    kycRequestId: v.id("kycRequest"),
  },
  returns: v.object({
    confidence: v.number(),
    extractedFields: v.optional(v.record(v.string(), v.string())),
  }),
  handler: async () => {
    // TODO(idn-phase2): Smile ID document_verification
    // Phase 1 : retour déterministe pour faire passer le workflow.
    return {
      confidence: 0.7, // sous le seuil 0.95 → bascule vers revue manuelle
      extractedFields: {},
    }
  },
})

export const runBiometric = internalAction({
  args: {
    kycRequestId: v.id("kycRequest"),
  },
  returns: v.object({
    faceMatch: v.number(),
    liveness: v.union(
      v.literal("real"),
      v.literal("spoof"),
      v.literal("uncertain"),
    ),
  }),
  handler: async (): Promise<{
    faceMatch: number
    liveness: "real" | "spoof" | "uncertain"
  }> => {
    // TODO(idn-phase2): Smile ID biometric_kyc + liveness_check
    return {
      faceMatch: 0.55,
      liveness: "uncertain",
    }
  },
})
