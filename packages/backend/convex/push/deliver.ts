"use node"

import webpush from "web-push"
import { v } from "convex/values"

import { internal } from "../_generated/api"
import type { Id } from "../_generated/dataModel"
import { internalAction } from "../_generated/server"

type WebPushSubscription = {
  _id: Id<"pushSubscription">
  endpoint: string
  p256dh: string
  auth: string
}

type NativePushSubscription = {
  _id: Id<"nativePushSubscription">
  token: string
}

export const notification = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  returns: v.object({ sent: v.number(), stale: v.number() }),
  handler: async (ctx, args) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim()
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
    let sent = 0
    let stale = 0

    if (publicKey && privateKey) {
      webpush.setVapidDetails(
        "mailto:support@identite.ga",
        publicKey,
        privateKey,
      )
      const subscriptions: WebPushSubscription[] = await ctx.runQuery(
        internal.pushSubscriptions.listForDelivery,
        { userId: args.userId },
      )
      const payload = JSON.stringify({
        title: args.title,
        body: args.body,
        url: args.url ?? "/dashboard",
      })

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
            )
            sent += 1
          } catch (error) {
            const statusCode =
              typeof error === "object" && error && "statusCode" in error
                ? Number(error.statusCode)
                : 0
            if (statusCode === 404 || statusCode === 410) {
              stale += 1
              await ctx.runMutation(internal.pushSubscriptions.deleteStale, {
                subscriptionId: subscription._id,
                endpoint: subscription.endpoint,
              })
            } else {
              console.warn("[web-push] envoi impossible", { statusCode })
            }
          }
        }),
      )
    }

    const nativeSubscriptions: NativePushSubscription[] = await ctx.runQuery(
      internal.nativePushSubscriptions.listForDelivery,
      { userId: args.userId },
    )
    if (nativeSubscriptions.length > 0) {
      try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            accept: "application/json",
            "accept-encoding": "gzip, deflate",
            "content-type": "application/json",
          },
          body: JSON.stringify(
            nativeSubscriptions.map((subscription) => ({
              to: subscription.token,
              title: args.title,
              body: args.body,
              data: { url: args.url ?? "/notifications" },
              sound: "default",
              priority: "high",
              channelId: "messages",
            })),
          ),
        })
        if (!response.ok) {
          console.warn("[expo-push] envoi impossible", {
            statusCode: response.status,
          })
        } else {
          const json = (await response.json()) as {
            data?: Array<{ status?: string; details?: { error?: string } }>
          }
          for (let index = 0; index < nativeSubscriptions.length; index += 1) {
            const subscription = nativeSubscriptions[index]
            const ticket = json.data?.[index]
            if (!subscription) continue
            if (ticket?.status === "ok") {
              sent += 1
            } else if (ticket?.details?.error === "DeviceNotRegistered") {
              stale += 1
              await ctx.runMutation(
                internal.nativePushSubscriptions.deleteStale,
                {
                  subscriptionId: subscription._id,
                  token: subscription.token,
                },
              )
            }
          }
        }
      } catch (error) {
        console.warn("[expo-push] envoi impossible", {
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    return { sent, stale }
  },
})
