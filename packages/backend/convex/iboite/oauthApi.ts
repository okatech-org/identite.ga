import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { internalMutation, internalQuery } from "../_generated/server"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { authComponent } from "../auth"
import { rateLimiter } from "../rateLimiter"
import { updateAccountCounters } from "./accountSync"
import { loadAccountByEmailAlias } from "./accounts"

const IBOITE_DOMAIN = "idn.ga"
const MAX_ATTACHMENTS = 10

const RESOURCE = v.union(
  v.literal("account"),
  v.literal("letters"),
  v.literal("packages"),
  v.literal("messages"),
)
const FOLDER = v.union(
  v.literal("inbox"),
  v.literal("sent"),
  v.literal("pending"),
  v.literal("trash"),
)

const preview = (body: string): string => {
  const flat = body.replace(/\s+/g, " ").trim()
  return flat.length <= 150 ? flat : `${flat.slice(0, 149)}…`
}

async function personalAccount(
  ctx: Pick<QueryCtx | MutationCtx, "db">,
  userId: string,
) {
  return await ctx.db
    .query("iboiteAccount")
    .withIndex("by_userId_type", (q) =>
      q.eq("userId", userId).eq("type", "personal"),
    )
    .unique()
}

/** Sérialise une ressource OAuth après contrôle d'ownership. */
export const readResource = internalQuery({
  args: {
    userId: v.string(),
    resource: RESOURCE,
    folder: v.optional(FOLDER),
    itemId: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const account = await personalAccount(ctx, args.userId)
    if (!account) return JSON.stringify({ account: null, items: [] })
    const accountVersion = account.syncVersion ?? 0
    if (args.resource === "account") {
      return JSON.stringify({
        accountVersion,
        account: {
          id: account._id,
          type: account.type,
          label: account.label,
          emailAlias: account.emailAlias,
          counters: account.counters,
        },
      })
    }

    if (args.resource === "letters") {
      const itemId = args.itemId
        ? ctx.db.normalizeId("iboiteLetter", args.itemId)
        : null
      if (args.itemId && !itemId) throw new ConvexError("INVALID_ID")
      const rows = itemId
        ? [await ctx.db.get(itemId)].filter(Boolean)
        : await ctx.db
            .query("iboiteLetter")
            .withIndex("by_user_folder", (q) =>
              q.eq("userId", args.userId).eq("folder", args.folder ?? "inbox"),
            )
            .order("desc")
            .take(100)
      const items = []
      for (const row of rows) {
        if (!row || row.userId !== args.userId) continue
        const attachments = await ctx.db
          .query("iboiteLetterAttachment")
          .withIndex("by_letter", (q) => q.eq("letterId", row._id))
          .take(20)
        items.push({
          ...row,
          attachments: await Promise.all(
            attachments.map(async (attachment) => ({
              id: attachment._id,
              name: attachment.name,
              size: attachment.size,
              mimeType: attachment.mimeType,
              url: await ctx.storage.getUrl(attachment.storageRef),
            })),
          ),
        })
      }
      return JSON.stringify({ accountVersion, items })
    }

    if (args.resource === "messages") {
      const itemId = args.itemId
        ? ctx.db.normalizeId("iboiteMessage", args.itemId)
        : null
      if (args.itemId && !itemId) throw new ConvexError("INVALID_ID")
      const folder =
        args.folder === "sent" || args.folder === "trash"
          ? args.folder
          : "inbox"
      const rows = itemId
        ? [await ctx.db.get(itemId)].filter(Boolean)
        : await ctx.db
            .query("iboiteMessage")
            .withIndex("by_user_folder", (q) =>
              q.eq("userId", args.userId).eq("folder", folder),
            )
            .order("desc")
            .take(100)
      const items = []
      for (const row of rows) {
        if (!row || row.userId !== args.userId) continue
        const attachments = await ctx.db
          .query("iboiteMessageAttachment")
          .withIndex("by_message", (q) => q.eq("messageId", row._id))
          .take(20)
        items.push({
          ...row,
          attachments: await Promise.all(
            attachments.map(async (attachment) => ({
              id: attachment._id,
              name: attachment.name,
              size: attachment.size,
              mimeType: attachment.mimeType,
              url: await ctx.storage.getUrl(attachment.storageRef),
            })),
          ),
        })
      }
      return JSON.stringify({ accountVersion, items })
    }

    const itemId = args.itemId
      ? ctx.db.normalizeId("iboitePackage", args.itemId)
      : null
    if (args.itemId && !itemId) throw new ConvexError("INVALID_ID")
    const statuses = ["available", "transit", "pending", "delivered"] as const
    const items = []
    if (itemId) {
      const row = await ctx.db.get(itemId)
      if (row?.userId === args.userId) items.push(row)
    } else {
      for (const status of statuses) {
        const rows = await ctx.db
          .query("iboitePackage")
          .withIndex("by_user_status", (q) =>
            q.eq("userId", args.userId).eq("status", status),
          )
          .order("desc")
          .take(50)
        items.push(...rows)
      }
      items.sort((a, b) => b.createdAt - a.createdAt)
    }
    return JSON.stringify({ accountVersion, items: items.slice(0, 100) })
  },
})

export const manageResource = internalMutation({
  args: {
    userId: v.string(),
    resource: v.union(
      v.literal("letter"),
      v.literal("message"),
      v.literal("package"),
    ),
    itemId: v.string(),
    action: v.union(
      v.literal("mark_read"),
      v.literal("move"),
      v.literal("star"),
      v.literal("picked_up"),
    ),
    folder: v.optional(FOLDER),
    starred: v.optional(v.boolean()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    if (args.resource === "letter") {
      const id = ctx.db.normalizeId("iboiteLetter", args.itemId)
      const row = id ? await ctx.db.get(id) : null
      if (!row || row.userId !== args.userId) throw new ConvexError("NOT_FOUND")
      const account = await ctx.db.get(row.accountId)
      if (!account) throw new ConvexError("ACCOUNT_NOT_FOUND")
      if (args.action === "mark_read" && !row.isRead) {
        await ctx.db.patch(row._id, { isRead: true })
        if (row.folder === "inbox") {
          await updateAccountCounters(ctx, account, {
            ...account.counters,
            unreadLetters: Math.max(0, account.counters.unreadLetters - 1),
          })
        }
      } else if (args.action === "move" && args.folder) {
        const counters = { ...account.counters }
        if (row.folder === "inbox" && !row.isRead) counters.unreadLetters--
        if (row.folder === "pending") counters.pendingLetters--
        if (args.folder === "inbox" && !row.isRead) counters.unreadLetters++
        if (args.folder === "pending") counters.pendingLetters++
        await ctx.db.patch(row._id, { folder: args.folder })
        await updateAccountCounters(ctx, account, {
          ...counters,
          unreadLetters: Math.max(0, counters.unreadLetters),
          pendingLetters: Math.max(0, counters.pendingLetters),
        })
      }
      return JSON.stringify({ ok: true })
    }

    if (args.resource === "message") {
      const id = ctx.db.normalizeId("iboiteMessage", args.itemId)
      const row = id ? await ctx.db.get(id) : null
      if (!row || row.userId !== args.userId) throw new ConvexError("NOT_FOUND")
      const account = await ctx.db.get(row.accountId)
      if (!account) throw new ConvexError("ACCOUNT_NOT_FOUND")
      if (args.action === "mark_read" && !row.isRead) {
        await ctx.db.patch(row._id, { isRead: true })
        if (row.folder === "inbox") {
          await updateAccountCounters(ctx, account, {
            ...account.counters,
            unreadMessages: Math.max(0, account.counters.unreadMessages - 1),
          })
        }
      } else if (args.action === "star") {
        await ctx.db.patch(row._id, {
          isStarred: args.starred ?? !row.isStarred,
        })
      } else if (args.action === "move" && args.folder) {
        const folder =
          args.folder === "trash"
            ? "trash"
            : args.folder === "sent"
              ? "sent"
              : "inbox"
        const counters = { ...account.counters }
        if (row.folder === "inbox" && !row.isRead) {
          counters.unreadMessages--
        }
        if (folder === "inbox" && row.folder !== "inbox" && !row.isRead) {
          counters.unreadMessages++
        }
        if (counters.unreadMessages !== account.counters.unreadMessages) {
          await updateAccountCounters(ctx, account, {
            ...counters,
            unreadMessages: Math.max(0, counters.unreadMessages),
          })
        }
        await ctx.db.patch(row._id, { folder })
      }
      return JSON.stringify({ ok: true })
    }

    const id = ctx.db.normalizeId("iboitePackage", args.itemId)
    const row = id ? await ctx.db.get(id) : null
    if (!row || row.userId !== args.userId) throw new ConvexError("NOT_FOUND")
    if (args.action === "picked_up" && row.status === "available") {
      const account = await ctx.db.get(row.accountId)
      await ctx.db.patch(row._id, {
        status: "delivered",
        pickedUpAt: Date.now(),
      })
      if (account) {
        await updateAccountCounters(ctx, account, {
          ...account.counters,
          availablePackages: Math.max(
            0,
            account.counters.availablePackages - 1,
          ),
        })
      }
    }
    return JSON.stringify({ ok: true })
  },
})

const ATTACHMENT = v.object({
  name: v.string(),
  size: v.number(),
  storageRef: v.id("_storage"),
  mimeType: v.string(),
})

export const generateUploadUrl = internalMutation({
  args: { userId: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const account = await personalAccount(ctx, args.userId)
    if (!account) throw new ConvexError("ACCOUNT_NOT_FOUND")
    return await ctx.storage.generateUploadUrl()
  },
})

export const sendMessage = internalMutation({
  args: {
    userId: v.string(),
    recipientName: v.string(),
    recipientEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    inReplyTo: v.optional(v.id("iboiteMessage")),
    attachments: v.optional(v.array(ATTACHMENT)),
  },
  returns: v.id("iboiteMessage"),
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, "messageSend", {
      key: args.userId,
      throws: true,
    })
    const account = await personalAccount(ctx, args.userId)
    if (!account) throw new ConvexError("ACCOUNT_NOT_FOUND")
    const subject = args.subject.trim()
    const body = args.body.trim()
    if (!subject || !body) throw new ConvexError("SUBJECT_AND_BODY_REQUIRED")
    if ((args.attachments?.length ?? 0) > MAX_ATTACHMENTS)
      throw new ConvexError("TOO_MANY_ATTACHMENTS")
    const rawTo = args.recipientEmail.trim().toLowerCase()
    const recipientEmail = rawTo.includes("@")
      ? rawTo
      : `${rawTo}@${IBOITE_DOMAIN}`
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail))
      throw new ConvexError("INVALID_EMAIL")
    const internalRecipient = recipientEmail.endsWith(`@${IBOITE_DOMAIN}`)
      ? await loadAccountByEmailAlias(ctx, recipientEmail)
      : null
    if (recipientEmail.endsWith(`@${IBOITE_DOMAIN}`) && !internalRecipient)
      throw new ConvexError("RECIPIENT_UNKNOWN")
    let threadId: string = crypto.randomUUID()
    if (args.inReplyTo) {
      const original = await ctx.db.get(args.inReplyTo)
      if (!original || original.userId !== args.userId)
        throw new ConvexError("NOT_FOUND")
      threadId = original.threadId
    }
    const authUser = await authComponent.getAnyUserById(ctx, args.userId)
    const senderName =
      (authUser as { name?: string } | null)?.name ?? account.label
    const now = Date.now()
    const hasAttachment = (args.attachments?.length ?? 0) > 0
    const sentId = await ctx.db.insert("iboiteMessage", {
      accountId: account._id,
      userId: args.userId,
      threadId,
      senderKind: "citizen",
      senderName,
      senderEmail: account.emailAlias,
      recipientName:
        (internalRecipient?.label ?? args.recipientName.trim()) ||
        recipientEmail,
      recipientEmail,
      subject,
      preview: preview(body),
      body,
      folder: "sent",
      isRead: true,
      isStarred: false,
      hasAttachment,
      inReplyTo: args.inReplyTo,
      transport: internalRecipient ? "internal" : "smtp",
      deliveryStatus: internalRecipient ? "sent" : "queued",
      deliveryAttempts: 0,
      createdAt: now,
    })
    for (const attachment of args.attachments ?? []) {
      await ctx.db.insert("iboiteMessageAttachment", {
        messageId: sentId,
        ...attachment,
      })
    }
    if (!internalRecipient) {
      if (process.env.NODE_ENV !== "test") {
        await ctx.scheduler.runAfter(
          0,
          internal.iboite.mailActions.deliverOutbound,
          { messageId: sentId },
        )
      }
      return sentId
    }
    const inboxId = await ctx.db.insert("iboiteMessage", {
      accountId: internalRecipient._id,
      userId: internalRecipient.userId,
      threadId,
      senderKind: "citizen",
      senderName,
      senderEmail: account.emailAlias,
      recipientName: internalRecipient.label,
      recipientEmail,
      subject,
      preview: preview(body),
      body,
      folder: "inbox",
      isRead: false,
      isStarred: false,
      hasAttachment,
      transport: "internal",
      deliveryStatus: "sent",
      createdAt: now,
    })
    for (const attachment of args.attachments ?? []) {
      await ctx.db.insert("iboiteMessageAttachment", {
        messageId: inboxId,
        ...attachment,
      })
    }
    await updateAccountCounters(
      ctx,
      internalRecipient,
      {
        ...internalRecipient.counters,
        unreadMessages: internalRecipient.counters.unreadMessages + 1,
      },
      now,
    )
    await ctx.runMutation(internal.notifications.dispatch, {
      userId: internalRecipient.userId,
      category: "documents",
      title: `Nouveau message de ${senderName}`,
      body: `${subject}\n\n${preview(body)}`,
      metadata: { module: "iboite", kind: "message", messageId: inboxId },
    })
    return sentId
  },
})

/** Dépôt M2M idempotent d'un courrier administratif officiel. */
export const depositOfficialLetter = internalMutation({
  args: {
    appClientId: v.string(),
    recipientSub: v.string(),
    idempotencyKey: v.string(),
    senderName: v.string(),
    senderAddress: v.string(),
    subject: v.string(),
    body: v.string(),
  },
  returns: v.id("iboiteLetter"),
  handler: async (ctx, args) => {
    const partnerDeliveryKey = `${args.appClientId}:${args.idempotencyKey}`
    const existing = await ctx.db
      .query("iboiteLetter")
      .withIndex("by_partnerDeliveryKey", (q) =>
        q.eq("partnerDeliveryKey", partnerDeliveryKey),
      )
      .unique()
    if (existing) return existing._id
    const account = await personalAccount(ctx, args.recipientSub)
    if (!account) throw new ConvexError("ACCOUNT_NOT_FOUND")
    const now = Date.now()
    const id = await ctx.db.insert("iboiteLetter", {
      accountId: account._id,
      userId: args.recipientSub,
      folder: "inbox",
      senderName: args.senderName.trim(),
      senderAddress: args.senderAddress.trim(),
      recipientName: account.label,
      recipientAddress: account.addressLine ?? account.city,
      subject: args.subject.trim(),
      body: args.body,
      type: "informational",
      stampColor: "green",
      isRead: false,
      partnerDeliveryKey,
      createdAt: now,
    })
    await updateAccountCounters(
      ctx,
      account,
      {
        ...account.counters,
        unreadLetters: account.counters.unreadLetters + 1,
      },
      now,
    )
    return id
  },
})
