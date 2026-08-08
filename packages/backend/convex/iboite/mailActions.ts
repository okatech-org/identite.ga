"use node"

import { v } from "convex/values"

import { internal } from "../_generated/api"
import { internalAction } from "../_generated/server"

const MAX_ATTEMPTS = 5

function bridgeConfig() {
  const baseUrl = process.env.MAIL_BRIDGE_URL?.replace(/\/+$/, "")
  const token = process.env.MAIL_BRIDGE_TOKEN
  if (!baseUrl || !token) {
    throw new Error(
      "MAIL_BRIDGE_URL et MAIL_BRIDGE_TOKEN doivent être configurés",
    )
  }
  return { baseUrl, token }
}

async function callBridge(path: string, body: unknown) {
  const { baseUrl, token } = bridgeConfig()
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Mail bridge ${response.status}: ${await response.text()}`)
  }
  return (await response.json()) as Record<string, unknown>
}

function errorMessage(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 1000)
}

export const provisionMailbox = internalAction({
  args: { accountId: v.id("iboiteAccount"), attempt: v.optional(v.number()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const attempt = args.attempt ?? 1
    const account = await ctx.runQuery(
      internal.iboite.mailInternal.getAccountForProvisioning,
      { accountId: args.accountId },
    )
    if (!account) return null
    try {
      await callBridge("/provision", {
        email: account.email,
        displayName: account.displayName,
      })
      await ctx.runMutation(internal.iboite.mailInternal.markProvisioning, {
        accountId: args.accountId,
        status: "provisioned",
      })
    } catch (error) {
      await ctx.runMutation(internal.iboite.mailInternal.markProvisioning, {
        accountId: args.accountId,
        status: attempt >= MAX_ATTEMPTS ? "failed" : "pending",
        error: errorMessage(error),
      })
      if (attempt < MAX_ATTEMPTS) {
        await ctx.scheduler.runAfter(
          Math.min(60_000 * 2 ** (attempt - 1), 15 * 60_000),
          internal.iboite.mailActions.provisionMailbox,
          { accountId: args.accountId, attempt: attempt + 1 },
        )
      }
    }
    return null
  },
})

export const deliverOutbound = internalAction({
  args: { messageId: v.id("iboiteMessage"), attempt: v.optional(v.number()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const attempt = args.attempt ?? 1
    const outbound = await ctx.runQuery(
      internal.iboite.mailInternal.getOutbound,
      { messageId: args.messageId },
    )
    if (!outbound || outbound.message.deliveryStatus === "sent") return null

    try {
      const attachments = await Promise.all(
        outbound.attachments.map(async (attachment: any) => {
          const blob = await ctx.storage.get(attachment.storageRef)
          if (!blob)
            throw new Error(`Pièce jointe ${attachment.name} introuvable`)
          return {
            filename: attachment.name,
            contentType: attachment.mimeType,
            contentBase64: Buffer.from(await blob.arrayBuffer()).toString(
              "base64",
            ),
          }
        }),
      )
      const messageId = `<iboite-${args.messageId}@idn.ga>`
      const result = await callBridge("/send", {
        idempotencyKey: `iboite:${args.messageId}`,
        messageId,
        from: {
          name: outbound.message.senderName,
          email: outbound.message.senderEmail,
        },
        to: {
          name: outbound.message.recipientName,
          email: outbound.message.recipientEmail,
        },
        subject: outbound.message.subject,
        text: outbound.message.body,
        attachments,
      })
      await ctx.runMutation(internal.iboite.mailInternal.markOutbound, {
        messageId: args.messageId,
        status: "sent",
        attempts: attempt,
        externalMessageId: String(result.messageId ?? messageId),
      })
    } catch (error) {
      const failed = attempt >= MAX_ATTEMPTS
      await ctx.runMutation(internal.iboite.mailInternal.markOutbound, {
        messageId: args.messageId,
        status: failed ? "failed" : "queued",
        attempts: attempt,
        error: errorMessage(error),
      })
      if (!failed) {
        await ctx.scheduler.runAfter(
          Math.min(60_000 * 2 ** (attempt - 1), 15 * 60_000),
          internal.iboite.mailActions.deliverOutbound,
          { messageId: args.messageId, attempt: attempt + 1 },
        )
      }
    }
    return null
  },
})

export const backfillMailboxes = internalAction({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    limit: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const page = await ctx.runQuery(
      internal.iboite.mailInternal.listAccountsForProvisioning,
      { cursor: args.cursor ?? null, limit: args.limit ?? 50 },
    )
    for (const accountId of page.ids) {
      await ctx.scheduler.runAfter(
        0,
        internal.iboite.mailActions.provisionMailbox,
        { accountId },
      )
    }
    if (!page.done) {
      await ctx.scheduler.runAfter(
        1_000,
        internal.iboite.mailActions.backfillMailboxes,
        { cursor: page.cursor, limit: args.limit ?? 50 },
      )
    }
    return null
  },
})

export async function sendThroughBridge(payload: Record<string, unknown>) {
  return await callBridge("/send", payload)
}
