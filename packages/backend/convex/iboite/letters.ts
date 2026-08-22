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
        await updateAccountCounters(ctx, account, {
          ...account.counters,
          unreadLetters: Math.max(0, account.counters.unreadLetters - 1),
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
      await updateAccountCounters(ctx, account, c)
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

// ─────────────────────────────────────────────────────────────────────────
// Envoi d'un courrier citoyen → citoyen
// ─────────────────────────────────────────────────────────────────────────

const IBOITE_DOMAIN = "idn.ga"

function formatPostalAddress(account: Doc<"iboiteAccount">): string {
  return `${account.street}\n${account.postalCode} ${account.city}\n${account.country}`
}

/**
 * URL signée pour uploader une pièce jointe de courrier dans `_storage`.
 * Le client POST le blob ensuite et récupère un `storageId` à passer à `send`.
 *
 * Rate-limite partagé avec `messageSend` (30 envois / heure) — un courrier
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

/**
 * Résout l'URL durable d'un blob de `_storage`. Utilisé par l'éditeur pour
 * insérer des images inline (et par le rendu pour les afficher).
 *
 * Le storageId étant opaque et non énumérable, l'auth seule suffit en v1 —
 * un partage abusif reste théoriquement possible mais limité (les URLs ne
 * remontent pas dans les listings).
 */
export const getStorageUrl = query({
  args: { storageRef: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireAuth(ctx)
    return await ctx.storage.getUrl(args.storageRef)
  },
})

export const send = mutation({
  args: {
    accountId: v.id("iboiteAccount"),
    recipientEmail: v.string(),
    subject: v.string(),
    body: v.string(),
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
  returns: v.id("iboiteLetter"),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    await rateLimiter.limit(ctx, "messageSend", {
      key: user.userId,
      throws: true,
    })
    const account = await loadOwnedAccount(ctx, args.accountId, user.userId)

    const subject = args.subject.trim()
    if (subject.length < 1) {
      throw new ConvexError({ code: "INVALID", message: "Objet requis." })
    }
    if (args.body.trim().length < 1) {
      throw new ConvexError({ code: "INVALID", message: "Courrier vide." })
    }

    // Normalisation tolérante : `jean.dupont` → `jean.dupont@idn.ga`. Tout
    // domaine externe est rejeté côté serveur (système fermé, pas de SMTP).
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

    const recipientAccount = await loadAccountByEmailAlias(ctx, recipientAlias)
    if (!recipientAccount) {
      throw new ConvexError({
        code: "RECIPIENT_UNKNOWN",
        message: "Aucun utilisateur ne correspond à cette adresse iBoîte.",
      })
    }

    const authUser = await authComponent.getAnyUserById(ctx, user.userId)
    const senderName =
      (authUser as { name?: string } | null)?.name ?? account.label

    const now = Date.now()
    const senderAddress = formatPostalAddress(account)
    const recipientAddress = formatPostalAddress(recipientAccount)

    // 1) Copie « Expédiés » côté expéditeur.
    const sentLetterId = await ctx.db.insert("iboiteLetter", {
      accountId: account._id,
      userId: user.userId,
      folder: "sent",
      senderName,
      senderAddress,
      recipientName: recipientAccount.label,
      recipientAddress,
      subject,
      body: args.body,
      type: "standard",
      stampColor: "blue",
      isRead: true,
      createdAt: now,
    })

    // 2) Copie « Réception » côté destinataire — rend le courrier visible.
    const inboxLetterId = await ctx.db.insert("iboiteLetter", {
      accountId: recipientAccount._id,
      userId: recipientAccount.userId,
      folder: "inbox",
      senderName,
      senderAddress,
      recipientName: recipientAccount.label,
      recipientAddress,
      subject,
      body: args.body,
      type: "standard",
      stampColor: "blue",
      isRead: false,
      createdAt: now,
    })

    // 3) Pièces jointes : on duplique les rows (une par lettre) mais on
    //    partage le même `storageRef` pour éviter de doubler le stockage.
    //    L'ownership est garanti par `letter.userId` côté `attachmentUrl`.
    if (args.attachments && args.attachments.length > 0) {
      for (const att of args.attachments) {
        await ctx.db.insert("iboiteLetterAttachment", {
          letterId: sentLetterId,
          name: att.name,
          size: att.size,
          storageRef: att.storageRef,
          mimeType: att.mimeType,
        })
        await ctx.db.insert("iboiteLetterAttachment", {
          letterId: inboxLetterId,
          name: att.name,
          size: att.size,
          storageRef: att.storageRef,
          mimeType: att.mimeType,
        })
      }
    }

    // 4) Compteur unread destinataire + notification in-app.
    await updateAccountCounters(
      ctx,
      recipientAccount,
      {
        ...recipientAccount.counters,
        unreadLetters: recipientAccount.counters.unreadLetters + 1,
      },
      now,
    )

    await ctx.runMutation(internal.notifications.dispatch, {
      userId: recipientAccount.userId,
      category: "documents",
      title: `Nouveau courrier : ${subject}`,
      body: `De : ${senderName}\nObjet : ${subject}`,
      metadata: {
        module: "iboite",
        kind: "letter",
        letterId: inboxLetterId,
        type: "standard",
      },
    })

    return sentLetterId
  },
})
