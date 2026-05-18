import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { mutation } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { requireRole } from "../lib/auth"
import { loadAccountByEmailAlias, loadAccountByQrCode } from "./accounts"

/**
 * iBoîte — Mutations d'ingestion réservées aux opérateurs administratifs.
 * Cf. SPECS_FEATURES_CITIZEN.md §2 + plan §3.2.
 *
 * Ces mutations sont la **seule** façon de faire entrer du courrier / colis /
 * email dans la boîte d'un citoyen. Réservées au rôle `admin` et
 * `identity_controller` (les contrôleurs IDN ont accès car la DGDI envoie
 * aussi des convocations CNI via ce canal).
 *
 * Chaque mutation déclenche une notification in-app au destinataire
 * (catégorie `documents`) via `internal.notifications.dispatch`.
 */

const LETTER_TYPE = v.union(
  v.literal("action_required"),
  v.literal("informational"),
  v.literal("standard"),
)
const STAMP = v.union(v.literal("red"), v.literal("blue"), v.literal("green"))
const PACKAGE_STATUS = v.union(
  v.literal("pending"),
  v.literal("transit"),
  v.literal("available"),
  v.literal("delivered"),
)

const ATTACHMENT_INPUT = v.object({
  name: v.string(),
  size: v.number(),
  storageRef: v.id("_storage"),
  mimeType: v.string(),
})

function makePreview(body: string, max = 150): string {
  const flat = body.replace(/\s+/g, " ").trim()
  return flat.length <= max ? flat : flat.slice(0, max - 1) + "…"
}

async function bumpAccountCounters(
  ctx: { db: { get: any; patch: any } },
  accountId: Id<"iboiteAccount">,
  delta: Partial<Doc<"iboiteAccount">["counters"]>,
) {
  const account = await ctx.db.get(accountId)
  if (!account) return
  const c = { ...account.counters }
  for (const [k, v] of Object.entries(delta) as Array<
    [keyof typeof c, number]
  >) {
    c[k] = Math.max(0, c[k] + v)
  }
  await ctx.db.patch(account._id, {
    counters: c,
    updatedAt: Date.now(),
  })
}

// ─────────────────────────────────────────────────────────────────────────
// Drop letter
// ─────────────────────────────────────────────────────────────────────────

export const dropLetter = mutation({
  args: {
    recipientQrCode: v.string(),
    senderName: v.string(),
    senderAddress: v.string(),
    subject: v.string(),
    body: v.string(),
    type: LETTER_TYPE,
    stampColor: STAMP,
    dueAt: v.optional(v.number()),
    attachments: v.optional(v.array(ATTACHMENT_INPUT)),
  },
  returns: v.id("iboiteLetter"),
  handler: async (ctx, args) => {
    const operator = await requireRole(ctx, "admin", "identity_controller")
    const account = await loadAccountByQrCode(ctx, args.recipientQrCode)
    if (!account) {
      throw new ConvexError({
        code: "RECIPIENT_UNKNOWN",
        message: "Aucune adresse iBoîte ne correspond à ce QR code.",
      })
    }

    const now = Date.now()
    const letterId = await ctx.db.insert("iboiteLetter", {
      accountId: account._id,
      userId: account.userId,
      folder: "inbox",
      senderName: args.senderName,
      senderAddress: args.senderAddress,
      recipientName: account.label,
      recipientAddress: `${account.street}\n${account.postalCode} ${account.city}\n${account.country}`,
      subject: args.subject,
      body: args.body,
      type: args.type,
      stampColor: args.stampColor,
      isRead: false,
      dueAt: args.dueAt,
      originOperator: operator.userId,
      createdAt: now,
    })

    if (args.attachments && args.attachments.length > 0) {
      for (const a of args.attachments) {
        await ctx.db.insert("iboiteLetterAttachment", {
          letterId,
          name: a.name,
          size: a.size,
          storageRef: a.storageRef,
          mimeType: a.mimeType,
        })
      }
    }

    await bumpAccountCounters(ctx, account._id, { unreadLetters: 1 })

    await ctx.runMutation(internal.notifications.dispatch, {
      userId: account.userId,
      category: "documents",
      title:
        args.type === "action_required"
          ? `Courrier important : ${args.subject}`
          : `Nouveau courrier : ${args.subject}`,
      body: `De : ${args.senderName}\nObjet : ${args.subject}`,
      metadata: {
        module: "iboite",
        kind: "letter",
        letterId,
        type: args.type,
      },
      sendEmail: args.type === "action_required",
    })

    return letterId
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Drop package
// ─────────────────────────────────────────────────────────────────────────

export const dropPackage = mutation({
  args: {
    recipientQrCode: v.string(),
    trackingNumber: v.string(),
    senderName: v.string(),
    description: v.string(),
    status: PACKAGE_STATUS,
    estimatedDeliveryAt: v.optional(v.number()),
  },
  returns: v.id("iboitePackage"),
  handler: async (ctx, args) => {
    const operator = await requireRole(ctx, "admin", "identity_controller")
    const account = await loadAccountByQrCode(ctx, args.recipientQrCode)
    if (!account) {
      throw new ConvexError({
        code: "RECIPIENT_UNKNOWN",
        message: "Aucune adresse iBoîte ne correspond à ce QR code.",
      })
    }

    const now = Date.now()
    const packageId = await ctx.db.insert("iboitePackage", {
      accountId: account._id,
      userId: account.userId,
      trackingNumber: args.trackingNumber,
      senderName: args.senderName,
      description: args.description,
      status: args.status,
      estimatedDeliveryAt: args.estimatedDeliveryAt,
      originOperator: operator.userId,
      createdAt: now,
    })

    if (args.status === "available") {
      await bumpAccountCounters(ctx, account._id, { availablePackages: 1 })
      await ctx.runMutation(internal.notifications.dispatch, {
        userId: account.userId,
        category: "documents",
        title: "Colis à retirer",
        body: `${args.description} (${args.trackingNumber}) — à retirer au point relais.`,
        metadata: {
          module: "iboite",
          kind: "package",
          packageId,
        },
        sendEmail: true,
      })
    }

    return packageId
  },
})

/**
 * Met à jour le statut d'un colis (par un opérateur transporteur). Côté
 * citoyen on a `markPickedUp` qui gère la transition `available → delivered`.
 */
export const updatePackageStatus = mutation({
  args: {
    packageId: v.id("iboitePackage"),
    status: PACKAGE_STATUS,
    estimatedDeliveryAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin", "identity_controller")
    const pkg = await ctx.db.get(args.packageId)
    if (!pkg) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Colis introuvable.",
      })
    }
    if (pkg.status === args.status) return null

    // Maintenance des compteurs : on garde uniquement `availablePackages`.
    if (pkg.status === "available" && args.status !== "available") {
      await bumpAccountCounters(ctx, pkg.accountId, { availablePackages: -1 })
    } else if (pkg.status !== "available" && args.status === "available") {
      await bumpAccountCounters(ctx, pkg.accountId, { availablePackages: 1 })
      await ctx.runMutation(internal.notifications.dispatch, {
        userId: pkg.userId,
        category: "documents",
        title: "Colis à retirer",
        body: `${pkg.description} (${pkg.trackingNumber}) — à retirer au point relais.`,
        metadata: { module: "iboite", kind: "package", packageId: pkg._id },
        sendEmail: true,
      })
    }

    await ctx.db.patch(pkg._id, {
      status: args.status,
      estimatedDeliveryAt: args.estimatedDeliveryAt ?? pkg.estimatedDeliveryAt,
    })
    return null
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Send message from admin
// ─────────────────────────────────────────────────────────────────────────

export const sendMessageFromAdmin = mutation({
  args: {
    recipientEmailAlias: v.string(),
    senderName: v.string(),
    senderEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    hasAttachment: v.optional(v.boolean()),
    inReplyTo: v.optional(v.id("iboiteMessage")),
  },
  returns: v.id("iboiteMessage"),
  handler: async (ctx, args) => {
    await requireRole(ctx, "admin", "identity_controller")
    const account = await loadAccountByEmailAlias(ctx, args.recipientEmailAlias)
    if (!account) {
      throw new ConvexError({
        code: "RECIPIENT_UNKNOWN",
        message: "Aucune adresse iBoîte ne correspond à cet alias.",
      })
    }

    let threadId: string
    if (args.inReplyTo) {
      const original = await ctx.db.get(args.inReplyTo)
      if (!original) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Message d'origine introuvable.",
        })
      }
      threadId = original.threadId
    } else {
      threadId = crypto.randomUUID()
    }

    const now = Date.now()
    const id = await ctx.db.insert("iboiteMessage", {
      accountId: account._id,
      userId: account.userId,
      threadId,
      senderKind: "admin",
      senderName: args.senderName,
      senderEmail: args.senderEmail.toLowerCase(),
      recipientName: account.label,
      recipientEmail: account.emailAlias,
      subject: args.subject,
      preview: makePreview(args.body),
      body: args.body,
      folder: "inbox",
      isRead: false,
      isStarred: false,
      hasAttachment: args.hasAttachment ?? false,
      inReplyTo: args.inReplyTo,
      createdAt: now,
    })

    await bumpAccountCounters(ctx, account._id, { unreadMessages: 1 })

    await ctx.runMutation(internal.notifications.dispatch, {
      userId: account.userId,
      category: "documents",
      title: `Nouveau message de ${args.senderName}`,
      body: `${args.subject}\n\n${makePreview(args.body, 200)}`,
      metadata: {
        module: "iboite",
        kind: "message",
        messageId: id,
      },
    })

    return id
  },
})
