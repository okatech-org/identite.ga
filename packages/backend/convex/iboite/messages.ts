import { ConvexError, v } from "convex/values"
import { paginationOptsValidator } from "convex/server"

import { internal } from "../_generated/api"
import { mutation, query } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { authComponent } from "../auth"
import { requireAuth } from "../lib/auth"
import { rateLimiter } from "../rateLimiter"
import { loadAccountByEmailAlias, loadOwnedAccount } from "./accounts"
import { updateAccountCounters } from "./accountSync"

const IBOITE_DOMAIN = "idn.ga"

// Le rate-limit `messageSend` borne le nombre de MESSAGES/heure, pas le
// nombre de pièces jointes par message — sans ce plafond, un seul appel
// `send` pourrait insérer un nombre arbitraire de lignes
// `iboiteMessageAttachment` (2 par PJ : copie envoyée + copie reçue).
const MAX_ATTACHMENTS = 10

/**
 * iBoîte — eMails internes (cf. SPECS_FEATURES_CITIZEN.md §2.7 + §2.9.3).
 *
 * Messagerie iBoîte : livraison transactionnelle interne pour les adresses
 * @idn.ga, et remise SMTP asynchrone pour les domaines externes.
 *
 * Les messages entrants (admin → citoyen) sont créés par les opérateurs
 * via `iboite/admin.sendMessageFromAdmin`.
 */

const FOLDER = v.union(
  v.literal("inbox"),
  v.literal("sent"),
  v.literal("trash"),
)

const ATTACHMENT_OUT = v.object({
  _id: v.id("iboiteMessageAttachment"),
  name: v.string(),
  size: v.number(),
  mimeType: v.string(),
})

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
  attachments: v.array(ATTACHMENT_OUT),
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

async function getAttachments(
  ctx: { db: { query: any } },
  messageId: Id<"iboiteMessage">,
): Promise<Doc<"iboiteMessageAttachment">[]> {
  return await ctx.db
    .query("iboiteMessageAttachment")
    .withIndex("by_message", (q: any) => q.eq("messageId", messageId))
    .collect()
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
    const attachments = await getAttachments(ctx, m._id)
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
      attachments: attachments.map((a) => ({
        _id: a._id,
        name: a.name,
        size: a.size,
        mimeType: a.mimeType,
      })),
      inReplyTo: m.inReplyTo,
      createdAt: m.createdAt,
    }
  },
})

/**
 * URL signée pour lire une pièce jointe de message. Authz par ownership du
 * message (`message.userId === user courant`) — cf. `iboite/letters.ts`.
 */
export const attachmentUrl = query({
  args: { attachmentId: v.id("iboiteMessageAttachment") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const att = await ctx.db.get(args.attachmentId)
    if (!att) return null
    const message = await ctx.db.get(att.messageId)
    if (!message || message.userId !== user.userId) return null
    return await ctx.storage.getUrl(att.storageRef)
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
        await updateAccountCounters(ctx, account, {
          ...account.counters,
          unreadMessages: Math.max(0, account.counters.unreadMessages - 1),
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
      await updateAccountCounters(ctx, account, {
        ...account.counters,
        unreadMessages: Math.max(0, account.counters.unreadMessages - 1),
      })
    }
    if (account && args.target === "inbox" && !m.isRead) {
      await updateAccountCounters(ctx, account, {
        ...account.counters,
        unreadMessages: account.counters.unreadMessages + 1,
      })
    }

    await ctx.db.patch(m._id, { folder: args.target })
    return null
  },
})

/**
 * URL signée pour uploader une pièce jointe de message dans `_storage`.
 * Le client POST le blob ensuite et récupère un `storageId` à passer à
 * `send`. Rate-limite partagé avec `send` (30 envois / heure) — un message
 * coûte un slot, peu importe le nombre de pièces jointes.
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    await rateLimiter.limit(ctx, "messageSend", {
      key: user.userId,
      throws: true,
    })
    return await ctx.storage.generateUploadUrl()
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
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          size: v.number(),
          storageRef: v.id("_storage"),
          mimeType: v.string(),
        }),
      ),
    ),
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
    if ((args.attachments?.length ?? 0) > MAX_ATTACHMENTS) {
      throw new ConvexError({
        code: "TOO_MANY_ATTACHMENTS",
        message: `Maximum ${MAX_ATTACHMENTS} pièces jointes par message.`,
      })
    }
    // TODO(defense-in-depth): `storageRef` n'est pas vérifié comme
    // appartenant à `user` (pas de lien uploader ↔ blob côté `_storage`) —
    // un citoyen pourrait en théorie joindre le storageId d'un fichier
    // uploadé par quelqu'un d'autre s'il le devine/l'obtient. Hors scope de
    // ce correctif (noté pour un futur durcissement).

    // Normalisation tolérante : un identifiant sans domaine désigne une boîte
    // iBoîte. Une adresse complète valide peut viser n'importe quel domaine.
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientAlias)) {
      throw new ConvexError({
        code: "INVALID_EMAIL",
        message: "Adresse email invalide.",
      })
    }

    const isInternal = recipientAlias.endsWith(`@${IBOITE_DOMAIN}`)
    const recipientAccount = isInternal
      ? await loadAccountByEmailAlias(ctx, recipientAlias)
      : null
    if (isInternal && !recipientAccount) {
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
    // `hasAttachment` est dérivé côté serveur du contenu réel de
    // `args.attachments` — jamais accepté tel quel depuis le client (sinon
    // un client malveillant pourrait afficher un trombone sans PJ réelle).
    const hasAttachment = (args.attachments?.length ?? 0) > 0

    // 1) Copie « envoyée » côté expéditeur (folder: sent, owner: user courant).
    const sentId = await ctx.db.insert("iboiteMessage", {
      accountId: account._id,
      userId: user.userId,
      threadId,
      senderKind: "citizen",
      senderName,
      senderEmail: account.emailAlias,
      recipientName:
        recipientAccount?.label ??
        (args.recipientName.trim() || recipientAlias),
      recipientEmail: recipientAlias,
      subject,
      preview,
      body: args.body,
      folder: "sent",
      isRead: true,
      isStarred: false,
      hasAttachment,
      inReplyTo: args.inReplyTo,
      transport: isInternal ? "internal" : "smtp",
      deliveryStatus: isInternal ? "sent" : "queued",
      deliveryAttempts: 0,
      createdAt: now,
    })

    if (!recipientAccount) {
      if (args.attachments && args.attachments.length > 0) {
        for (const att of args.attachments) {
          await ctx.db.insert("iboiteMessageAttachment", {
            messageId: sentId,
            name: att.name,
            size: att.size,
            storageRef: att.storageRef,
            mimeType: att.mimeType,
          })
        }
      }
      if (process.env.NODE_ENV !== "test") {
        await ctx.scheduler.runAfter(
          0,
          internal.iboite.mailActions.deliverOutbound,
          { messageId: sentId },
        )
      }
      return sentId
    }

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
      hasAttachment,
      transport: "internal",
      deliveryStatus: "sent",
      // `inReplyTo` est un Id<"iboiteMessage"> du compte expéditeur, on ne
      // le propage pas côté destinataire (la continuité de thread est
      // assurée par `threadId`).
      createdAt: now,
    })

    // 2bis) Pièces jointes : on duplique les rows (une par copie) mais on
    //       partage le même `storageRef` pour éviter de doubler le stockage.
    //       L'ownership est garanti par `message.userId` côté `attachmentUrl`.
    if (args.attachments && args.attachments.length > 0) {
      for (const att of args.attachments) {
        await ctx.db.insert("iboiteMessageAttachment", {
          messageId: sentId,
          name: att.name,
          size: att.size,
          storageRef: att.storageRef,
          mimeType: att.mimeType,
        })
        await ctx.db.insert("iboiteMessageAttachment", {
          messageId: inboxId,
          name: att.name,
          size: att.size,
          storageRef: att.storageRef,
          mimeType: att.mimeType,
        })
      }
    }

    // 3) Compteur unread + notification in-app côté destinataire.
    await updateAccountCounters(
      ctx,
      recipientAccount,
      {
        ...recipientAccount.counters,
        unreadMessages: recipientAccount.counters.unreadMessages + 1,
      },
      now,
    )

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
