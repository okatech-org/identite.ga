import { v } from "convex/values"

import { internal } from "../_generated/api"
import type { Id } from "../_generated/dataModel"
import { internalMutation, internalQuery } from "../_generated/server"

const ATTACHMENT_INPUT = v.object({
  name: v.string(),
  size: v.number(),
  mimeType: v.string(),
  storageRef: v.id("_storage"),
})

export const getAccountForProvisioning = internalQuery({
  args: { accountId: v.id("iboiteAccount") },
  returns: v.union(
    v.object({ email: v.string(), displayName: v.string() }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account) return null
    return { email: account.emailAlias, displayName: account.label }
  },
})

export const resolveInboundRecipients = internalQuery({
  args: { emails: v.array(v.string()), providerMessageId: v.string() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const found: string[] = []
    for (const email of Array.from(new Set(args.emails)).slice(0, 50)) {
      const account = await ctx.db
        .query("iboiteAccount")
        .withIndex("by_emailAlias", (q) => q.eq("emailAlias", email))
        .unique()
      if (!account) continue
      const receipt = await ctx.db
        .query("iboiteInboundReceipt")
        .withIndex("by_provider_recipient", (q) =>
          q
            .eq("providerMessageId", args.providerMessageId)
            .eq("recipientEmail", email),
        )
        .unique()
      if (!receipt) found.push(email)
    }
    return found
  },
})

export const markProvisioning = internalMutation({
  args: {
    accountId: v.id("iboiteAccount"),
    status: v.union(
      v.literal("pending"),
      v.literal("provisioned"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId)
    if (!account) return null
    await ctx.db.patch(account._id, {
      mailboxStatus: args.status,
      mailboxProvisionedAt:
        args.status === "provisioned"
          ? Date.now()
          : account.mailboxProvisionedAt,
      mailboxProvisioningError: args.error,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const listAccountsForProvisioning = internalQuery({
  args: { cursor: v.union(v.string(), v.null()), limit: v.number() },
  returns: v.object({
    ids: v.array(v.id("iboiteAccount")),
    cursor: v.string(),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db.query("iboiteAccount").paginate({
      cursor: args.cursor,
      numItems: Math.max(1, Math.min(100, Math.floor(args.limit))),
    })
    return {
      ids: page.page.map((account) => account._id),
      cursor: page.continueCursor,
      done: page.isDone,
    }
  },
})

export const getOutbound = internalQuery({
  args: { messageId: v.id("iboiteMessage") },
  returns: v.any(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)
    if (!message || message.folder !== "sent" || message.transport !== "smtp") {
      return null
    }
    const attachments = await ctx.db
      .query("iboiteMessageAttachment")
      .withIndex("by_message", (q) => q.eq("messageId", message._id))
      .collect()
    return { message, attachments }
  },
})

export const markOutbound = internalMutation({
  args: {
    messageId: v.id("iboiteMessage"),
    status: v.union(
      v.literal("queued"),
      v.literal("sent"),
      v.literal("failed"),
    ),
    attempts: v.number(),
    externalMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)
    if (!message) return null
    await ctx.db.patch(message._id, {
      deliveryStatus: args.status,
      deliveryAttempts: args.attempts,
      externalMessageId: args.externalMessageId,
      deliveryError: args.error,
    })
    return null
  },
})

export const persistInbound = internalMutation({
  args: {
    providerMessageId: v.string(),
    fromName: v.string(),
    fromEmail: v.string(),
    recipientEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    inReplyTo: v.optional(v.string()),
    receivedAt: v.number(),
    attachments: v.array(ATTACHMENT_INPUT),
  },
  returns: v.union(v.id("iboiteMessage"), v.null()),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("iboiteInboundReceipt")
      .withIndex("by_provider_recipient", (q) =>
        q
          .eq("providerMessageId", args.providerMessageId)
          .eq("recipientEmail", args.recipientEmail),
      )
      .unique()
    if (existing) return existing.messageId

    const account = await ctx.db
      .query("iboiteAccount")
      .withIndex("by_emailAlias", (q) =>
        q.eq("emailAlias", args.recipientEmail),
      )
      .unique()
    if (!account) return null

    let threadId: string = crypto.randomUUID()
    if (args.inReplyTo) {
      const parent = await ctx.db
        .query("iboiteMessage")
        .withIndex("by_account_folder", (q) =>
          q.eq("accountId", account._id).eq("folder", "sent"),
        )
        .order("desc")
        .take(100)
      const matching = parent.find(
        (message) => message.externalMessageId === args.inReplyTo,
      )
      if (matching) threadId = matching.threadId
    }

    const body = args.body.trim() || "(Message sans contenu texte)"
    const flat = body.replace(/\s+/g, " ").trim()
    const messageId = await ctx.db.insert("iboiteMessage", {
      accountId: account._id,
      userId: account.userId,
      threadId,
      senderKind: "citizen",
      senderName: args.fromName.trim() || args.fromEmail,
      senderEmail: args.fromEmail,
      recipientName: account.label,
      recipientEmail: args.recipientEmail,
      subject: args.subject.trim() || "(Sans objet)",
      preview: flat.length <= 150 ? flat : `${flat.slice(0, 149)}…`,
      body,
      folder: "inbox",
      isRead: false,
      isStarred: false,
      hasAttachment: args.attachments.length > 0,
      transport: "smtp",
      deliveryStatus: "sent",
      externalMessageId: args.providerMessageId,
      createdAt: args.receivedAt,
    })

    for (const attachment of args.attachments) {
      await ctx.db.insert("iboiteMessageAttachment", {
        messageId,
        ...attachment,
      })
    }
    await ctx.db.insert("iboiteInboundReceipt", {
      providerMessageId: args.providerMessageId,
      recipientEmail: args.recipientEmail,
      messageId,
      receivedAt: Date.now(),
    })
    await ctx.db.patch(account._id, {
      counters: {
        ...account.counters,
        unreadMessages: account.counters.unreadMessages + 1,
      },
      updatedAt: Date.now(),
    })
    await ctx.runMutation(internal.notifications.dispatch, {
      userId: account.userId,
      category: "documents",
      title: `Nouvel email de ${args.fromName.trim() || args.fromEmail}`,
      body: `${args.subject.trim() || "(Sans objet)"}\n\n${flat.slice(0, 200)}`,
      metadata: {
        module: "iboite",
        kind: "message",
        messageId,
      },
    })
    return messageId
  },
})

export type StoredAttachment = {
  name: string
  size: number
  mimeType: string
  storageRef: Id<"_storage">
}
