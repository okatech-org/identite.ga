"use node";

import webpush from "web-push";
import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

export const notification = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  returns: v.object({ sent: v.number(), stale: v.number() }),
  handler: async (ctx, args) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    if (!publicKey || !privateKey) return { sent: 0, stale: 0 };

    webpush.setVapidDetails(
      "mailto:support@identite.ga",
      publicKey,
      privateKey,
    );
    const subscriptions = await ctx.runQuery(
      internal.pushSubscriptions.listForDelivery,
      { userId: args.userId },
    );
    let sent = 0;
    let stale = 0;
    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.url ?? "/dashboard",
    });

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            payload,
            { TTL: 24 * 60 * 60, urgency: "high" },
          );
          sent += 1;
        } catch (error) {
          const statusCode =
            typeof error === "object" && error && "statusCode" in error
              ? Number(error.statusCode)
              : 0;
          if (statusCode === 404 || statusCode === 410) {
            stale += 1;
            await ctx.runMutation(internal.pushSubscriptions.deleteStale, {
              subscriptionId: subscription._id,
              endpoint: subscription.endpoint,
            });
          } else {
            console.warn("[web-push] envoi impossible", { statusCode });
          }
        }
      }),
    );
    return { sent, stale };
  },
});
