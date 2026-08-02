/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test, vi } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("/convex/**/*.ts");

vi.mock("./lib/auth", async () => {
  const { ConvexError } = await import("convex/values");
  return {
    requireAuth: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
    }) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new ConvexError({
          code: "UNAUTHENTICATED",
          message: "Connexion requise.",
        });
      }
      return { userId: identity.subject, roles: [], emailVerified: true };
    },
  };
});

const subscription = {
  endpoint: "https://push.example.test/subscriptions/device-1",
  p256dh: "p256dh-key-long-enough-for-validation",
  auth: "auth-key-long-enough",
  userAgent: "Test Browser",
};

describe("abonnements Web Push", () => {
  test("enregistre et expose uniquement les appareils du citoyen courant", async () => {
    const t = convexTest(schema, modules);
    process.env.VAPID_PUBLIC_KEY = "public-test-key";
    process.env.VAPID_PRIVATE_KEY = "private-test-key";
    const user = t.withIdentity({ subject: "citizen_push" });
    await user.mutation(api.pushSubscriptions.subscribe, subscription);

    expect(
      await user.query(api.pushSubscriptions.getMyStatus, {}),
    ).toMatchObject({
      enabled: true,
      subscriptionCount: 1,
      configured: true,
    });
    expect(
      await t.query(internal.pushSubscriptions.listForDelivery, {
        userId: "citizen_push",
      }),
    ).toHaveLength(1);
  });

  test("un appareil réattribué ne reçoit plus les notifications de l'ancien compte", async () => {
    const t = convexTest(schema, modules);
    const first = t.withIdentity({ subject: "citizen_first" });
    const second = t.withIdentity({ subject: "citizen_second" });
    await first.mutation(api.pushSubscriptions.subscribe, subscription);
    await second.mutation(api.pushSubscriptions.subscribe, {
      ...subscription,
      p256dh: "second-p256dh-key-long-enough",
    });

    expect(
      (await first.query(api.pushSubscriptions.getMyStatus, {}))
        .subscriptionCount,
    ).toBe(0);
    expect(
      (await second.query(api.pushSubscriptions.getMyStatus, {}))
        .subscriptionCount,
    ).toBe(1);
  });

  test("la désactivation ne supprime que l'abonnement du propriétaire", async () => {
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ subject: "citizen_owner" });
    const stranger = t.withIdentity({ subject: "citizen_stranger" });
    await owner.mutation(api.pushSubscriptions.subscribe, subscription);
    await stranger.mutation(api.pushSubscriptions.unsubscribe, {
      endpoint: subscription.endpoint,
    });
    expect(
      (await owner.query(api.pushSubscriptions.getMyStatus, {}))
        .subscriptionCount,
    ).toBe(1);
    await owner.mutation(api.pushSubscriptions.unsubscribe, {
      endpoint: subscription.endpoint,
    });
    expect(
      (await owner.query(api.pushSubscriptions.getMyStatus, {}))
        .subscriptionCount,
    ).toBe(0);
  });
});
