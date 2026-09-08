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

/**
 * CE QUI EST EN JEU : un individu ne doit pas pouvoir détenir plusieurs
 * identités vérifiées. Une auto-approbation sur un dossier signalé comme
 * doublon annulerait toute la chaîne de détection en amont — et le ferait
 * silencieusement, puisque personne ne relit un dossier approuvé.
 *
 * Dans l'autre sens, un doublon ne doit JAMAIS déclencher un rejet
 * automatique : la mesure biométrique rapproche les vrais jumeaux, et un faux
 * positif se paierait ici du refus d'identité opposé à une personne réelle.
 * La seule issue correcte est donc la revue humaine.
 */
describe("décision KYC — signal de doublon", () => {
  const goodOcr = { confidence: 0.99 }
  const goodBio = { faceMatch: 0.99, liveness: "real" as const }
  const allAvailable = { ocrAvailable: true, biometricAvailable: true }

  test("doublon détecté → review, jamais approve, malgré des scores parfaits", () => {
    const decision = decideKycOutcome(goodOcr, goodBio, allAvailable, {
      duplicateFound: true,
      available: true,
    })
    expect(decision).toBe("review")
  })

  test("doublon détecté → jamais reject : les vrais jumeaux existent", () => {
    const decision = decideKycOutcome(goodOcr, goodBio, allAvailable, {
      duplicateFound: true,
      available: true,
    })
    expect(decision).not.toBe("reject")
  })

  test("un spoof avéré prime sur le doublon", () => {
    // POURQUOI : une présentation frauduleuse reste un rejet, même quand elle
    // ressemble par ailleurs à un compte existant.
    const decision = decideKycOutcome(
      goodOcr,
      { faceMatch: 0.1, liveness: "spoof" },
      allAvailable,
      { duplicateFound: true, available: true },
    )
    expect(decision).toBe("reject")
  })

  test("recherche de doublon indisponible → review, jamais approve", () => {
    // POURQUOI : c'est le fail-safe qui protège le déploiement. Un workflow
    // journalisé avant l'arrivée de la déduplication rejoue sans ces champs ;
    // les lire comme « aucun doublon » auto-approuverait précisément les
    // dossiers qu'on cherche à retenir.
    const decision = decideKycOutcome(goodOcr, goodBio, allAvailable, {
      duplicateFound: false,
      available: false,
    })
    expect(decision).toBe("review")
  })

  test("aucun doublon et scores au-dessus des seuils → approve", () => {
    // POURQUOI : garantit que le chemin nominal n'a pas été cassé au passage.
    const decision = decideKycOutcome(goodOcr, goodBio, allAvailable, {
      duplicateFound: false,
      available: true,
    })
    expect(decision).toBe("approve")
  })

  test("sans argument de déduplication, le comportement antérieur est conservé", () => {
    // POURQUOI : la valeur par défaut ne doit pas transformer les appelants
    // existants en machine à revue manuelle.
    expect(decideKycOutcome(goodOcr, goodBio, allAvailable)).toBe("approve")
  })
})
