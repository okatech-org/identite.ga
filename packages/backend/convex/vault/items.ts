import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { mutation, query } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { requireVerifiedAuth } from "../lib/auth"
import { rateLimiter } from "../rateLimiter"
import { VAULT_FOLDERS } from "../schema"

/**
 * iDocument — Items (fichiers chiffrés E2E).
 * Cf. SPECS_FEATURES_CITIZEN.md §3 + plan §4.2-§4.3.
 *
 * Le serveur stocke uniquement le ciphertext + métadonnées strictement
 * nécessaires en clair (folderId, fileSize, fileType, status, expirationDate)
 * pour permettre filtres et notifs d'expiration. Les libellés (name,
 * original_name, etc.) vivent dans `encryptedMetadata`.
 */

const FOLDER_VALIDATOR = v.union(
  ...VAULT_FOLDERS.map((f) => v.literal(f)),
)
const FILE_TYPE = v.union(
  v.literal("pdf"),
  v.literal("image"),
  v.literal("other"),
)
const STATUS = v.union(
  v.literal("pending"),
  v.literal("verified"),
  v.literal("rejected"),
  v.literal("expired"),
)
const SIDE = v.union(v.literal("front"), v.literal("back"))

const VAULT_ITEM_OUT = v.object({
  _id: v.id("vaultItem"),
  folderId: FOLDER_VALIDATOR,
  // Chiffrement
  encryptedMetadata: v.string(),
  wrappedDek: v.string(),
  iv: v.string(),
  metaIv: v.string(),
  // Clair
  fileType: FILE_TYPE,
  fileSize: v.number(),
  status: STATUS,
  expirationDate: v.optional(v.string()),
  side: v.optional(SIDE),
  pairedItemId: v.optional(v.id("vaultItem")),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const MIN_BASE64_LEN = 16

async function loadOwnedItem(
  ctx: { db: { get: any } },
  itemId: Id<"vaultItem">,
  userId: string,
): Promise<Doc<"vaultItem">> {
  const item = await ctx.db.get(itemId)
  if (!item || item.userId !== userId || item.deletedAt !== undefined) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Document introuvable.",
    })
  }
  return item
}

async function ensureKeyActivated(
  ctx: { db: { query: any } },
  userId: string,
) {
  const key = await ctx.db
    .query("vaultKey")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique()
  if (!key) {
    throw new ConvexError({
      code: "VAULT_NOT_ACTIVATED",
      message: "Activez d'abord votre coffre-fort.",
    })
  }
}

function serializeItem(d: Doc<"vaultItem">) {
  return {
    _id: d._id,
    folderId: d.folderId,
    encryptedMetadata: d.encryptedMetadata,
    wrappedDek: d.wrappedDek,
    iv: d.iv,
    metaIv: d.metaIv,
    fileType: d.fileType,
    fileSize: d.fileSize,
    status: d.status,
    expirationDate: d.expirationDate,
    side: d.side,
    pairedItemId: d.pairedItemId,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

export const listByFolder = query({
  args: { folderId: FOLDER_VALIDATOR },
  returns: v.array(VAULT_ITEM_OUT),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const items = await ctx.db
      .query("vaultItem")
      .withIndex("by_userId_folder", (q) =>
        q.eq("userId", user.userId).eq("folderId", args.folderId),
      )
      .order("desc")
      .take(500)
    return items
      .filter((i) => i.deletedAt === undefined)
      .map(serializeItem)
  },
})

export const get = query({
  args: { itemId: v.id("vaultItem") },
  returns: v.union(VAULT_ITEM_OUT, v.null()),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const item = await ctx.db.get(args.itemId)
    if (
      !item ||
      item.userId !== user.userId ||
      item.deletedAt !== undefined
    ) {
      return null
    }
    return serializeItem(item)
  },
})

export const contentUrl = query({
  args: { itemId: v.id("vaultItem") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const item = await ctx.db.get(args.itemId)
    if (
      !item ||
      item.userId !== user.userId ||
      item.deletedAt !== undefined
    ) {
      return null
    }
    return await ctx.storage.getUrl(item.contentRef)
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "vaultUpload", {
      key: user.userId,
      throws: true,
    })
    await ensureKeyActivated(ctx, user.userId)
    return await ctx.storage.generateUploadUrl()
  },
})

export const create = mutation({
  args: {
    folderId: FOLDER_VALIDATOR,
    contentRef: v.id("_storage"),
    encryptedMetadata: v.string(),
    wrappedDek: v.string(),
    iv: v.string(),
    metaIv: v.string(),
    fileType: FILE_TYPE,
    fileSize: v.number(),
    expirationDate: v.optional(v.string()),
    side: v.optional(SIDE),
  },
  returns: v.id("vaultItem"),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "vaultUpload", {
      key: user.userId,
      throws: true,
    })
    await ensureKeyActivated(ctx, user.userId)

    // Sanity checks crypto fields
    for (const [field, value] of [
      ["encryptedMetadata", args.encryptedMetadata],
      ["wrappedDek", args.wrappedDek],
      ["iv", args.iv],
      ["metaIv", args.metaIv],
    ] as const) {
      if (value.length < MIN_BASE64_LEN) {
        throw new ConvexError({
          code: "INVALID",
          message: `Champ ${field} trop court (chiffrement requis).`,
        })
      }
    }
    if (args.fileSize < 0 || args.fileSize > 50 * 1024 * 1024) {
      throw new ConvexError({
        code: "INVALID",
        message: "Taille de fichier invalide (max 50 MB).",
      })
    }
    if (
      args.expirationDate !== undefined &&
      !/^\d{4}-\d{2}-\d{2}$/.test(args.expirationDate)
    ) {
      throw new ConvexError({
        code: "INVALID",
        message: "Date d'expiration invalide (format YYYY-MM-DD).",
      })
    }

    const now = Date.now()
    // Coffre E2E : le serveur ne voit que du ciphertext, il ne peut donc
    // pas "vérifier" le contenu. On crée chaque doc directement en
    // `verified` ; un futur scan antivirus (sur le ciphertext puis sur le
    // plaintext côté client) pourra rétrograder un item à `rejected`.
    const id = await ctx.db.insert("vaultItem", {
      userId: user.userId,
      folderId: args.folderId,
      contentRef: args.contentRef,
      encryptedMetadata: args.encryptedMetadata,
      wrappedDek: args.wrappedDek,
      iv: args.iv,
      metaIv: args.metaIv,
      fileType: args.fileType,
      fileSize: args.fileSize,
      status: "verified",
      expirationDate: args.expirationDate,
      side: args.side,
      createdAt: now,
      updatedAt: now,
    })

    return id
  },
})

export const update = mutation({
  args: {
    itemId: v.id("vaultItem"),
    folderId: v.optional(FOLDER_VALIDATOR),
    encryptedMetadata: v.optional(v.string()),
    metaIv: v.optional(v.string()),
    expirationDate: v.optional(v.string()),
    side: v.optional(SIDE),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const item = await loadOwnedItem(ctx, args.itemId, user.userId)

    const patch: Partial<Doc<"vaultItem">> = { updatedAt: Date.now() }
    if (args.folderId !== undefined) patch.folderId = args.folderId
    if (args.encryptedMetadata !== undefined) {
      if (args.encryptedMetadata.length < MIN_BASE64_LEN) {
        throw new ConvexError({
          code: "INVALID",
          message: "encryptedMetadata trop court.",
        })
      }
      patch.encryptedMetadata = args.encryptedMetadata
    }
    if (args.metaIv !== undefined) {
      if (args.metaIv.length < MIN_BASE64_LEN) {
        throw new ConvexError({ code: "INVALID", message: "metaIv invalide." })
      }
      patch.metaIv = args.metaIv
    }
    if (args.expirationDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(args.expirationDate)) {
        throw new ConvexError({
          code: "INVALID",
          message: "Date d'expiration invalide.",
        })
      }
      patch.expirationDate = args.expirationDate
    }
    if (args.side !== undefined) patch.side = args.side

    await ctx.db.patch(item._id, patch)
    return null
  },
})

export const remove = mutation({
  args: { itemId: v.id("vaultItem") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const item = await loadOwnedItem(ctx, args.itemId, user.userId)

    // Soft delete + libère le blob Convex Storage immédiatement
    // (le blob ne sert plus à rien sans la DEK).
    await ctx.db.patch(item._id, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    })
    try {
      await ctx.storage.delete(item.contentRef)
    } catch {
      // ignore — le soft-delete est suffisant pour rendre le doc inaccessible
    }

    // Si l'item avait un pair recto/verso, on désaccouple.
    if (item.pairedItemId) {
      const paired = await ctx.db.get(item.pairedItemId)
      if (paired && paired.pairedItemId === item._id) {
        await ctx.db.patch(paired._id, {
          pairedItemId: undefined,
          updatedAt: Date.now(),
        })
      }
    }
    return null
  },
})

export const pair = mutation({
  args: {
    frontItemId: v.id("vaultItem"),
    backItemId: v.id("vaultItem"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    if (args.frontItemId === args.backItemId) {
      throw new ConvexError({
        code: "INVALID",
        message: "Impossible d'apparier un document à lui-même.",
      })
    }
    const front = await loadOwnedItem(ctx, args.frontItemId, user.userId)
    const back = await loadOwnedItem(ctx, args.backItemId, user.userId)
    if (front.folderId !== back.folderId) {
      throw new ConvexError({
        code: "INVALID",
        message: "Les documents doivent être dans le même dossier.",
      })
    }
    const now = Date.now()
    await ctx.db.patch(front._id, {
      side: "front",
      pairedItemId: back._id,
      updatedAt: now,
    })
    await ctx.db.patch(back._id, {
      side: "back",
      pairedItemId: front._id,
      updatedAt: now,
    })
    return null
  },
})
