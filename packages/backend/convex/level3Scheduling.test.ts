/// <reference types="vite/client" />
import { register as registerAggregate } from "@convex-dev/aggregate/test";
import { ConvexError } from "convex/values";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("/convex/**/*.ts");

vi.mock("./lib/auth", async () => {
  const { ConvexError: CE } = await import("convex/values");
  const authUser = async (ctx: {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
  }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new CE({ code: "UNAUTHENTICATED", message: "Connexion requise." });
    return {
      userId: identity.subject,
      email: `${identity.subject}@example.ga`,
      emailVerified: true,
      roles: identity.subject.startsWith("controller_")
        ? ["identity_controller"]
        : [],
    };
  };
  return {
    requireAuth: authUser,
    requireVerifiedAuth: authUser,
    requireController: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
    }) => {
      const user = await authUser(ctx);
      if (!user.roles.includes("identity_controller")) {
        throw new CE({ code: "FORBIDDEN", message: "Accès refusé." });
      }
      return user;
    },
  };
});

function makeTestClient() {
  const t = convexTest(schema, modules);
  registerAggregate(t, "kycByStatus");
  registerAggregate(t, "usersByLoa");
  registerAggregate(t, "usersByProfile");
  return t;
}

async function seedProfile(
  t: ReturnType<typeof convexTest>,
  userId: string,
  loa: 1 | 2 | 3,
) {
  const now = Date.now();
  await t.run(async (ctx) => {
    await ctx.db.insert("userProfile", {
      userId,
      profileType: "citizen",
      loa,
      pivot: {
        firstName: userId.startsWith("controller_") ? "Agent" : "Ariane",
        lastName: userId.startsWith("controller_") ? "Moussavou" : "Nziengui",
        dateOfBirth: "1990-01-01",
        gender: "F",
        birthPlace: "Libreville",
        nationality: "GA",
      },
      createdAt: now,
      updatedAt: now,
    } as any);
    await ctx.db.insert("notificationPreference", {
      userId,
      email: { security: true, kyc: false, consent: true, comms: true },
      inApp: { security: true, kyc: true, consent: true, comms: true },
      updatedAt: now,
    } as any);
  });
}

async function prepareAppointment() {
  const t = makeTestClient();
  await seedProfile(t, "citizen_schedule", 2);
  await seedProfile(t, "controller_schedule", 2);
  const citizen = t.withIdentity({ subject: "citizen_schedule" });
  const controller = t.withIdentity({ subject: "controller_schedule" });
  const { verificationId } = await citizen.mutation(api.level3.start, {});
  const startsAt = Date.now() + 48 * 60 * 60 * 1000;
  await controller.mutation(api.level3.scheduling.createAvailability, {
    startsAt,
    endsAt: startsAt + 60 * 60 * 1000,
    durationMinutes: 30,
  });
  const slots = await citizen.query(api.level3.scheduling.listAvailable, {});
  return { t, citizen, controller, verificationId, startsAt, slots };
}

beforeEach(() => {
  process.env.LIVEKIT_URL = "wss://video.identite.ga";
  process.env.LIVEKIT_API_KEY = "test-api-key";
  process.env.LIVEKIT_API_SECRET = "test-api-secret-at-least-32-characters";
  process.env.LIVEKIT_AUTOSUSPEND_ENABLED = "false";
});

describe("agenda Niveau 3", () => {
  test("un contrôleur publie une plage découpée et visible du citoyen", async () => {
    const { slots, startsAt } = await prepareAppointment();
    expect(slots).toHaveLength(2);
    expect(slots[0]).toMatchObject({
      startsAt,
      controllerName: "Agent Moussavou",
    });
  });

  test("la réservation assigne le contrôleur et notifie les deux participants", async () => {
    const { t, citizen, verificationId, slots, startsAt } =
      await prepareAppointment();
    await citizen.mutation(api.level3.scheduling.book, {
      verificationId,
      slotId: slots[0]!._id,
    });

    const verification = await t.run((ctx) =>
      ctx.db.get(verificationId as Id<"level3Verification">),
    );
    const slot = await t.run((ctx) =>
      ctx.db.get(slots[0]!._id as Id<"level3AppointmentSlot">),
    );
    const notifications = await t.run((ctx) =>
      ctx.db
        .query("notification")
        .withIndex("by_category", (q) => q.eq("category", "kyc"))
        .take(20),
    );
    expect(verification).toMatchObject({
      status: "claimed",
      controllerId: "controller_schedule",
      scheduledAt: startsAt,
    });
    expect(slot).toMatchObject({
      status: "booked",
      bookedUserId: "citizen_schedule",
    });
    expect(
      notifications.filter(
        (row) =>
          row.title.includes("planifié") || row.title.includes("confirmé"),
      ),
    ).toHaveLength(2);
  });

  test("un créneau ne peut pas être réservé deux fois", async () => {
    const { t, citizen, verificationId, slots } = await prepareAppointment();
    await seedProfile(t, "citizen_second", 2);
    const second = t.withIdentity({ subject: "citizen_second" });
    const secondVerification = await second.mutation(api.level3.start, {});
    await citizen.mutation(api.level3.scheduling.book, {
      verificationId,
      slotId: slots[0]!._id,
    });
    await expect(
      second.mutation(api.level3.scheduling.book, {
        verificationId: secondVerification.verificationId,
        slotId: slots[0]!._id,
      }),
    ).rejects.toThrow(ConvexError);
  });

  test("la salle reste fermée avant la fenêtre du rendez-vous", async () => {
    const { citizen, verificationId, slots } = await prepareAppointment();
    await citizen.mutation(api.level3.scheduling.book, {
      verificationId,
      slotId: slots[0]!._id,
    });
    await expect(
      citizen.action(api.level3.livekit.issueJoinToken, { verificationId }),
    ).rejects.toThrow(ConvexError);
  });

  test("le rappel de la veille est idempotent", async () => {
    const { t, citizen, verificationId, slots, startsAt } =
      await prepareAppointment();
    await citizen.mutation(api.level3.scheduling.book, {
      verificationId,
      slotId: slots[0]!._id,
    });
    await t.mutation(internal.level3.scheduling.sendReminder, {
      verificationId,
      expectedScheduledAt: startsAt,
    });
    await t.mutation(internal.level3.scheduling.sendReminder, {
      verificationId,
      expectedScheduledAt: startsAt,
    });
    const reminders = await t.run(async (ctx) => {
      const rows = await ctx.db
        .query("notification")
        .withIndex("by_userId", (q) => q.eq("userId", "citizen_schedule"))
        .take(20);
      return rows.filter((row) => row.title.startsWith("Rappel"));
    });
    expect(reminders).toHaveLength(1);
  });

  test("annuler la demande libère le créneau", async () => {
    const { t, citizen, verificationId, slots } = await prepareAppointment();
    await citizen.mutation(api.level3.scheduling.book, {
      verificationId,
      slotId: slots[0]!._id,
    });
    await citizen.mutation(api.level3.cancel, { verificationId });
    const slot = await t.run((ctx) =>
      ctx.db.get(slots[0]!._id as Id<"level3AppointmentSlot">),
    );
    expect(slot).toMatchObject({ status: "available" });
    expect(slot?.verificationId).toBeUndefined();
  });
});
