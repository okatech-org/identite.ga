import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"
import { requireVerifiedAuth } from "./lib/auth"
import { VAULT_FOLDERS } from "./schema"

/**
 * iDocument — stockage simple, sans chiffrement E2E.
 *
 * Le blob est stocké en clair dans Convex storage ; les métadonnées (nom,
 * type MIME, expiration) sont également en clair côté serveur. L'accès
 * est gardé par l'auth Convex + check d'ownership.
 *
 * Le module `vault.*` (E2E client) est conservé en parallèle pour
 * réactivation future, mais n'est plus utilisé par l'app mobile/web.
 *
 * Le module existant `documents.ts` gère les pièces KYC (`userDocument`)
 * — c'est un scope différent (photos profil, pièces d'identité scannées).
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

const DOCUMENT_OUT = v.object({
  _id: v.id("documentItem"),
  folderId: FOLDER_VALIDATOR,
  name: v.string(),
  originalName: v.optional(v.string()),
  mimeType: v.string(),
  fileType: FILE_TYPE,
  fileSize: v.number(),
  status: STATUS,
  expirationDate: v.optional(v.string()),
  side: v.optional(SIDE),
  pairedItemId: v.optional(v.id("documentItem")),
  createdAt: v.number(),
  updatedAt: v.number(),
})

function serializeDoc(d: Doc<"documentItem">) {
  return {
    _id: d._id,
    folderId: d.folderId,
    name: d.name,
    originalName: d.originalName,
    mimeType: d.mimeType,
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

async function loadOwned(
  ctx: { db: { get: (id: Id<"documentItem">) => Promise<Doc<"documentItem"> | null> } },
  itemId: Id<"documentItem">,
  userId: string,
): Promise<Doc<"documentItem">> {
  const item = await ctx.db.get(itemId)
  if (!item || item.userId !== userId || item.deletedAt !== undefined) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Document introuvable.",
    })
  }
  return item
}

/**
 * Liste des documents d'un dossier (récents d'abord).
 */
export const listByFolder = query({
  args: { folderId: FOLDER_VALIDATOR },
  returns: v.array(DOCUMENT_OUT),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const rows = await ctx.db
      .query("documentItem")
      .withIndex("by_userId_folder", (q) =>
        q.eq("userId", user.userId).eq("folderId", args.folderId),
      )
      .order("desc")
      .take(200)
    return rows
      .filter((d) => d.deletedAt === undefined)
      .map(serializeDoc)
  },
})

/**
 * Compteurs par dossier (utilisé par la home iDoc).
 */
export const summary = query({
  args: {},
  returns: v.array(
    v.object({
      folderId: FOLDER_VALIDATOR,
      count: v.number(),
      hasExpiring: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const user = await requireVerifiedAuth(ctx)
    const rows = await ctx.db
      .query("documentItem")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .take(2000)

    const now = Date.now()
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    const counts = new Map<string, { count: number; hasExpiring: boolean }>()
    for (const folder of VAULT_FOLDERS) {
      counts.set(folder, { count: 0, hasExpiring: false })
    }
    for (const d of rows) {
      if (d.deletedAt !== undefined) continue
      const e = counts.get(d.folderId)
      if (!e) continue
      e.count++
      if (d.expirationDate) {
        const exp = Date.parse(d.expirationDate)
        if (!Number.isNaN(exp) && exp - now < thirtyDays) {
          e.hasExpiring = true
        }
      }
    }
    return VAULT_FOLDERS.map((f) => ({
      folderId: f,
      count: counts.get(f)?.count ?? 0,
      hasExpiring: counts.get(f)?.hasExpiring ?? false,
    }))
  },
})

export const get = query({
  args: { itemId: v.id("documentItem") },
  returns: v.union(DOCUMENT_OUT, v.null()),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const item = await ctx.db.get(args.itemId)
    if (!item || item.userId !== user.userId || item.deletedAt !== undefined) {
      return null
    }
    return serializeDoc(item)
  },
})

/**
 * URL signée pour télécharger / prévisualiser le blob côté client.
 * Retourne null si l'item n'est pas accessible.
 */
export const getDownloadUrl = query({
  args: { itemId: v.id("documentItem") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const item = await ctx.db.get(args.itemId)
    if (!item || item.userId !== user.userId || item.deletedAt !== undefined) {
      return null
    }
    return await ctx.storage.getUrl(item.contentRef)
  },
})

/**
 * URL one-shot pour upload Convex storage (client-side).
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireVerifiedAuth(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const create = mutation({
  args: {
    folderId: FOLDER_VALIDATOR,
    contentRef: v.id("_storage"),
    name: v.string(),
    originalName: v.optional(v.string()),
    mimeType: v.string(),
    fileType: FILE_TYPE,
    fileSize: v.number(),
    expirationDate: v.optional(v.string()),
    side: v.optional(SIDE),
    pairedItemId: v.optional(v.id("documentItem")),
  },
  returns: v.id("documentItem"),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const now = Date.now()
    const id = await ctx.db.insert("documentItem", {
      userId: user.userId,
      folderId: args.folderId,
      contentRef: args.contentRef,
      name: args.name.trim(),
      originalName: args.originalName?.trim(),
      mimeType: args.mimeType,
      fileType: args.fileType,
      fileSize: args.fileSize,
      status: "verified", // pas de KYC requis sur upload simple
      expirationDate: args.expirationDate,
      side: args.side,
      pairedItemId: args.pairedItemId,
      createdAt: now,
      updatedAt: now,
    })
    return id
  },
})

export const remove = mutation({
  args: { itemId: v.id("documentItem") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const item = await loadOwned(ctx, args.itemId, user.userId)
    await ctx.db.patch(item._id, { deletedAt: Date.now() })
    // Le blob storage reste pour l'instant (purge ultérieure via cron).
    return null
  },
})
