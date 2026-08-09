import { ConvexError } from "convex/values";

import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/**
 * Décision d'un entretien Niveau 3 — implémentation UNIQUE.
 *
 * Deux canaux y accèdent : la console contrôleur native d'identite.ga
 * (`level3.approve` / `level3.reject`) et les agents d'administration.ga via
 * l'API M2M (`partner/verifications.decide`). Ils doivent appliquer la MÊME
 * doctrine — notamment l'invariant « pas d'eidas3 sans preuve documentaire
 * instruite ». Deux copies auraient divergé au premier ajustement, et le canal
 * partenaire est précisément celui qu'on surveille le moins.
 */

export type Level3DecisionVia = "controller_app" | "partner";

export type Level3DecisionInput = {
  verificationId: Id<"level3Verification">;
  decision: "approved" | "rejected";
  /** `sub` IDN de l'agent ou du contrôleur qui décide. */
  reviewerId: string;
  /** Notes libres (approbation) — non exposées au citoyen. */
  notes?: string;
  /** Motif communiqué au citoyen (rejet). */
  reason?: string;
  via: Level3DecisionVia;
};

/**
 * Vérifie qu'une décision est recevable : demande existante, assignée à
 * l'auteur, et entretien effectivement démarré. Décider sans avoir démarré
 * l'entretien reviendrait à statuer sans avoir vu la personne.
 */
function assertDecidable(
  verification: Doc<"level3Verification"> | null,
  reviewerId: string,
): asserts verification is Doc<"level3Verification"> {
  if (!verification) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Demande introuvable.",
    });
  }
  if (verification.controllerId !== reviewerId) {
    throw new ConvexError({
      code: "NOT_CLAIMED",
      message: "Entretien non assigné.",
    });
  }
  if (verification.status !== "in_interview") {
    throw new ConvexError({
      code: "INTERVIEW_REQUIRED",
      message: "Démarrez l'entretien vidéo avant de prendre une décision.",
    });
  }
}

/**
 * Clôt la piste documentaire d'un parcours fusionné.
 *
 * Le contrôleur a vu la personne ET ses pièces pendant l'entretien : c'est la
 * preuve que le gate `LEVEL2_REQUIRED` exigeait d'avance. On la CONSTATE ici
 * plutôt que de la présumer — sans quoi un `acr` eidas3 serait délivré sans
 * qu'aucune pièce n'ait été instruite, ce que le mapping LoA→ACR promet à
 * toutes les applications relying party.
 *
 * @returns l'id de la piste clôturée, ou `undefined` si le citoyen détenait
 *   déjà le Niveau 2 (sa preuve documentaire est alors le `kycRequest` approuvé
 *   qui lui a valu ce niveau).
 */
async function settleDocumentTrack(
  ctx: MutationCtx,
  verification: Doc<"level3Verification">,
  reviewerId: string,
  entryLoa: number,
  now: number,
): Promise<Id<"kycRequest"> | undefined> {
  if (entryLoa >= 2) return undefined;

  if (!verification.kycRequestId) {
    throw new ConvexError({
      code: "DOCUMENT_TRACK_REQUIRED",
      message:
        "Aucune pièce d'identité n'est rattachée à cette demande : le Niveau 3 ne peut pas être accordé.",
    });
  }
  const kyc = await ctx.db.get(verification.kycRequestId);
  if (!kyc) {
    throw new ConvexError({
      code: "DOCUMENT_TRACK_REQUIRED",
      message: "La pièce d'identité rattachée est introuvable.",
    });
  }
  if (kyc.status === "rejected") {
    // Un rejet humain des pièces ne se contourne pas par l'entretien : même
    // discipline que la garde de `kyc.submit`, qui empêche un re-dépôt
    // d'écraser silencieusement une décision de contrôleur.
    throw new ConvexError({
      code: "DOCUMENT_TRACK_REJECTED",
      message:
        "Les pièces de cette demande ont été refusées. Le citoyen doit en soumettre de nouvelles.",
    });
  }
  if (kyc.status !== "approved") {
    await ctx.db.patch(kyc._id, {
      status: "approved",
      reviewerId,
      reviewedAt: now,
      complementRequest: undefined,
      updatedAt: now,
    });
    await ctx.db.insert("kycReview", {
      kycRequestId: kyc._id,
      reviewerId,
      decision: "approved",
      notes: "Pièces constatées pendant l'entretien Niveau 3.",
      createdAt: now,
    });
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: reviewerId,
      action: "kyc_approved",
      targetType: "kyc",
      targetId: kyc._id,
      metadata: { method: "level3_fused", verificationId: verification._id },
    });
  }
  return kyc._id;
}

/** Applique la décision et propage LoA, audit et notifications. */
export async function applyLevel3Decision(
  ctx: MutationCtx,
  input: Level3DecisionInput,
): Promise<void> {
  const verification = await ctx.db.get(input.verificationId);
  assertDecidable(verification, input.reviewerId);

  const now = Date.now();
  const profile = await ctx.db
    .query("userProfile")
    .withIndex("by_userId", (q) => q.eq("userId", verification.userId))
    .unique();
  const entryLoa = profile?.loa ?? 1;

  if (input.decision === "rejected") {
    const reason = (input.reason ?? "").trim();
    if (reason.length < 5) {
      throw new ConvexError({ code: "INVALID", message: "Motif trop court." });
    }
    await ctx.db.patch(verification._id, {
      status: "rejected",
      rejectionReason: reason,
      decidedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("level3Review", {
      verificationId: verification._id,
      reviewerId: input.reviewerId,
      decision: "rejected",
      notes: reason,
      createdAt: now,
    });
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: input.reviewerId,
      action: "level3_rejected",
      targetType: "kyc",
      targetId: verification._id,
      metadata: { reason, via: input.via, entryLoa },
    });
    await ctx.runMutation(internal.notifications.dispatch, {
      userId: verification.userId,
      category: "kyc",
      title: "Entretien Niveau 3 non validé",
      body: `Le contrôleur n'a pas pu valider votre demande : ${reason}`,
      metadata: { level3VerificationId: verification._id },
      sendEmail: true,
      pushUrl: "/kyc?target=3",
    });
    return;
  }

  // La preuve documentaire est constatée AVANT de toucher au LoA : si elle
  // manque, rien n'a bougé et la demande reste instruisible.
  const fusedKycRequestId = await settleDocumentTrack(
    ctx,
    verification,
    input.reviewerId,
    entryLoa,
    now,
  );

  await ctx.db.patch(verification._id, {
    status: "approved",
    decidedAt: now,
    updatedAt: now,
  });
  await ctx.db.insert("level3Review", {
    verificationId: verification._id,
    reviewerId: input.reviewerId,
    decision: "approved",
    notes: input.notes?.trim() || undefined,
    createdAt: now,
  });
  if (profile) await ctx.db.patch(profile._id, { loa: 3, updatedAt: now });
  await ctx.runMutation(internal.audit.recordAudit, {
    actorId: input.reviewerId,
    action: "level3_approved",
    targetType: "kyc",
    targetId: verification._id,
    metadata: {
      method: "video_manual_review",
      via: input.via,
      entryLoa,
      ...(fusedKycRequestId ? { fusedKycRequestId } : {}),
    },
  });
  await ctx.runMutation(internal.notifications.dispatch, {
    userId: verification.userId,
    category: "kyc",
    title: "Niveau 3 accordé",
    body: fusedKycRequestId
      ? "Votre entretien a été validé par le contrôleur. Vos pièces ont été constatées : votre identité numérique passe directement au Niveau 3."
      : "Votre entretien a été validé par le contrôleur. Votre identité numérique est désormais au Niveau 3.",
    metadata: { level3VerificationId: verification._id },
    sendEmail: true,
    pushUrl: "/kyc?target=3",
  });
}
