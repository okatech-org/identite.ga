import { ConvexError, v } from "convex/values"
import { paginationOptsValidator } from "convex/server"

import { internal } from "../_generated/api"
import { mutation, query } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { authComponent } from "../auth"
import { requireAuth } from "../lib/auth"
import { rateLimiter } from "../rateLimiter"
import { loadAccountByEmailAlias, loadOwnedAccount } from "./accounts"

const IBOITE_DOMAIN = "idn.ga"

/**
 * iBoîte — eMails internes (cf. SPECS_FEATURES_CITIZEN.md §2.7 + §2.9.3).
 *
 * Phase 1 : messagerie app-only entre citoyens et administrations (DGDI,
 * CNAMGS, Mairie, DGI…). Pas de SMTP. Le destinataire `recipientEmail`
 * est un libellé (pas de validation contre un registre opérateur — un
 * routing admin-side est prévu en V2).
 *
 * Les messages entrants (admin → citoyen) sont créés par les opérateurs
 * via `iboite/admin.sendMessageFromAdmin`.
 */

const FOLDER = v.union(
  v.literal("inbox"),
  v.literal("sent"),
  v.literal("trash"),
)

const MESSAGE_SUMMARY = v.object({
  _id: v.id("iboiteMessage"),
  accountId: v.id("iboiteAccount"),
  threadId: v.string(),
  folder: FOLDER,
  senderKind: v.union(v.literal("admin"), v.literal("citizen")),
  senderName: v.string(),
  senderEmail: v.string(),
  recipientName: v.string(),
  recipientEmail: v.string(),
  subject: v.string(),
  preview: v.string(),
  isRead: v.boolean(),
  isStarred: v.boolean(),
  hasAttachment: v.boolean(),
  createdAt: v.number(),
})

const MESSAGE_DETAIL = v.object({
  _id: v.id("iboiteMessage"),
  accountId: v.id("iboiteAccount"),
  threadId: v.string(),
  folder: FOLDER,
  senderKind: v.union(v.literal("admin"), v.literal("citizen")),
  senderName: v.string(),
  senderEmail: v.string(),
  recipientName: v.string(),
  recipientEmail: v.string(),
  subject: v.string(),
  body: v.string(),
  preview: v.string(),
  isRead: v.boolean(),
  isStarred: v.boolean(),
  hasAttachment: v.boolean(),
  inReplyTo: v.optional(v.id("iboiteMessage")),
  createdAt: v.number(),
})

async function loadOwnedMessage(
  ctx: { db: { get: any } },
  messageId: Id<"iboiteMessage">,
  userId: string,
): Promise<Doc<"iboiteMessage">> {
  const m = await ctx.db.get(messageId)
  if (!m || m.userId !== userId) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Message introuvable.",
    })
  }
  return m
}

function serializeSummary(m: Doc<"iboiteMessage">) {
  return {
    _id: m._id,
    accountId: m.accountId,
    threadId: m.threadId,
    folder: m.folder,
    senderKind: m.senderKind,
    senderName: m.senderName,
    senderEmail: m.senderEmail,
    recipientName: m.recipientName,
    recipientEmail: m.recipientEmail,
    subject: m.subject,
    preview: m.preview,
    isRead: m.isRead,
    isStarred: m.isStarred,
    hasAttachment: m.hasAttachment,
    createdAt: m.createdAt,
  }
}

function makePreview(body: string, max = 150): string {
  const flat = body.replace(/\s+/g, " ").trim()
  return flat.length <= max ? flat : flat.slice(0, max - 1) + "…"
}

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

export const listByFolder = query({
  args: {
    accountId: v.id("iboiteAccount"),
    folder: v.union(FOLDER, v.literal("starred")),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(MESSAGE_SUMMARY),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    await loadOwnedAccount(ctx, args.accountId, user.userId)

    // L'UI a un dossier virtuel « Favoris » qui agrège tous les messages
    // starred du compte (hors corbeille). On l'implémente via l'index dédié.
    if (args.folder === "starred") {
      const page = await ctx.db
        .query("iboiteMessage")
        .withIndex("by_user_starred", (q) =>
          q.eq("userId", user.userId).eq("isStarred", true),
        )
        .order("desc")
        .paginate(args.paginationOpts)
      return {
        page: page.page
          .filter((m) => m.accountId === args.accountId && m.folder !== "trash")
          .map(serializeSummary),
        isDone: page.isDone,
        continueCursor: page.continueCursor,
      }
    }

    const folder: "inbox" | "sent" | "trash" = args.folder
    const page = await ctx.db
      .query("iboiteMessage")
      .withIndex("by_account_folder", (q) =>
        q.eq("accountId", args.accountId).eq("folder", folder),
      )
      .order("desc")
      .paginate(args.paginationOpts)
    return {
      page: page.page.map(serializeSummary),
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    }
  },
})

export const get = query({
  args: { messageId: v.id("iboiteMessage") },
  returns: v.union(MESSAGE_DETAIL, v.null()),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const m = await ctx.db.get(args.messageId)
    if (!m || m.userId !== user.userId) return null
    return {
      _id: m._id,
      accountId: m.accountId,
      threadId: m.threadId,
      folder: m.folder,
      senderKind: m.senderKind,
      senderName: m.senderName,
      senderEmail: m.senderEmail,
      recipientName: m.recipientName,
      recipientEmail: m.recipientEmail,
      subject: m.subject,
      body: m.body,
      preview: m.preview,
      isRead: m.isRead,
      isStarred: m.isStarred,
      hasAttachment: m.hasAttachment,
      inReplyTo: m.inReplyTo,
      createdAt: m.createdAt,
    }
  },
})

export const unreadCount = query({
  args: { accountId: v.id("iboiteAccount") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const account = await loadOwnedAccount(ctx, args.accountId, user.userId)
    return account.counters.unreadMessages
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Mutations citoyen
// ─────────────────────────────────────────────────────────────────────────

export const markRead = mutation({
  args: { messageId: v.id("iboiteMessage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const m = await loadOwnedMessage(ctx, args.messageId, user.userId)
    if (m.isRead) return null
    await ctx.db.patch(m._id, { isRead: true })
    if (m.folder === "inbox") {
      const account = await ctx.db.get(m.accountId)
      if (account) {
        await ctx.db.patch(account._id, {
          counters: {
            ...account.counters,
            unreadMessages: Math.max(0, account.counters.unreadMessages - 1),
          },
          updatedAt: Date.now(),
        })
      }
    }
    return null
  },
})

export const toggleStar = mutation({
  args: { messageId: v.id("iboiteMessage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const m = await loadOwnedMessage(ctx, args.messageId, user.userId)
    await ctx.db.patch(m._id, { isStarred: !m.isStarred })
    return null
  },
})

export const move = mutation({
  args: {
    messageId: v.id("iboiteMessage"),
    target: v.union(v.literal("inbox"), v.literal("trash")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const m = await loadOwnedMessage(ctx, args.messageId, user.userId)
    if (m.folder === args.target) return null

    const account = await ctx.db.get(m.accountId)
    if (account && m.folder === "inbox" && !m.isRead) {
      await ctx.db.patch(account._id, {
        counters: {
          ...account.counters,
          unreadMessages: Math.max(0, account.counters.unreadMessages - 1),
        },
        updatedAt: Date.now(),
      })
    }
    if (account && args.target === "inbox" && !m.isRead) {
      await ctx.db.patch(account._id, {
        counters: {
          ...account.counters,
          unreadMessages: account.counters.unreadMessages + 1,
        },
        updatedAt: Date.now(),
      })
    }

    await ctx.db.patch(m._id, { folder: args.target })
    return null
  },
})

export const send = mutation({
  args: {
    accountId: v.id("iboiteAccount"),
    recipientName: v.string(),
    recipientEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    inReplyTo: v.optional(v.id("iboiteMessage")),
    hasAttachment: v.optional(v.boolean()),
  },
  returns: v.id("iboiteMessage"),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    await rateLimiter.limit(ctx, "messageSend", {
      key: user.userId,
      throws: true,
    })
    const account = await loadOwnedAccount(ctx, args.accountId, user.userId)

    if (args.subject.trim().length < 1) {
      throw new ConvexError({ code: "INVALID", message: "Objet requis." })
    }
    if (args.body.trim().length < 1) {
      throw new ConvexError({ code: "INVALID", message: "Message vide." })
    }

    // Normalisation tolérante : on accepte « jean.dupont » comme
    // « jean.dupont@idn.ga ». En revanche, tout autre domaine est rejeté
    // (iBoîte est un système fermé, pas de SMTP sortant).
    const rawTo = args.recipientEmail.trim().toLowerCase()
    if (rawTo.length < 1) {
      throw new ConvexError({
        code: "INVALID",
        message: "Adresse destinataire requise.",
      })
    }
    const recipientAlias = rawTo.includes("@")
      ? rawTo
      : `${rawTo}@${IBOITE_DOMAIN}`
    if (!recipientAlias.endsWith(`@${IBOITE_DOMAIN}`)) {
      throw new ConvexError({
        code: "INVALID_DOMAIN",
        message: `Adresse non valide. Seul le domaine @${IBOITE_DOMAIN} est accepté.`,
      })
    }

    // Vérification stricte : l'alias doit exister dans iboiteAccount.
    // Sinon on remonte un RECIPIENT_UNKNOWN — l'UI l'affiche en toast.
    const recipientAccount = await loadAccountByEmailAlias(ctx, recipientAlias)
    if (!recipientAccount) {
      throw new ConvexError({
        code: "RECIPIENT_UNKNOWN",
        message: "Aucun utilisateur ne correspond à cette adresse iBoîte.",
      })
    }

    // Thread : si on répond à un message existant, on hérite du threadId.
    // Sinon, on crée un nouveau threadId (string base32).
    let threadId: string
    if (args.inReplyTo) {
      const original = await ctx.db.get(args.inReplyTo)
      if (!original || original.userId !== user.userId) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Message d'origine introuvable.",
        })
      }
      threadId = original.threadId
    } else {
      threadId = crypto.randomUUID()
    }

    // Récupère le nom affiché du citoyen via Better Auth.
    const authUser = await authComponent.getAnyUserById(ctx, user.userId)
    const senderName = (authUser as { name?: string } | null)?.name ?? "Citoyen"

    const now = Date.now()
    const subject = args.subject.trim()
    const preview = makePreview(args.body)

    // 1) Copie « envoyée » côté expéditeur (folder: sent, owner: user courant).
    const sentId = await ctx.db.insert("iboiteMessage", {
      accountId: account._id,
      userId: user.userId,
      threadId,
      senderKind: "citizen",
      senderName,
      senderEmail: account.emailAlias,
      recipientName: recipientAccount.label,
      recipientEmail: recipientAlias,
      subject,
      preview,
      body: args.body,
      folder: "sent",
      isRead: true,
      isStarred: false,
      hasAttachment: args.hasAttachment ?? false,
      inReplyTo: args.inReplyTo,
      createdAt: now,
    })

    // 2) Copie « reçue » côté destinataire (folder: inbox, owner: destinataire).
    //    C'est cette insertion qui rend le message visible chez l'autre.
    const inboxId = await ctx.db.insert("iboiteMessage", {
      accountId: recipientAccount._id,
      userId: recipientAccount.userId,
      threadId,
      senderKind: "citizen",
      senderName,
      senderEmail: account.emailAlias,
      recipientName: recipientAccount.label,
      recipientEmail: recipientAlias,
      subject,
      preview,
      body: args.body,
      folder: "inbox",
      isRead: false,
      isStarred: false,
      hasAttachment: args.hasAttachment ?? false,
      // `inReplyTo` est un Id<"iboiteMessage"> du compte expéditeur, on ne
      // le propage pas côté destinataire (la continuité de thread est
      // assurée par `threadId`).
      createdAt: now,
    })

    // 3) Compteur unread + notification in-app côté destinataire.
    await ctx.db.patch(recipientAccount._id, {
      counters: {
        ...recipientAccount.counters,
        unreadMessages: recipientAccount.counters.unreadMessages + 1,
      },
      updatedAt: now,
    })

    await ctx.runMutation(internal.notifications.dispatch, {
      userId: recipientAccount.userId,
      category: "documents",
      title: `Nouveau message de ${senderName}`,
      body: `${subject}\n\n${makePreview(args.body, 200)}`,
      metadata: {
        module: "iboite",
        kind: "message",
        messageId: inboxId,
      },
    })

    return sentId
  },
})
