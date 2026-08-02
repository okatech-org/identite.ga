import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { internalQuery, query } from "./_generated/server";
import { mutation } from "./functions";
import {
  requireAuth,
  requireController,
  requireVerifiedAuth,
} from "./lib/auth";
import {
  canJoinScheduledInterview,
  joinOpensAt,
} from "./level3/schedulingPolicy";

const ACTIVE_STATUSES = [
  "waiting_controller",
  "claimed",
  "in_interview",
] as const;

const STATUS = v.union(
  v.literal("waiting_controller"),
  v.literal("claimed"),
  v.literal("in_interview"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("cancelled"),
);

const VERIFICATION = v.object({
  _id: v.id("level3Verification"),
  status: STATUS,
  requestedAt: v.number(),
  claimedAt: v.optional(v.number()),
  interviewStartedAt: v.optional(v.number()),
  decidedAt: v.optional(v.number()),
  rejectionReason: v.optional(v.string()),
  controllerId: v.optional(v.string()),
  controllerName: v.optional(v.string()),
  appointmentSlotId: v.optional(v.id("level3AppointmentSlot")),
  scheduledAt: v.optional(v.number()),
  scheduledEndAt: v.optional(v.number()),
  canJoin: v.boolean(),
  joinOpensAt: v.optional(v.number()),
});

function isActive(status: string): boolean {
  return ACTIVE_STATUSES.includes(status as (typeof ACTIVE_STATUSES)[number]);
}

/** Dernière demande Niveau 3 du citoyen courant. */
export const getMine = query({
  args: {},
  returns: v.union(v.null(), VERIFICATION),
  handler: async (ctx) => {
    const me = await requireAuth(ctx);
    const verification = await ctx.db
      .query("level3Verification")
      .withIndex("by_userId", (q) => q.eq("userId", me.userId))
      .order("desc")
      .first();
    if (!verification) return null;
    const controllerProfile = verification.controllerId
      ? await ctx.db
          .query("userProfile")
          .withIndex("by_userId", (q) =>
            q.eq("userId", verification.controllerId!),
          )
          .unique()
      : null;
    const controllerName = [
      controllerProfile?.pivot?.firstName,
      controllerProfile?.pivot?.lastName,
    ]
      .filter(Boolean)
      .join(" ");
    return {
      _id: verification._id,
      status: verification.status,
      requestedAt: verification.requestedAt,
      claimedAt: verification.claimedAt,
      interviewStartedAt: verification.interviewStartedAt,
      decidedAt: verification.decidedAt,
      rejectionReason: verification.rejectionReason,
      controllerId: verification.controllerId,
      controllerName:
        controllerName ||
        (verification.controllerId ? "Contrôleur IDN" : undefined),
      appointmentSlotId: verification.appointmentSlotId,
      scheduledAt: verification.scheduledAt,
      scheduledEndAt: verification.scheduledEndAt,
      canJoin: canJoinScheduledInterview(
        verification.scheduledAt,
        verification.scheduledEndAt,
        Date.now(),
      ),
      joinOpensAt: joinOpensAt(verification.scheduledAt),
    };
  },
});

/** Ouvre ou reprend une demande L3. Le Niveau 2 est un prérequis strict. */
export const start = mutation({
  args: {},
  returns: v.object({ verificationId: v.id("level3Verification") }),
  handler: async (ctx) => {
    const me = await requireVerifiedAuth(ctx);
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", me.userId))
      .unique();
    if (!profile || profile.loa < 2) {
      throw new ConvexError({
        code: "LEVEL2_REQUIRED",
        message: "Le Niveau 2 est requis avant l'entretien Niveau 3.",
      });
    }
    if (profile.loa >= 3) {
      throw new ConvexError({
        code: "ALREADY_VERIFIED",
        message: "Votre identité est déjà vérifiée au Niveau 3.",
      });
    }

    const recent = await ctx.db
      .query("level3Verification")
      .withIndex("by_userId", (q) => q.eq("userId", me.userId))
      .order("desc")
      .take(10);
    const active = recent.find((row) => isActive(row.status));
    if (active) return { verificationId: active._id };

    const now = Date.now();
    const verificationId = await ctx.db.insert("level3Verification", {
      userId: me.userId,
      status: "waiting_controller",
      roomName: "pending",
      requestedAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(verificationId, {
      roomName: `idn-l3-${verificationId}`,
    });
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: me.userId,
      action: "level3_requested",
      targetType: "kyc",
      targetId: verificationId,
      metadata: { targetLoa: 3, method: "video_manual_review" },
    });
    return { verificationId };
  },
});

export const cancel = mutation({
  args: { verificationId: v.id("level3Verification") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireAuth(ctx);
    const verification = await ctx.db.get(args.verificationId);
    if (!verification || verification.userId !== me.userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Demande introuvable.",
      });
    }
    if (
      verification.status !== "waiting_controller" &&
      verification.status !== "claimed"
    ) {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cette demande est déjà prise en charge.",
      });
    }
    if (verification.appointmentSlotId) {
      const slot = await ctx.db.get(verification.appointmentSlotId);
      if (
        slot?.status === "booked" &&
        slot.verificationId === verification._id
      ) {
        await ctx.db.patch(slot._id, {
          status: "available",
          verificationId: undefined,
          bookedUserId: undefined,
          updatedAt: Date.now(),
        });
      }
    }
    await ctx.db.patch(args.verificationId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: me.userId,
      action: "level3_cancelled",
      targetType: "kyc",
      targetId: args.verificationId,
    });
    return null;
  },
});

const QUEUE_ITEM = v.object({
  _id: v.id("level3Verification"),
  ref: v.string(),
  name: v.string(),
  requestedAt: v.number(),
});

export const listWaiting = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(QUEUE_ITEM),
  handler: async (ctx, args) => {
    await requireController(ctx);
    const limit = Math.min(Math.max(args.limit ?? 30, 1), 100);
    const rows = await ctx.db
      .query("level3Verification")
      .withIndex("by_status", (q) => q.eq("status", "waiting_controller"))
      .order("asc")
      .take(limit);
    return await Promise.all(
      rows.map(async (row) => {
        const profile = await ctx.db
          .query("userProfile")
          .withIndex("by_userId", (q) => q.eq("userId", row.userId))
          .unique();
        const name = [profile?.pivot?.firstName, profile?.pivot?.lastName]
          .filter(Boolean)
          .join(" ");
        return {
          _id: row._id,
          ref: shortRef(row._id),
          name: name || "—",
          requestedAt: row.requestedAt,
        };
      }),
    );
  },
});

export const waitingCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireController(ctx);
    return (
      await ctx.db
        .query("level3Verification")
        .withIndex("by_status", (q) => q.eq("status", "waiting_controller"))
        .take(100)
    ).length;
  },
});

const CURRENT = v.object({
  _id: v.id("level3Verification"),
  ref: v.string(),
  status: v.union(v.literal("claimed"), v.literal("in_interview")),
  requestedAt: v.number(),
  citizen: v.object({
    firstName: v.string(),
    lastName: v.string(),
    idnId: v.optional(v.string()),
    currentLoa: v.union(v.literal(1), v.literal(2), v.literal(3)),
  }),
});

export const myCurrent = query({
  args: {},
  returns: v.union(v.null(), CURRENT),
  handler: async (ctx) => {
    const controller = await requireController(ctx);
    const recent = await ctx.db
      .query("level3Verification")
      .withIndex("by_controllerId", (q) =>
        q.eq("controllerId", controller.userId),
      )
      .order("desc")
      .take(10);
    const verification = recent.find(
      (row) => row.status === "claimed" || row.status === "in_interview",
    );
    if (!verification) return null;
    const status: "claimed" | "in_interview" =
      verification.status === "in_interview" ? "in_interview" : "claimed";
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", verification.userId))
      .unique();
    return {
      _id: verification._id,
      ref: shortRef(verification._id),
      status,
      requestedAt: verification.requestedAt,
      citizen: {
        firstName: profile?.pivot?.firstName ?? "",
        lastName: profile?.pivot?.lastName ?? "",
        idnId: profile?.idnId,
        currentLoa: profile?.loa ?? 1,
      },
    };
  },
});

export const claim = mutation({
  args: { verificationId: v.id("level3Verification") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx);
    const verification = await ctx.db.get(args.verificationId);
    if (!verification) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Demande introuvable.",
      });
    }
    if (
      verification.controllerId === controller.userId &&
      (verification.status === "claimed" ||
        verification.status === "in_interview")
    ) {
      return null;
    }
    if (verification.status !== "waiting_controller") {
      throw new ConvexError({
        code: "ALREADY_CLAIMED",
        message: "Cette demande est déjà prise en charge.",
      });
    }
    const current = await ctx.db
      .query("level3Verification")
      .withIndex("by_controllerId", (q) =>
        q.eq("controllerId", controller.userId),
      )
      .order("desc")
      .take(10);
    if (
      current.some(
        (row) => row.status === "claimed" || row.status === "in_interview",
      )
    ) {
      throw new ConvexError({
        code: "CURRENT_INTERVIEW_EXISTS",
        message:
          "Terminez votre entretien en cours avant d'en prendre un autre.",
      });
    }
    const now = Date.now();
    await ctx.db.patch(args.verificationId, {
      status: "claimed",
      controllerId: controller.userId,
      claimedAt: now,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: controller.userId,
      action: "level3_claimed",
      targetType: "kyc",
      targetId: args.verificationId,
    });
    await ctx.runMutation(internal.notifications.dispatch, {
      userId: verification.userId,
      category: "kyc",
      title: "Votre entretien Niveau 3 peut commencer",
      body: "Un contrôleur d'identité a pris en charge votre demande. Rejoignez l'entretien vidéo depuis votre profil.",
      metadata: { level3VerificationId: args.verificationId },
      sendEmail: true,
      pushUrl: "/kyc?target=3",
    });
    return null;
  },
});

export const beginInterview = mutation({
  args: { verificationId: v.id("level3Verification") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx);
    const verification = await ctx.db.get(args.verificationId);
    if (!verification || verification.controllerId !== controller.userId) {
      throw new ConvexError({
        code: "NOT_CLAIMED",
        message: "Entretien non assigné.",
      });
    }
    if (verification.status === "in_interview") return null;
    if (verification.status !== "claimed") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Entretien indisponible.",
      });
    }
    if (
      !canJoinScheduledInterview(
        verification.scheduledAt,
        verification.scheduledEndAt,
        Date.now(),
      )
    ) {
      throw new ConvexError({
        code: "OUTSIDE_APPOINTMENT_WINDOW",
        message: "La salle ouvre 15 minutes avant l'heure du rendez-vous.",
      });
    }
    const now = Date.now();
    await ctx.db.patch(args.verificationId, {
      status: "in_interview",
      interviewStartedAt: now,
      updatedAt: now,
    });
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: controller.userId,
      action: "level3_interview_started",
      targetType: "kyc",
      targetId: args.verificationId,
    });
    return null;
  },
});

export const approve = mutation({
  args: {
    verificationId: v.id("level3Verification"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx);
    const verification = await ctx.db.get(args.verificationId);
    assertDecidable(verification, controller.userId);
    const now = Date.now();
    await ctx.db.patch(args.verificationId, {
      status: "approved",
      decidedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("level3Review", {
      verificationId: args.verificationId,
      reviewerId: controller.userId,
      decision: "approved",
      notes: args.notes?.trim() || undefined,
      createdAt: now,
    });
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", verification.userId))
      .unique();
    if (profile) await ctx.db.patch(profile._id, { loa: 3, updatedAt: now });
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: controller.userId,
      action: "level3_approved",
      targetType: "kyc",
      targetId: args.verificationId,
      metadata: { method: "video_manual_review" },
    });
    await ctx.runMutation(internal.notifications.dispatch, {
      userId: verification.userId,
      category: "kyc",
      title: "Niveau 3 accordé",
      body: "Votre entretien a été validé par le contrôleur. Votre identité numérique est désormais au Niveau 3.",
      metadata: { level3VerificationId: args.verificationId },
      sendEmail: true,
      pushUrl: "/kyc?target=3",
    });
    return null;
  },
});

export const reject = mutation({
  args: {
    verificationId: v.id("level3Verification"),
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx);
    const verification = await ctx.db.get(args.verificationId);
    assertDecidable(verification, controller.userId);
    const reason = args.reason.trim();
    if (reason.length < 5) {
      throw new ConvexError({ code: "INVALID", message: "Motif trop court." });
    }
    const now = Date.now();
    await ctx.db.patch(args.verificationId, {
      status: "rejected",
      rejectionReason: reason,
      decidedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("level3Review", {
      verificationId: args.verificationId,
      reviewerId: controller.userId,
      decision: "rejected",
      notes: reason,
      createdAt: now,
    });
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: controller.userId,
      action: "level3_rejected",
      targetType: "kyc",
      targetId: args.verificationId,
      metadata: { reason },
    });
    await ctx.runMutation(internal.notifications.dispatch, {
      userId: verification.userId,
      category: "kyc",
      title: "Entretien Niveau 3 non validé",
      body: `Le contrôleur n'a pas pu valider votre demande : ${reason}`,
      metadata: { level3VerificationId: args.verificationId },
      sendEmail: true,
      pushUrl: "/kyc?target=3",
    });
    return null;
  },
});

/** Contexte d'autorisation consommé par l'action Node qui signe le jeton. */
export const _getJoinContext = internalQuery({
  args: { verificationId: v.id("level3Verification") },
  returns: v.object({
    roomName: v.string(),
    participantIdentity: v.string(),
    participantName: v.string(),
    role: v.union(v.literal("citizen"), v.literal("controller")),
  }),
  handler: async (ctx, args) => {
    const me = await requireAuth(ctx);
    const verification = await ctx.db.get(args.verificationId);
    if (
      !verification ||
      !["claimed", "in_interview"].includes(verification.status)
    ) {
      throw new ConvexError({
        code: "ROOM_UNAVAILABLE",
        message: "Entretien indisponible.",
      });
    }
    if (
      !canJoinScheduledInterview(
        verification.scheduledAt,
        verification.scheduledEndAt,
        Date.now(),
      )
    ) {
      throw new ConvexError({
        code: "OUTSIDE_APPOINTMENT_WINDOW",
        message: "La salle ouvre 15 minutes avant l'heure du rendez-vous.",
      });
    }
    const isCitizen = verification.userId === me.userId;
    const isController =
      verification.controllerId === me.userId &&
      me.roles.includes("identity_controller");
    if (!isCitizen && !isController) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Accès refusé à cet entretien.",
      });
    }
    const role: "citizen" | "controller" = isController
      ? "controller"
      : "citizen";
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", me.userId))
      .unique();
    const name = [profile?.pivot?.firstName, profile?.pivot?.lastName]
      .filter(Boolean)
      .join(" ");
    return {
      roomName: verification.roomName,
      participantIdentity: `${role}:${me.userId}`,
      participantName:
        name || (role === "controller" ? "Contrôleur" : "Citoyen"),
      role,
    };
  },
});

type DecidableVerification = {
  status: string;
  controllerId?: string;
  userId: string;
};

function assertDecidable(
  verification: DecidableVerification | null,
  controllerId: string,
): asserts verification is DecidableVerification {
  if (!verification) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Demande introuvable.",
    });
  }
  if (verification.controllerId !== controllerId) {
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

function shortRef(id: string): string {
  const trimmed = id.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `L3-${trimmed.slice(-6, -3) || "000"}-${trimmed.slice(-3) || "000"}`;
}
