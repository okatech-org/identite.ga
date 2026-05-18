import { ConvexError, v } from "convex/values"
import { paginationOptsValidator } from "convex/server"

import { mutation, query } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { requireAuth } from "../lib/auth"
import { loadOwnedAccount } from "./accounts"

/**
 * iBoîte — Courriers physiques numérisés.
 * Cf. SPECS_FEATURES_CITIZEN.md §2.5 + §2.9.1.
 *
 * Côté citoyen : lecture, marquage lu, déplacement (« À traiter » /
 * Poubelle / restauration). La création est faite par les opérateurs via
 * `iboite/admin.dropLetter` (cf. iboite/admin.ts).
 */

const FOLDER = v.union(
  v.literal("inbox"),
  v.literal("sent"),
  v.literal("pending"),
  v.literal("trash"),
)
const LETTER_TYPE = v.union(
  v.literal("action_required"),
  v.literal("informational"),
  v.literal("standard"),
)
const STAMP = v.union(v.literal("red"), v.literal("blue"), v.literal("green"))

const ATTACHMENT_OUT = v.object({
  _id: v.id("iboiteLetterAttachment"),
  name: v.string(),
  size: v.number(),
  mimeType: v.string(),
})

const LETTER_SUMMARY = v.object({
  _id: v.id("iboiteLetter"),
  accountId: v.id("iboiteAccount"),
  folder: FOLDER,
  senderName: v.string(),
  recipientName: v.string(),
  subject: v.string(),
  type: LETTER_TYPE,
  stampColor: STAMP,
  isRead: v.boolean(),
  hasAttachments: v.boolean(),
  dueAt: v.optional(v.number()),
  createdAt: v.number(),
})

const LETTER_DETAIL = v.object({
  _id: v.id("iboiteLetter"),
  accountId: v.id("iboiteAccount"),
  folder: FOLDER,
  senderName: v.string(),
  senderAddress: v.string(),
  recipientName: v.string(),
  recipientAddress: v.string(),
  subject: v.string(),
  body: v.string(),
  type: LETTER_TYPE,
  stampColor: STAMP,
  isRead: v.boolean(),
  dueAt: v.optional(v.number()),
  attachments: v.array(ATTACHMENT_OUT),
  createdAt: v.number(),
})

async function loadOwnedLetter(
  ctx: { db: { get: any } },
  letterId: Id<"iboiteLetter">,
  userId: string,
): Promise<Doc<"iboiteLetter">> {
  const letter = await ctx.db.get(letterId)
  if (!letter || letter.userId !== userId) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Courrier introuvable.",
    })
  }
  return letter
}

async function getAttachments(
  ctx: { db: { query: any } },
  letterId: Id<"iboiteLetter">,
): Promise<Doc<"iboiteLetterAttachment">[]> {
  return await ctx.db
    .query("iboiteLetterAttachment")
    .withIndex("by_letter", (q: any) => q.eq("letterId", letterId))
    .collect()
}

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

export const listByFolder = query({
  args: {
    accountId: v.id("iboiteAccount"),
    folder: FOLDER,
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(LETTER_SUMMARY),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    await loadOwnedAccount(ctx, args.accountId, user.userId)

    const page = await ctx.db
      .query("iboiteLetter")
      .withIndex("by_account_folder", (q) =>
        q.eq("accountId", args.accountId).eq("folder", args.folder),
      )
      .order("desc")
      .paginate(args.paginationOpts)

    const enriched = await Promise.all(
      page.page.map(async (l) => {
        const attachments = await getAttachments(ctx, l._id)
        return {
          _id: l._id,
          accountId: l.accountId,
          folder: l.folder,
          senderName: l.senderName,
          recipientName: l.recipientName,
          subject: l.subject,
          type: l.type,
          stampColor: l.stampColor,
          isRead: l.isRead,
          hasAttachments: attachments.length > 0,
          dueAt: l.dueAt,
          createdAt: l.createdAt,
        }
      }),
    )

    return {
      page: enriched,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    }
  },
})

export const get = query({
  args: { letterId: v.id("iboiteLetter") },
  returns: v.union(LETTER_DETAIL, v.null()),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const letter = await ctx.db.get(args.letterId)
    if (!letter || letter.userId !== user.userId) return null
    const attachments = await getAttachments(ctx, letter._id)
    return {
      _id: letter._id,
      accountId: letter.accountId,
      folder: letter.folder,
      senderName: letter.senderName,
      senderAddress: letter.senderAddress,
      recipientName: letter.recipientName,
      recipientAddress: letter.recipientAddress,
      subject: letter.subject,
      body: letter.body,
      type: letter.type,
      stampColor: letter.stampColor,
      isRead: letter.isRead,
      dueAt: letter.dueAt,
      attachments: attachments.map((a) => ({
        _id: a._id,
        name: a.name,
        size: a.size,
        mimeType: a.mimeType,
      })),
      createdAt: letter.createdAt,
    }
  },
})

export const attachmentUrl = query({
  args: { attachmentId: v.id("iboiteLetterAttachment") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const att = await ctx.db.get(args.attachmentId)
    if (!att) return null
    const letter = await ctx.db.get(att.letterId)
    if (!letter || letter.userId !== user.userId) return null
    return await ctx.storage.getUrl(att.storageRef)
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Mutations citoyen
// ─────────────────────────────────────────────────────────────────────────

export const markRead = mutation({
  args: { letterId: v.id("iboiteLetter") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const letter = await loadOwnedLetter(ctx, args.letterId, user.userId)
    if (letter.isRead) return null
    await ctx.db.patch(letter._id, { isRead: true })
    if (letter.folder === "inbox") {
      const account = await ctx.db.get(letter.accountId)
      if (account) {
        await ctx.db.patch(account._id, {
          counters: {
            ...account.counters,
            unreadLetters: Math.max(0, account.counters.unreadLetters - 1),
          },
          updatedAt: Date.now(),
        })
      }
    }
    return null
  },
})

export const move = mutation({
  args: {
    letterId: v.id("iboiteLetter"),
    target: v.union(
      v.literal("inbox"),
      v.literal("pending"),
      v.literal("trash"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const letter = await loadOwnedLetter(ctx, args.letterId, user.userId)
    if (letter.folder === args.target) return null

    // Règles métier :
    // - `pending` est réservé aux courriers entrants (folder source = inbox).
    // - `inbox` est la restauration (depuis pending/trash).
    // - `trash` est autorisé depuis n'importe quel folder ≠ sent.
    if (args.target === "pending" && letter.folder !== "inbox") {
      throw new ConvexError({
        code: "INVALID_MOVE",
        message: "« À traiter » réservé aux courriers entrants.",
      })
    }
    if (letter.folder === "sent" && args.target !== "trash") {
      throw new ConvexError({
        code: "INVALID_MOVE",
        message: "Un courrier expédié ne peut être que supprimé.",
      })
    }

    const account = await ctx.db.get(letter.accountId)
    if (account) {
      const c = { ...account.counters }
      // Décrément du folder source
      if (letter.folder === "inbox" && !letter.isRead) {
        c.unreadLetters = Math.max(0, c.unreadLetters - 1)
      }
      if (letter.folder === "pending") {
        c.pendingLetters = Math.max(0, c.pendingLetters - 1)
      }
      // Incrément du folder cible
      if (args.target === "inbox" && !letter.isRead) {
        c.unreadLetters += 1
      }
      if (args.target === "pending") {
        c.pendingLetters += 1
      }
      await ctx.db.patch(account._id, {
        counters: c,
        updatedAt: Date.now(),
      })
    }

    await ctx.db.patch(letter._id, { folder: args.target })
    return null
  },
})

export const unreadCount = query({
  args: { accountId: v.id("iboiteAccount") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const account = await loadOwnedAccount(ctx, args.accountId, user.userId)
    return account.counters.unreadLetters
  },
})
