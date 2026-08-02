import { ConvexError, v } from "convex/values";

import { internal } from "../_generated/api";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { internalMutation, query } from "../_generated/server";
import { mutation } from "../functions";
import { requireController, requireVerifiedAuth } from "../lib/auth";
import {
  buildSlots,
  canJoinScheduledInterview,
  formatLibrevilleAppointment,
  joinOpensAt,
  LEVEL3_MAX_BOOKING_HORIZON_MS,
  LEVEL3_MIN_BOOKING_NOTICE_MS,
  LEVEL3_REMINDER_LEAD_MS,
} from "./schedulingPolicy";

const SLOT_DURATION = v.union(v.literal(30), v.literal(45), v.literal(60));

const AVAILABLE_SLOT = v.object({
  _id: v.id("level3AppointmentSlot"),
  startsAt: v.number(),
  endsAt: v.number(),
  controllerName: v.string(),
});

const CONTROLLER_SLOT = v.object({
  _id: v.id("level3AppointmentSlot"),
  startsAt: v.number(),
  endsAt: v.number(),
  status: v.union(
    v.literal("available"),
    v.literal("booked"),
    v.literal("cancelled"),
  ),
  citizenName: v.optional(v.string()),
  verificationId: v.optional(v.id("level3Verification")),
});

const APPOINTMENT = v.object({
  _id: v.id("level3Verification"),
  slotId: v.id("level3AppointmentSlot"),
  ref: v.string(),
  status: v.union(v.literal("claimed"), v.literal("in_interview")),
  scheduledAt: v.number(),
  scheduledEndAt: v.number(),
  canJoin: v.boolean(),
  joinOpensAt: v.number(),
  citizen: v.object({
    firstName: v.string(),
    lastName: v.string(),
    idnId: v.optional(v.string()),
    currentLoa: v.union(v.literal(1), v.literal(2), v.literal(3)),
  }),
});

function shortRef(id: string): string {
  const trimmed = id.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `L3-${trimmed.slice(-6, -3) || "000"}-${trimmed.slice(-3) || "000"}`;
}

async function profileName(
  ctx: Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">,
  userId: string,
  fallback: string,
): Promise<string> {
  const profile = await ctx.db
    .query("userProfile")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  return (
    [profile?.pivot?.firstName, profile?.pivot?.lastName]
      .filter(Boolean)
      .join(" ") || fallback
  );
}

/** Créneaux encore réservables par le citoyen courant. */
export const listAvailable = query({
  args: { from: v.optional(v.number()), to: v.optional(v.number()) },
  returns: v.array(AVAILABLE_SLOT),
  handler: async (ctx, args) => {
    const me = await requireVerifiedAuth(ctx);
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", me.userId))
      .unique();
    if (!profile || profile.loa < 2 || profile.loa >= 3) return [];

    const now = Date.now();
    const from = Math.max(args.from ?? now + LEVEL3_MIN_BOOKING_NOTICE_MS, now);
    const to = Math.min(
      args.to ?? now + LEVEL3_MAX_BOOKING_HORIZON_MS,
      now + LEVEL3_MAX_BOOKING_HORIZON_MS,
    );
    const slots = await ctx.db
      .query("level3AppointmentSlot")
      .withIndex("by_status_and_startsAt", (q) =>
        q.eq("status", "available").gte("startsAt", from).lte("startsAt", to),
      )
      .take(120);

    const names = new Map<string, string>();
    return await Promise.all(
      slots.map(async (slot) => {
        let name = names.get(slot.controllerId);
        if (!name) {
          name = await profileName(ctx, slot.controllerId, "Contrôleur IDN");
          names.set(slot.controllerId, name);
        }
        return {
          _id: slot._id,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          controllerName: name,
        };
      }),
    );
  },
});

/** Agenda de disponibilités du contrôleur courant. */
export const myAvailability = query({
  args: { from: v.optional(v.number()), to: v.optional(v.number()) },
  returns: v.array(CONTROLLER_SLOT),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx);
    const now = Date.now();
    const from = args.from ?? now - 24 * 60 * 60 * 1000;
    const to = args.to ?? now + LEVEL3_MAX_BOOKING_HORIZON_MS;
    const slots = await ctx.db
      .query("level3AppointmentSlot")
      .withIndex("by_controllerId_and_startsAt", (q) =>
        q
          .eq("controllerId", controller.userId)
          .gte("startsAt", from)
          .lte("startsAt", to),
      )
      .take(300);

    return await Promise.all(
      slots.map(async (slot) => ({
        _id: slot._id,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        status: slot.status,
        citizenName: slot.bookedUserId
          ? await profileName(ctx, slot.bookedUserId, "Citoyen IDN")
          : undefined,
        verificationId: slot.verificationId,
      })),
    );
  },
});

/** Prochains rendez-vous réservés au contrôleur courant. */
export const myAppointments = query({
  args: {},
  returns: v.array(APPOINTMENT),
  handler: async (ctx) => {
    const controller = await requireController(ctx);
    const now = Date.now();
    const slots = await ctx.db
      .query("level3AppointmentSlot")
      .withIndex("by_controllerId_and_startsAt", (q) =>
        q
          .eq("controllerId", controller.userId)
          .gte("startsAt", now - 24 * 60 * 60 * 1000)
          .lte("startsAt", now + LEVEL3_MAX_BOOKING_HORIZON_MS),
      )
      .take(200);

    const appointments = [];
    for (const slot of slots) {
      if (slot.status !== "booked" || !slot.verificationId) continue;
      const verification = await ctx.db.get(slot.verificationId);
      if (
        !verification ||
        verification.controllerId !== controller.userId ||
        (verification.status !== "claimed" &&
          verification.status !== "in_interview")
      ) {
        continue;
      }
      const profile = await ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", verification.userId))
        .unique();
      appointments.push({
        _id: verification._id,
        slotId: slot._id,
        ref: shortRef(verification._id),
        status: verification.status,
        scheduledAt: slot.startsAt,
        scheduledEndAt: slot.endsAt,
        canJoin: canJoinScheduledInterview(slot.startsAt, slot.endsAt, now),
        joinOpensAt: joinOpensAt(slot.startsAt) ?? slot.startsAt,
        citizen: {
          firstName: profile?.pivot?.firstName ?? "",
          lastName: profile?.pivot?.lastName ?? "",
          idnId: profile?.idnId,
          currentLoa: profile?.loa ?? 1,
        },
      });
    }
    return appointments;
  },
});

/** Publie une plage et la découpe en créneaux réservables. */
export const createAvailability = mutation({
  args: {
    startsAt: v.number(),
    endsAt: v.number(),
    durationMinutes: SLOT_DURATION,
  },
  returns: v.object({ created: v.number() }),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx);
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

    const proposed = buildSlots(
      args.startsAt,
      args.endsAt,
      args.durationMinutes,
    );
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
          .eq("controllerId", controller.userId)
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
        controllerId: controller.userId,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        status: "available",
        createdAt: now,
        updatedAt: now,
      });
    }
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: controller.userId,
      action: "level3_availability_created",
      targetType: "kyc",
      targetId: `${args.startsAt}`,
      metadata: {
        startsAt: args.startsAt,
        endsAt: args.endsAt,
        slots: proposed.length,
      },
    });
    return { created: proposed.length };
  },
});

export const cancelAvailability = mutation({
  args: { slotId: v.id("level3AppointmentSlot") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx);
    const slot = await ctx.db.get(args.slotId);
    if (!slot || slot.controllerId !== controller.userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Créneau introuvable.",
      });
    }
    if (slot.status === "booked") {
      throw new ConvexError({
        code: "BOOKED",
        message: "Un rendez-vous réservé ne peut pas être supprimé.",
      });
    }
    if (slot.status !== "cancelled") {
      await ctx.db.patch(slot._id, {
        status: "cancelled",
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

/** Réserve ou remplace le créneau d'une demande Niveau 3. */
export const book = mutation({
  args: {
    verificationId: v.id("level3Verification"),
    slotId: v.id("level3AppointmentSlot"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const me = await requireVerifiedAuth(ctx);
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
        message: "Ce rendez-vous ne peut plus être modifié.",
      });
    }
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", me.userId))
      .unique();
    if (!profile || profile.loa !== 2) {
      throw new ConvexError({
        code: "LEVEL2_REQUIRED",
        message: "Le Niveau 2 est requis pour réserver cet entretien.",
      });
    }
    const slot = await ctx.db.get(args.slotId);
    if (!slot || slot.startsAt < Date.now() + LEVEL3_MIN_BOOKING_NOTICE_MS) {
      throw new ConvexError({
        code: "UNAVAILABLE",
        message: "Ce créneau n'est plus disponible.",
      });
    }
    if (slot.verificationId === verification._id && slot.status === "booked")
      return null;
    if (slot.status !== "available") {
      throw new ConvexError({
        code: "UNAVAILABLE",
        message: "Ce créneau vient d'être réservé.",
      });
    }

    const rescheduled = verification.appointmentSlotId !== undefined;
    if (verification.appointmentSlotId) {
      const previous = await ctx.db.get(verification.appointmentSlotId);
      if (
        previous?.status === "booked" &&
        previous.verificationId === verification._id
      ) {
        await ctx.db.patch(previous._id, {
          status: "available",
          verificationId: undefined,
          bookedUserId: undefined,
          updatedAt: Date.now(),
        });
      }
    }

    const now = Date.now();
    await ctx.db.patch(slot._id, {
      status: "booked",
      verificationId: verification._id,
      bookedUserId: me.userId,
      updatedAt: now,
    });
    await ctx.db.patch(verification._id, {
      status: "claimed",
      controllerId: slot.controllerId,
      appointmentSlotId: slot._id,
      scheduledAt: slot.startsAt,
      scheduledEndAt: slot.endsAt,
      reminderSentAt: undefined,
      claimedAt: now,
      updatedAt: now,
    });

    const controllerName = await profileName(
      ctx,
      slot.controllerId,
      "Contrôleur IDN",
    );
    const formatted = formatLibrevilleAppointment(slot.startsAt);
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: me.userId,
      action: rescheduled ? "level3_rescheduled" : "level3_scheduled",
      targetType: "kyc",
      targetId: verification._id,
      metadata: { scheduledAt: slot.startsAt, controllerId: slot.controllerId },
    });
    await ctx.runMutation(internal.notifications.dispatch, {
      userId: me.userId,
      category: "kyc",
      title: rescheduled
        ? "Entretien Niveau 3 replanifié"
        : "Entretien Niveau 3 confirmé",
      body: `Votre entretien avec ${controllerName} est prévu ${formatted} (heure de Libreville).`,
      metadata: {
        level3VerificationId: verification._id,
        scheduledAt: slot.startsAt,
      },
      sendEmail: true,
      pushUrl: "/kyc?target=3",
    });
    await ctx.runMutation(internal.notifications.dispatch, {
      userId: slot.controllerId,
      category: "kyc",
      title: "Nouvel entretien Niveau 3 planifié",
      body: `Un citoyen a réservé le créneau du ${formatted}.`,
      metadata: {
        level3VerificationId: verification._id,
        scheduledAt: slot.startsAt,
      },
      sendEmail: true,
      pushUrl: "/queue",
    });

    const reminderAt = slot.startsAt - LEVEL3_REMINDER_LEAD_MS;
    if (reminderAt > now + 60_000) {
      await ctx.scheduler.runAt(
        reminderAt,
        internal.level3.scheduling.sendReminder,
        {
          verificationId: verification._id,
          expectedScheduledAt: slot.startsAt,
        },
      );
    }
    return null;
  },
});

/** Rappel idempotent, également utilisé par le cron de rattrapage. */
export const sendReminder = internalMutation({
  args: {
    verificationId: v.id("level3Verification"),
    expectedScheduledAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const verification = await ctx.db.get(args.verificationId);
    if (
      !verification ||
      verification.status !== "claimed" ||
      verification.scheduledAt !== args.expectedScheduledAt ||
      verification.reminderSentAt !== undefined
    ) {
      return null;
    }
    await ctx.db.patch(verification._id, { reminderSentAt: Date.now() });
    const formatted = formatLibrevilleAppointment(args.expectedScheduledAt);
    await ctx.runMutation(internal.notifications.dispatch, {
      userId: verification.userId,
      category: "kyc",
      title: "Rappel : votre entretien Niveau 3 est demain",
      body: `Préparez votre pièce d'identité. Votre entretien est prévu ${formatted} (heure de Libreville).`,
      metadata: {
        level3VerificationId: verification._id,
        scheduledAt: args.expectedScheduledAt,
      },
      sendEmail: true,
      pushUrl: "/kyc?target=3",
    });
    if (verification.controllerId) {
      await ctx.runMutation(internal.notifications.dispatch, {
        userId: verification.controllerId,
        category: "kyc",
        title: "Rappel : entretien Niveau 3 demain",
        body: `Votre entretien est prévu ${formatted} (heure de Libreville).`,
        metadata: {
          level3VerificationId: verification._id,
          scheduledAt: args.expectedScheduledAt,
        },
        sendEmail: true,
        pushUrl: "/queue",
      });
    }
    return null;
  },
});

/** Filet de sécurité pour les rappels dont un job planifié aurait été manqué. */
export const dispatchDueReminders = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("level3Verification")
      .withIndex("by_status_and_scheduledAt", (q) =>
        q
          .eq("status", "claimed")
          .gte("scheduledAt", now + LEVEL3_REMINDER_LEAD_MS - 30 * 60 * 1000)
          .lte("scheduledAt", now + LEVEL3_REMINDER_LEAD_MS),
      )
      .take(100);
    let scheduled = 0;
    for (const row of rows) {
      if (row.scheduledAt === undefined || row.reminderSentAt !== undefined)
        continue;
      await ctx.scheduler.runAfter(0, internal.level3.scheduling.sendReminder, {
        verificationId: row._id,
        expectedScheduledAt: row.scheduledAt,
      });
      scheduled += 1;
    }
    return scheduled;
  },
});
