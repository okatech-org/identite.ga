/**
 * Politique du parcours de vérification unifié (Niveau 2 / Niveau 3).
 *
 * Historiquement, le Niveau 3 exigeait le Niveau 2 comme prérequis strict :
 * `level3.start` rejetait toute demande d'un profil en LoA 1
 * (`LEVEL2_REQUIRED`). Le citoyen devait donc enchaîner deux démarches
 * distinctes pour atteindre le Niveau 3.
 *
 * Le parcours est désormais FUSIONNÉ : on peut demander directement le
 * Niveau 3 depuis le LoA 1. Ce que le gate protégeait — la PREUVE
 * DOCUMENTAIRE (pièce + selfie + OCR + liveness) — n'est pas abandonné, il
 * est ABSORBÉ dans le parcours Niveau 3 :
 *
 *   1. la demande N3 depuis le LoA 1 ouvre en même temps un `kycRequest`
 *      (« piste documentaire ») rattaché à la vérification ;
 *   2. le citoyen ne peut réserver son créneau qu'une fois cette piste
 *      soumise (cf. `isDocumentTrackReadyForBooking`) ;
 *   3. l'approbation de l'entretien accorde le Niveau 2 et le Niveau 3 du
 *      même geste (cf. `level3.approve`).
 *
 * L'invariant à tenir : un `acr` eidas3 n'est jamais accordé sans preuve
 * documentaire. Le mapping LoA→ACR (`http.ts:loaToAcr`) l'annonce à toutes
 * les applications relying party ; le relâcher ici les tromperait toutes.
 *
 * Ce module est PUR (aucun accès `ctx`) pour rester testable seul — même
 * convention que `level3/schedulingPolicy.ts`.
 */

/** Niveaux de garantie demandables par le citoyen. */
export type TargetLoa = 2 | 3;

/**
 * Statuts d'une vérification N3 encore en cours de traitement. Une demande
 * dans l'un de ces états est REPRISE plutôt que dupliquée.
 */
export const LEVEL3_ACTIVE_STATUSES = [
  "waiting_controller",
  "claimed",
  "in_interview",
] as const;

export function isLevel3Active(status: string): boolean {
  return (LEVEL3_ACTIVE_STATUSES as readonly string[]).includes(status);
}

/** Statuts d'un `kycRequest` pertinents pour la décision de parcours. */
export type DocumentTrackStatus =
  | "pending"
  | "submitted"
  | "under_review"
  | "complement_required"
  | "approved"
  | "rejected"
  | "expired";

export type VerificationRequestInput = {
  /** Niveau visé par le citoyen. */
  targetLoa: TargetLoa;
  /** LoA courant du profil (1, 2 ou 3). */
  currentLoa: number;
  /** Demande KYC encore exploitable, s'il en existe une. */
  activeKyc: { status: DocumentTrackStatus } | null;
  /** Vérification Niveau 3 encore active, s'il en existe une. */
  hasActiveLevel3: boolean;
};

export type VerificationRequestPlan =
  /** Le profil détient déjà ce niveau — rien à ouvrir. */
  | { kind: "already_verified" }
  /** Reprendre la demande KYC en cours plutôt qu'en ouvrir une seconde. */
  | { kind: "resume_kyc" }
  /** Ouvrir une demande KYC (Niveau 2 seul). */
  | { kind: "open_kyc" }
  /** Reprendre la vérification N3 active ; `openDocumentTrack` si sa piste
   *  documentaire manque encore (reprise d'une demande LoA 1). */
  | { kind: "resume_level3"; openDocumentTrack: boolean }
  /** Ouvrir une vérification N3 ; `openDocumentTrack` en parcours fusionné. */
  | { kind: "open_level3"; openDocumentTrack: boolean };

/**
 * Une demande KYC dans cet état peut être reprise par le citoyen : inutile
 * d'en ouvrir une seconde, qui laisserait deux pistes concurrentes sur le
 * même dossier. `rejected` et `expired` en sont exclus — ils imposent une
 * nouvelle demande.
 */
export function isKycResumable(status: DocumentTrackStatus): boolean {
  return (
    status === "pending" ||
    status === "submitted" ||
    status === "under_review" ||
    status === "complement_required"
  );
}

/**
 * La preuve documentaire est-elle suffisamment avancée pour que le citoyen
 * puisse réserver son entretien ?
 *
 * - LoA ≥ 2 : la preuve est déjà acquise et approuvée, rien à attendre.
 * - LoA 1 (parcours fusionné) : les pièces doivent avoir été SOUMISES.
 *   `pending` (rien d'envoyé) et `complement_required` (le contrôleur
 *   attend un renvoi) ne suffisent pas : sans cela, un citoyen réserverait
 *   un créneau que l'agent ne pourrait pas instruire, faute de pièces à
 *   l'écran.
 */
export function isDocumentTrackReadyForBooking(
  currentLoa: number,
  kycStatus: DocumentTrackStatus | null,
): boolean {
  if (currentLoa >= 2) return true;
  if (kycStatus === null) return false;
  return (
    kycStatus === "submitted" ||
    kycStatus === "under_review" ||
    kycStatus === "approved"
  );
}

/**
 * Décide ce qu'ouvre (ou reprend) une demande de vérification.
 *
 * Ne lève jamais : l'appelant traduit `already_verified` en `ConvexError`.
 */
export function planVerificationRequest(
  input: VerificationRequestInput,
): VerificationRequestPlan {
  if (input.currentLoa >= input.targetLoa) {
    return { kind: "already_verified" };
  }

  if (input.targetLoa === 2) {
    if (input.activeKyc && isKycResumable(input.activeKyc.status)) {
      return { kind: "resume_kyc" };
    }
    return { kind: "open_kyc" };
  }

  // Cible Niveau 3. La piste documentaire n'est ouverte que si le profil
  // n'a pas déjà le Niveau 2 ET qu'aucune demande KYC reprenable n'existe
  // (sinon on rattacherait la demande existante plutôt que d'en créer une).
  const needsDocumentTrack = input.currentLoa < 2;
  const openDocumentTrack =
    needsDocumentTrack &&
    !(input.activeKyc !== null && isKycResumable(input.activeKyc.status));

  if (input.hasActiveLevel3) {
    return { kind: "resume_level3", openDocumentTrack };
  }
  return { kind: "open_level3", openDocumentTrack };
}

/**
 * Le type de document est-il exigé pour exécuter ce plan ?
 * Il ne l'est que si une nouvelle demande KYC va être créée.
 */
export function planRequiresDocumentType(
  plan: VerificationRequestPlan,
): boolean {
  return (
    plan.kind === "open_kyc" ||
    ((plan.kind === "open_level3" || plan.kind === "resume_level3") &&
      plan.openDocumentTrack)
  );
}
