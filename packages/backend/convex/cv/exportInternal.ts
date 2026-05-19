import { ConvexError, v } from "convex/values"

import {
  internalMutation,
  internalQuery,
  query,
} from "../_generated/server"
import type { Id } from "../_generated/dataModel"
import { requireVerifiedAuth } from "../lib/auth"
import { CV_THEMES } from "../schema"

/**
 * iCV — Internals du module d'export PDF (séparé de `cv/export.ts` qui est
 * en `"use node"` et ne peut donc pas exposer queries / mutations Convex).
 */

const THEME = v.union(...CV_THEMES.map((t) => v.literal(t)))

const EXPORT_OUT = v.object({
  storageRef: v.id("_storage"),
  url: v.string(),
  expiresAt: v.number(),
})

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h

// ─────────────────────────────────────────────────────────────────────────
// Internal helpers (appelés depuis l'action `cv/export.ts`)
// ─────────────────────────────────────────────────────────────────────────

export const _getCvForExport = internalQuery({
  args: { userId: v.string(), cvId: v.id("citizenCv") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const cv = await ctx.db.get(args.cvId)
    if (!cv || cv.userId !== args.userId || cv.deletedAt !== undefined) {
      return null
    }
    return cv
  },
})

export const _findCachedExport = internalQuery({
  args: { contentHash: v.string() },
  returns: v.union(
    v.object({
      storageRef: v.id("_storage"),
      expiresAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("citizenCvExport")
      .withIndex("by_hash", (q) => q.eq("contentHash", args.contentHash))
      .order("desc")
      .first()
    if (!row || row.expiresAt < Date.now()) return null
    return { storageRef: row.storageRef, expiresAt: row.expiresAt }
  },
})

export const _recordExport = internalMutation({
  args: {
    userId: v.string(),
    cvId: v.id("citizenCv"),
    theme: THEME,
    contentHash: v.string(),
    storageRef: v.id("_storage"),
  },
  returns: v.id("citizenCvExport"),
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert("citizenCvExport", {
      userId: args.userId,
      cvId: args.cvId,
      theme: args.theme,
      contentHash: args.contentHash,
      storageRef: args.storageRef,
      expiresAt: now + CACHE_TTL_MS,
      createdAt: now,
    })
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Query publique : dernier export non expiré (pour bouton "Re-télécharger")
// ─────────────────────────────────────────────────────────────────────────

export const getLastUrl = query({
  args: {
    cvId: v.id("citizenCv"),
    theme: v.optional(THEME),
  },
  returns: v.union(EXPORT_OUT, v.null()),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const cv = await ctx.db.get(args.cvId)
    if (!cv || cv.userId !== user.userId || cv.deletedAt !== undefined) {
      return null
    }
    const theme = args.theme ?? cv.activeTheme

    const row = await ctx.db
      .query("citizenCvExport")
      .withIndex("by_user_cv", (q) =>
        q.eq("userId", user.userId).eq("cvId", args.cvId),
      )
      .order("desc")
      .first()
    if (!row || row.theme !== theme || row.expiresAt < Date.now()) {
      return null
    }
    const url = await ctx.storage.getUrl(row.storageRef)
    if (!url) return null
    return {
      storageRef: row.storageRef,
      url,
      expiresAt: row.expiresAt,
    }
  },
})
