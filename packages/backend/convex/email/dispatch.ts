import { v } from "convex/values"

import { internalAction } from "../_generated/server"
import { sendGenericEmail, sendKycEmail, sendOtpEmail } from "./provider"

/**
 * Wrappers `internalAction` autour des fonctions d'envoi email.
 *
 * Le rendu React Email et l'appel HTTPS au bridge mail s'exécutent depuis
 * une action Node. Les mutations planifient ces actions via
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
      v.literal("under_review"),
    ),
    recipientName: v.union(v.string(), v.null()),
    detail: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await sendKycEmail(args)
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
    await sendGenericEmail(args)
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
    await sendOtpEmail(args)
    return null
  },
})
;("use node")
