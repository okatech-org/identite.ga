import { v } from "convex/values"

import { internalAction } from "../_generated/server"
import { sendGenericEmail, sendKycEmail, sendOtpEmail } from "./provider"

/**
 * Wrappers `internalAction` autour des fonctions d'envoi email.
 *
 * `@react-email/render` utilise `await import("react-dom/server.edge")`,
 * un import dynamique non supporté par le runtime V8 isolate des
 * `mutation` Convex. Le rendu doit donc se faire depuis une `action`
 * (runtime Node) — les mutations planifient ces actions via
 * `ctx.scheduler.runAfter(0, internal.email.dispatch.xxx, {...})`.
 */

export const sendKyc = internalAction({
  args: {
    to: v.string(),
    kind: v.union(
      v.literal("complement_requested"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("complement_provided"),
    ),
    recipientName: v.union(v.string(), v.null()),
    detail: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await sendKycEmail(ctx as never, args)
    return null
  },
})

export const sendGeneric = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    title: v.string(),
    body: v.string(),
    recipientName: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await sendGenericEmail(ctx as never, args)
    return null
  },
})

export const sendOtp = internalAction({
  args: {
    to: v.string(),
    code: v.string(),
    type: v.union(
      v.literal("sign-in"),
      v.literal("email-verification"),
      v.literal("forget-password"),
      v.literal("change-email"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await sendOtpEmail(ctx as never, args)
    return null
  },
})
