import { ConvexError, v } from "convex/values";

import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import { internalQuery } from "../_generated/server";
import type { QueryCtx } from "../_generated/server";
// ⚠️ `internalMutation` vient de `../functions`, PAS de `_generated/server` :
// ces mutations touchent `kycRequest` (clôture de la piste documentaire) et
// `level3Verification`. Sans les triggers, l'agrégat `kycByStatus` se
// désynchroniserait et aucun webhook ne partirait vers le partenaire.
import { internalMutation } from "../functions";
import { applyLevel3Decision } from "../level3/decision";
import {
  buildSlots,
  canJoinScheduledInterview,
  joinOpensAt,
  LEVEL3_MAX_BOOKING_HORIZON_MS,
  LEVEL3_MIN_BOOKING_NOTICE_MS,
} from "../level3/schedulingPolicy";

/**
 * Traitement des demandes de vérification depuis une application partenaire.
 *
 * administration.ga est une *relying party* d'identite.ga : ses agents s'y
 * authentifient par SSO et possèdent donc un `sub` IDN stable. Une clé M2M à
 * scope les autorise à instruire la file depuis leur propre plateforme, sans
 * ouvrir la console contrôleur native.
 *
 * ⚠️ Le partenaire VOUCHE pour l'agent : identite.ga ne peut pas re-vérifier
 * les habilitations internes d'administration.ga. C'est pourquoi
 * `partnerKeyId` est enregistré sur chaque acte — l'audit doit pouvoir
 * remonter non seulement à l'agent, mais à la clé qui a affirmé son identité.
 * Une clé compromise se révoque, et tout ce qu'elle a signé reste traçable.
 *
 * Ces fonctions sont INTERNES : elles ne sont atteignables que par les routes
 * HTTP de `http.ts`, qui portent l'authentification par clé et le contrôle de
 * scope. Les exposer en `query`/`mutation` publiques les rendrait appelables
 * par n'importe quelle session citoyenne.
 */

const QUEUE_ITEM = v.object({
  verificationId: v.id("level3Verification"),
  ref: v.string(),
  status: v.string(),
  targetLoa: v.number(),
  entryLoa: v.number(),
  requestedAt: v.number(),
  updatedAt: v.number(),
  scheduledAt: v.optional(v.number()),
  scheduledEndAt: v.optional(v.number()),
  claimedBy: v.optional(v.string()),
  claimedByName: v.optional(v.string()),
  documentTrackStatus: v.union(v.string(), v.null()),
  citizen: v.object({
    sub: v.string(),
    idnId: v.union(v.string(), v.null()),
    firstName: v.union(v.string(), v.null()),
    lastName: v.union(v.string(), v.null()),
    currentLoa: v.number(),
  }),
});

function shortRef(id: string): string {
  const trimmed = id.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `L3-${trimmed.slice(-6, -3) || "000"}-${trimmed.slice(-3) || "000"}`;
}

async function toQueueItem(ctx: QueryCtx, row: Doc<"level3Verification">) {
  const profile = await ctx.db
    .query("userProfile")
    .withIndex("by_userId", (q) => q.eq("userId", row.userId))
    .unique();
  const kyc = row.kycRequestId ? await ctx.db.get(row.kycRequestId) : null;
  return {
    verificationId: row._id,
    ref: shortRef(row._id),
    status: row.status,
    targetLoa: 3,
    entryLoa: row.entryLoa ?? profile?.loa ?? 1,
    requestedAt: row.requestedAt,
    updatedAt: row.updatedAt,
    scheduledAt: row.scheduledAt,
    scheduledEndAt: row.scheduledEndAt,
    claimedBy: row.controllerId,
    claimedByName: row.controllerName,
    documentTrackStatus: kyc?.status ?? null,
    citizen: {
      sub: row.userId,
      idnId: profile?.idnId ?? null,
      firstName: profile?.pivot?.firstName ?? null,
      lastName: profile?.pivot?.lastName ?? null,
      currentLoa: profile?.loa ?? 1,
    },
  };
}

/**
 * File des demandes.
 *
 * Deux modes, exclusifs :
 *  - `status` : la file de travail (par défaut `waiting_controller`) ;
 *  - `updatedSince` : RESYNCHRONISATION — tout ce qui a changé depuis un
 *    horodatage, quel que soit le statut. C'est le filet de réparation quand
 *    un webhook s'est perdu ; sans lui, une réplique divergente n'aurait aucun
 *    moyen de se remettre d'aplomb.
 */
export const listQueue = internalQuery({
  args: {
    // Union littérale plutôt que `v.string()` : le statut sert d'index, et un
    // libellé libre y produirait une file vide au lieu d'une erreur — une
    // panne muette pour le partenaire.
    status: v.optional(
      v.union(
        v.literal("waiting_controller"),
        v.literal("claimed"),
        v.literal("in_interview"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("cancelled"),
      ),
    ),
    updatedSince: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    items: v.array(QUEUE_ITEM),
    /** Horodatage à repasser en `updatedSince` au prochain appel. */
    syncedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
    const rows =
      args.updatedSince !== undefined
        ? await ctx.db
            .query("level3Verification")
            .withIndex("by_updatedAt", (q) =>
              q.gte("updatedAt", args.updatedSince!),
            )
            .order("asc")
            .take(limit)
        : await ctx.db
            .query("level3Verification")
            .withIndex("by_status", (q) =>
              q.eq("status", args.status ?? "waiting_controller"),
            )
            .order("asc")
            .take(limit);

    const items = await Promise.all(rows.map((row) => toQueueItem(ctx, row)));
    return { items, syncedAt: Date.now() };
  },
});

const MEDIA = v.object({
  documentType: v.union(v.string(), v.null()),
  status: v.union(v.string(), v.null()),
  score: v.optional(v.number()),
  faceMatchScore: v.optional(v.number()),
  livenessVerdict: v.optional(v.string()),
  ocrAvailable: v.optional(v.boolean()),
  biometricAvailable: v.optional(v.boolean()),
  docFrontUrl: v.union(v.string(), v.null()),
  docBackUrl: v.union(v.string(), v.null()),
  selfieUrl: v.union(v.string(), v.null()),
});

/**
 * Détail d'une demande, avec les pièces si le scope `idn:verification:media`
 * est accordé.
 *
 * Les pièces sont servies en URL SIGNÉES à durée limitée par Convex Storage —
 * jamais en base64 dans la réponse. Une image inlinée finirait dans les logs
 * du partenaire, ses caches HTTP et ses sauvegardes ; l'URL, elle, expire.
 */
export const getDetail = internalQuery({
  args: {
    verificationId: v.id("level3Verification"),
    includeMedia: v.boolean(),
  },
  returns: v.union(
    v.null(),
    v.object({
      item: QUEUE_ITEM,
      roomName: v.string(),
      canJoin: v.boolean(),
      joinOpensAt: v.optional(v.number()),
      media: v.union(MEDIA, v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.verificationId);
    if (!row) return null;
    const item = await toQueueItem(ctx, row);

    let media = null;
    if (args.includeMedia && row.kycRequestId) {
      const kyc = await ctx.db.get(row.kycRequestId);
      if (kyc) {
        const [docFrontUrl, docBackUrl, selfieUrl] = await Promise.all([
          kyc.documentImages.front
            ? ctx.storage.getUrl(kyc.documentImages.front)
            : Promise.resolve(null),
          kyc.documentImages.back
            ? ctx.storage.getUrl(kyc.documentImages.back)
            : Promise.resolve(null),
          kyc.selfieImage
            ? ctx.storage.getUrl(kyc.selfieImage)
            : Promise.resolve(null),
        ]);
        media = {
          documentType: kyc.documentType,
          status: kyc.status,
          score: kyc.score,
          faceMatchScore: kyc.faceMatchScore,
          livenessVerdict: kyc.livenessVerdict,
          ocrAvailable: kyc.ocrAvailable,
          biometricAvailable: kyc.biometricAvailable,
          docFrontUrl,
          docBackUrl,
          selfieUrl,
        };
      }
    }

    return {
      item,
      roomName: row.roomName,
      canJoin: canJoinScheduledInterview(
        row.scheduledAt,
        row.scheduledEndAt,
        Date.now(),
      ),
      joinOpensAt: joinOpensAt(row.scheduledAt),
      media,
    };
  },
});

/** Prend en charge une demande au nom d'un agent partenaire. */
export const claim = internalMutation({
  args: {
    verificationId: v.id("level3Verification"),
    agentSub: v.string(),
    agentName: v.optional(v.string()),
    partnerKeyId: v.id("developerApiKey"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.verificationId);
    if (!row) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Demande introuvable.",
      });
    }
    // Rejouer un claim déjà accordé au même agent est sans effet : le
    // partenaire peut réessayer après un timeout réseau sans casser l'état.
    if (
      row.controllerId === args.agentSub &&
      (row.status === "claimed" || row.status === "in_interview")
    ) {
      return null;
    }
    if (row.status !== "waiting_controller" && row.status !== "claimed") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cette demande n'est plus attribuable.",
      });
    }
    if (row.controllerId && row.controllerId !== args.agentSub) {
      throw new ConvexError({
        code: "ALREADY_CLAIMED",
        message: "Cette demande est déjà prise en charge par un autre agent.",
      });
    }

    const now = Date.now();
    await ctx.db.patch(row._id, {
      status: "claimed",
      controllerId: args.agentSub,
      controllerName: args.agentName?.trim() || undefined,
      handledVia: "partner",
      partnerKeyId: args.partnerKeyId,
      claimedAt: row.claimedAt ?? now,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: args.agentSub,
      action: "level3_claimed",
      targetType: "kyc",
      targetId: row._id,
      metadata: { via: "partner", partnerKeyId: args.partnerKeyId },
    });
    await ctx.runMutation(internal.notifications.dispatch, {
      userId: row.userId,
      category: "kyc",
      title: "Votre demande de vérification est prise en charge",
      body: "Un agent d'administration a pris en charge votre demande. Vous pourrez rejoindre l'entretien vidéo à l'heure du rendez-vous.",
      metadata: { level3VerificationId: row._id },
      sendEmail: true,
      pushUrl: "/kyc?target=3",
    });
    return null;
  },
});

/** Ouvre l'entretien — prérequis à toute décision. */
export const beginInterview = internalMutation({
  args: {
    verificationId: v.id("level3Verification"),
    agentSub: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.verificationId);
    if (!row || row.controllerId !== args.agentSub) {
      throw new ConvexError({
        code: "NOT_CLAIMED",
        message: "Entretien non assigné.",
      });
    }
    if (row.status === "in_interview") return null;
    if (row.status !== "claimed") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Entretien indisponible.",
      });
    }
    if (
      !canJoinScheduledInterview(row.scheduledAt, row.scheduledEndAt, Date.now())
    ) {
      throw new ConvexError({
        code: "OUTSIDE_APPOINTMENT_WINDOW",
        message: "La salle ouvre 15 minutes avant l'heure du rendez-vous.",
      });
    }
    const now = Date.now();
    await ctx.db.patch(row._id, {
      status: "in_interview",
      interviewStartedAt: now,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: args.agentSub,
      action: "level3_interview_started",
      targetType: "kyc",
      targetId: row._id,
      metadata: { via: "partner" },
    });
    return null;
  },
});

/**
 * Décision de l'agent partenaire.
 *
 * Délègue à `applyLevel3Decision` — la MÊME implémentation que la console
 * contrôleur native. Le canal partenaire n'a aucune latitude propre sur la
 * doctrine : ni sur la preuve documentaire, ni sur le passage de LoA.
 */
export const decide = internalMutation({
  args: {
    verificationId: v.id("level3Verification"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    agentSub: v.string(),
    notes: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await applyLevel3Decision(ctx, {
      verificationId: args.verificationId,
      decision: args.decision,
      reviewerId: args.agentSub,
      notes: args.notes,
      reason: args.reason,
      via: "partner",
    });
    return null;
  },
});

const SLOT = v.object({
  slotId: v.id("level3AppointmentSlot"),
  startsAt: v.number(),
  endsAt: v.number(),
  status: v.string(),
  verificationId: v.optional(v.id("level3Verification")),
  citizenName: v.union(v.string(), v.null()),
});

/** Agenda de l'agent partenaire (ses propres créneaux). */
export const listSlots = internalQuery({
  args: {
    agentSub: v.string(),
    from: v.optional(v.number()),
    to: v.optional(v.number()),
  },
  returns: v.array(SLOT),
  handler: async (ctx, args) => {
    const now = Date.now();
    const from = args.from ?? now - 24 * 60 * 60 * 1000;
    const to = args.to ?? now + LEVEL3_MAX_BOOKING_HORIZON_MS;
    const slots = await ctx.db
      .query("level3AppointmentSlot")
      .withIndex("by_controllerId_and_startsAt", (q) =>
        q.eq("controllerId", args.agentSub).gte("startsAt", from).lte("startsAt", to),
      )
      .take(300);

    return await Promise.all(
      slots.map(async (slot) => {
        let citizenName: string | null = null;
        if (slot.bookedUserId) {
          const profile = await ctx.db
            .query("userProfile")
            .withIndex("by_userId", (q) => q.eq("userId", slot.bookedUserId!))
            .unique();
          citizenName =
            [profile?.pivot?.firstName, profile?.pivot?.lastName]
              .filter(Boolean)
              .join(" ") || null;
        }
        return {
          slotId: slot._id,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          status: slot.status,
          verificationId: slot.verificationId,
          citizenName,
        };
      }),
    );
  },
});

/**
 * Publie une plage de disponibilité pour l'agent partenaire, découpée en
 * créneaux réservables par les citoyens.
 *
 * Mêmes bornes que la console native (`level3/scheduling.createAvailability`) :
 * elles viennent de `schedulingPolicy`, donc un agent d'administration.ga ne
 * peut pas ouvrir des créneaux que le parcours citoyen refuserait d'afficher.
 */
export const createAvailability = internalMutation({
  args: {
    agentSub: v.string(),
    startsAt: v.number(),
    endsAt: v.number(),
    durationMinutes: v.union(v.literal(30), v.literal(45), v.literal(60)),
  },
  returns: v.object({ created: v.number() }),
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.startsAt < now + LEVEL3_MIN_BOOKING_NOTICE_MS) {
      throw new ConvexError({
        code: "TOO_SOON",
        message: "La plage doit commencer au moins 30 minutes dans le futur.",
      });
    }
    if (args.startsAt > now + LEVEL3_MAX_BOOKING_HORIZON_MS) {
      throw new ConvexError({
        code: "TOO_FAR",
        message: "La date dépasse 90 jours.",
      });
    }
    if (
      args.endsAt <= args.startsAt ||
      args.endsAt - args.startsAt > 8 * 60 * 60 * 1000
    ) {
      throw new ConvexError({
        code: "INVALID_RANGE",
        message: "La plage doit durer entre un créneau et huit heures.",
      });
    }

    const proposed = buildSlots(args.startsAt, args.endsAt, args.durationMinutes);
    if (proposed.length === 0 || proposed.length > 16) {
      throw new ConvexError({
        code: "INVALID_RANGE",
        message: "Cette plage ne contient aucun créneau complet.",
      });
    }
    const existing = await ctx.db
      .query("level3AppointmentSlot")
      .withIndex("by_controllerId_and_startsAt", (q) =>
        q
          .eq("controllerId", args.agentSub)
          .gte("startsAt", args.startsAt - 60 * 60 * 1000)
          .lt("startsAt", args.endsAt),
      )
      .take(100);
    if (
      existing.some(
        (slot) => slot.status !== "cancelled" && slot.endsAt > args.startsAt,
      )
    ) {
      throw new ConvexError({
        code: "OVERLAP",
        message: "Cette plage chevauche une disponibilité existante.",
      });
    }

    for (const slot of proposed) {
      await ctx.db.insert("level3AppointmentSlot", {
        controllerId: args.agentSub,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        status: "available",
        createdAt: now,
        updatedAt: now,
      });
    }
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: args.agentSub,
      action: "level3_availability_created",
      targetType: "kyc",
      targetId: `${args.startsAt}`,
      metadata: {
        startsAt: args.startsAt,
        endsAt: args.endsAt,
        slots: proposed.length,
        via: "partner",
      },
    });
    return { created: proposed.length };
  },
});

/** Contexte de jointure LiveKit pour l'agent partenaire. */
export const getJoinContext = internalQuery({
  args: {
    verificationId: v.id("level3Verification"),
    agentSub: v.string(),
  },
  returns: v.object({
    roomName: v.string(),
    participantIdentity: v.string(),
    participantName: v.string(),
  }),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.verificationId);
    if (!row || !["claimed", "in_interview"].includes(row.status)) {
      throw new ConvexError({
        code: "ROOM_UNAVAILABLE",
        message: "Entretien indisponible.",
      });
    }
    // L'agent doit être CELUI qui a pris la demande. Sans ce contrôle, toute
    // clé partenaire valide pourrait entrer dans n'importe quel entretien.
    if (row.controllerId !== args.agentSub) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Entretien non assigné à cet agent.",
      });
    }
    if (
      !canJoinScheduledInterview(row.scheduledAt, row.scheduledEndAt, Date.now())
    ) {
      throw new ConvexError({
        code: "OUTSIDE_APPOINTMENT_WINDOW",
        message: "La salle ouvre 15 minutes avant l'heure du rendez-vous.",
      });
    }
    return {
      roomName: row.roomName,
      participantIdentity: `controller:${args.agentSub}`,
      participantName: row.controllerName || "Agent d'administration",
    };
  },
});

/** Résout un id de vérification et son propriétaire — utilisé par le webhook. */
export const getForWebhook = internalQuery({
  args: { verificationId: v.id("level3Verification") },
  returns: v.union(v.null(), QUEUE_ITEM),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.verificationId);
    if (!row) return null;
    return await toQueueItem(ctx, row);
  },
});

export type PartnerQueueItem = Awaited<ReturnType<typeof toQueueItem>>;
export type { Id };
