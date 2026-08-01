import { describe, expect, test } from "vitest"

import {
  decideKycOutcome,
  KYC_MATCH_THRESHOLD,
  KYC_OCR_THRESHOLD,
} from "./workflow"

/**
 * `decideKycOutcome` encode la règle métier centrale du workflow KYC L2 :
 * quel verdict biométrique/OCR déclenche une approbation auto, un rejet
 * auto (spoof), ou une revue humaine. Ces tests protègent contre deux
 * régressions de sécurité opposées :
 *   • un spoof qui finirait "review" au lieu de "reject" (le contrôleur
 *     pourrait à tort approuver une usurpation) ;
 *   • un score limite qui finirait "approve" au lieu de "review" (fail-open).
 */
describe("decideKycOutcome", () => {
  test("liveness spoof → reject, même avec des scores élevés", () => {
    const decision = decideKycOutcome(
      { confidence: 0.99 },
      { faceMatch: 0.99, liveness: "spoof" },
    )
    expect(decision).toBe("reject")
  })

  test("scores au-dessus des seuils + liveness real → approve", () => {
    const decision = decideKycOutcome(
      { confidence: KYC_OCR_THRESHOLD },
      { faceMatch: KYC_MATCH_THRESHOLD, liveness: "real" },
    )
    expect(decision).toBe("approve")
  })

  test("OCR sous le seuil → review (pas d'auto-approbation)", () => {
    const decision = decideKycOutcome(
      { confidence: KYC_OCR_THRESHOLD - 0.01 },
      { faceMatch: 0.99, liveness: "real" },
    )
    expect(decision).toBe("review")
  })

  test("face match sous le seuil → review", () => {
    const decision = decideKycOutcome(
      { confidence: 0.99 },
      { faceMatch: KYC_MATCH_THRESHOLD - 0.01, liveness: "real" },
    )
    expect(decision).toBe("review")
  })

  test("liveness uncertain (même scores hauts) → review, jamais approve", () => {
    const decision = decideKycOutcome(
      { confidence: 0.99 },
      { faceMatch: 0.99, liveness: "uncertain" },
    )
    expect(decision).toBe("review")
  })

  test("OCR indisponible → review, jamais approve malgré la biométrie", () => {
    const decision = decideKycOutcome(
      { confidence: 0.99 },
      { faceMatch: 0.99, liveness: "real" },
      { ocrAvailable: false, biometricAvailable: true },
    )
    expect(decision).toBe("review")
  })

  test("biométrie indisponible → review, jamais auto-reject sur uncertain", () => {
    const decision = decideKycOutcome(
      { confidence: 0.99 },
      { faceMatch: 0, liveness: "uncertain" },
      { ocrAvailable: true, biometricAvailable: false },
    )
    expect(decision).toBe("review")
  })

  test("spoof mesuré reste rejeté même si l'OCR est indisponible", () => {
    const decision = decideKycOutcome(
      { confidence: 0 },
      { faceMatch: 0.1, liveness: "spoof" },
      { ocrAvailable: false, biometricAvailable: true },
    )
    expect(decision).toBe("reject")
  })
})
