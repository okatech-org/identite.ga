import { describe, expect, test } from "vitest";

import {
  isDocumentTrackReadyForBooking,
  isKycResumable,
  planRequiresDocumentType,
  planVerificationRequest,
  type DocumentTrackStatus,
} from "./requestPolicy";

describe("parcours de vérification unifié", () => {
  test("le Niveau 3 est demandable depuis le LoA 1, avec piste documentaire", () => {
    // C'est LE comportement que le gate LEVEL2_REQUIRED interdisait : un
    // profil LoA 1 obtient sa vérification N3 directement, et la preuve
    // documentaire est ouverte du même geste plutôt qu'exigée d'avance.
    expect(
      planVerificationRequest({
        targetLoa: 3,
        currentLoa: 1,
        activeKyc: null,
        hasActiveLevel3: false,
      }),
    ).toEqual({ kind: "open_level3", openDocumentTrack: true });
  });

  test("le Niveau 3 demandé depuis le LoA 2 n'ouvre pas de seconde piste documentaire", () => {
    // La preuve documentaire est déjà acquise et approuvée : la redemander
    // ferait refaire au citoyen une démarche qu'il a déjà passée.
    expect(
      planVerificationRequest({
        targetLoa: 3,
        currentLoa: 2,
        activeKyc: null,
        hasActiveLevel3: false,
      }),
    ).toEqual({ kind: "open_level3", openDocumentTrack: false });
  });

  test("une demande KYC reprenable est rattachée au lieu d'être dupliquée", () => {
    // Deux kycRequest concurrents sur le même dossier donneraient deux
    // verdicts possibles pour une seule identité — l'agent ne saurait pas
    // lequel fait foi.
    expect(
      planVerificationRequest({
        targetLoa: 3,
        currentLoa: 1,
        activeKyc: { status: "submitted" },
        hasActiveLevel3: false,
      }),
    ).toEqual({ kind: "open_level3", openDocumentTrack: false });
  });

  test("une demande KYC rejetée n'est pas reprise : une nouvelle piste s'ouvre", () => {
    expect(
      planVerificationRequest({
        targetLoa: 3,
        currentLoa: 1,
        activeKyc: { status: "rejected" },
        hasActiveLevel3: false,
      }),
    ).toEqual({ kind: "open_level3", openDocumentTrack: true });
  });

  test("une demande N3 active est reprise, jamais dupliquée", () => {
    expect(
      planVerificationRequest({
        targetLoa: 3,
        currentLoa: 2,
        activeKyc: null,
        hasActiveLevel3: true,
      }),
    ).toEqual({ kind: "resume_level3", openDocumentTrack: false });
  });

  test("reprendre une demande N3 ouverte en LoA 1 rattrape sa piste documentaire manquante", () => {
    // Cas des demandes créées avant la fusion des parcours, ou d'une piste
    // documentaire rejetée entre-temps : la reprise doit réparer le dossier,
    // pas laisser une vérification N3 sans preuve documentaire.
    expect(
      planVerificationRequest({
        targetLoa: 3,
        currentLoa: 1,
        activeKyc: null,
        hasActiveLevel3: true,
      }),
    ).toEqual({ kind: "resume_level3", openDocumentTrack: true });
  });

  test("demander un niveau déjà détenu ne rouvre rien", () => {
    expect(
      planVerificationRequest({
        targetLoa: 2,
        currentLoa: 2,
        activeKyc: null,
        hasActiveLevel3: false,
      }),
    ).toEqual({ kind: "already_verified" });
    expect(
      planVerificationRequest({
        targetLoa: 3,
        currentLoa: 3,
        activeKyc: null,
        hasActiveLevel3: false,
      }),
    ).toEqual({ kind: "already_verified" });
  });

  test("le Niveau 2 reste demandable seul", () => {
    expect(
      planVerificationRequest({
        targetLoa: 2,
        currentLoa: 1,
        activeKyc: null,
        hasActiveLevel3: false,
      }),
    ).toEqual({ kind: "open_kyc" });
    expect(
      planVerificationRequest({
        targetLoa: 2,
        currentLoa: 1,
        activeKyc: { status: "complement_required" },
        hasActiveLevel3: false,
      }),
    ).toEqual({ kind: "resume_kyc" });
  });
});

describe("ouverture de la réservation de créneau", () => {
  test("le LoA 2 réserve sans piste documentaire ouverte", () => {
    expect(isDocumentTrackReadyForBooking(2, null)).toBe(true);
  });

  test("le LoA 1 doit avoir soumis ses pièces avant de réserver", () => {
    // Réserver avant soumission produirait un entretien que l'agent ne peut
    // pas instruire : il n'aurait aucune pièce à l'écran.
    expect(isDocumentTrackReadyForBooking(1, "pending")).toBe(false);
    expect(isDocumentTrackReadyForBooking(1, "submitted")).toBe(true);
    expect(isDocumentTrackReadyForBooking(1, "under_review")).toBe(true);
    expect(isDocumentTrackReadyForBooking(1, "approved")).toBe(true);
  });

  test("un complément demandé referme la réservation", () => {
    // Le contrôleur attend un renvoi de pièces : tant qu'il n'est pas
    // arrivé, le dossier n'est pas instruisible.
    expect(isDocumentTrackReadyForBooking(1, "complement_required")).toBe(false);
  });

  test("des pièces rejetées ou expirées ne permettent pas de réserver", () => {
    expect(isDocumentTrackReadyForBooking(1, "rejected")).toBe(false);
    expect(isDocumentTrackReadyForBooking(1, "expired")).toBe(false);
  });

  test("sans aucune piste documentaire, un LoA 1 ne réserve pas", () => {
    expect(isDocumentTrackReadyForBooking(1, null)).toBe(false);
  });
});

describe("reprise d'une demande KYC", () => {
  const resumable: DocumentTrackStatus[] = [
    "pending",
    "submitted",
    "under_review",
    "complement_required",
  ];
  const terminal: DocumentTrackStatus[] = ["approved", "rejected", "expired"];

  test.each(resumable)("« %s » est reprenable", (status) => {
    expect(isKycResumable(status)).toBe(true);
  });

  test.each(terminal)("« %s » impose une nouvelle demande", (status) => {
    expect(isKycResumable(status)).toBe(false);
  });
});

describe("exigence du type de document", () => {
  test("n'est exigé que quand une demande KYC va être créée", () => {
    expect(planRequiresDocumentType({ kind: "open_kyc" })).toBe(true);
    expect(
      planRequiresDocumentType({ kind: "open_level3", openDocumentTrack: true }),
    ).toBe(true);
    expect(
      planRequiresDocumentType({
        kind: "resume_level3",
        openDocumentTrack: true,
      }),
    ).toBe(true);
  });

  test("n'est pas exigé pour une reprise ou un N3 déjà couvert", () => {
    expect(planRequiresDocumentType({ kind: "resume_kyc" })).toBe(false);
    expect(
      planRequiresDocumentType({
        kind: "open_level3",
        openDocumentTrack: false,
      }),
    ).toBe(false);
    expect(planRequiresDocumentType({ kind: "already_verified" })).toBe(false);
  });
});
