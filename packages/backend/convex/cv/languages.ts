import { ConvexError, v } from "convex/values"

import { mutation } from "../functions"
import { requireVerifiedAuth } from "../lib/auth"
import { rateLimiter } from "../rateLimiter"
import {
  computeCompletionScore,
  loadOwnedCv,
  newEntryId,
  nextPosition,
  POSITION_STEP,
} from "./shared"

/**
 * iCV — Section « Langues ».
 */

const LANG_LEVEL = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
  v.literal("C1"),
  v.literal("C2"),
  v.literal("Natif"),
)

const LANG_INPUT = v.object({
  name: v.string(),
  level: LANG_LEVEL,
})

function validateInput(args: { name: string }) {
  if (args.name.trim().length < 1) {
    throw new ConvexError({ code: "INVALID", message: "Nom de la langue requis." })
  }
  if (args.name.length > 40) {
    throw new ConvexError({
      code: "INVALID",
      message: "Le nom de la langue est trop long.",
    })
  }
}

export const add = mutation({
  args: { cvId: v.id("citizenCv"), data: LANG_INPUT },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)
    validateInput(args.data)
    const id = newEntryId()
    const newEntry = {
      id,
      position: nextPosition(cv.languages),
      name: args.data.name.trim(),
      level: args.data.level,
    }
    const languages = [...cv.languages, newEntry]
    const score = computeCompletionScore({ ...cv, languages })
    await ctx.db.patch(cv._id, {
      languages,
      completionScore: score,
      updatedAt: Date.now(),
    })
    return id
  },
})

export const update = mutation({
  args: {
    cvId: v.id("citizenCv"),
    id: v.string(),
    patch: v.object({
      name: v.optional(v.string()),
      level: v.optional(LANG_LEVEL),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)
    const idx = cv.languages.findIndex((e) => e.id === args.id)
    if (idx === -1) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Langue introuvable." })
    }
    const original = cv.languages[idx]!
    const merged = {
      ...original,
      name: args.patch.name?.trim() ?? original.name,
      level: args.patch.level ?? original.level,
    }
    validateInput(merged)
    const languages = [...cv.languages]
    languages[idx] = merged
    const score = computeCompletionScore({ ...cv, languages })
    await ctx.db.patch(cv._id, {
      languages,
      completionScore: score,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const remove = mutation({
  args: { cvId: v.id("citizenCv"), id: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)
    const languages = cv.languages.filter((e) => e.id !== args.id)
    if (languages.length === cv.languages.length) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Langue introuvable." })
    }
    const score = computeCompletionScore({ ...cv, languages })
    await ctx.db.patch(cv._id, {
      languages,
      completionScore: score,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const reorder = mutation({
  args: {
    cvId: v.id("citizenCv"),
    orderedIds: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)
    if (new Set(args.orderedIds).size !== args.orderedIds.length) {
      throw new ConvexError({ code: "INVALID", message: "IDs en double." })
    }
    if (args.orderedIds.length !== cv.languages.length) {
      throw new ConvexError({
        code: "INVALID",
        message: "Le nombre d'IDs ne correspond pas au nombre de langues.",
      })
    }
    const byId = new Map(cv.languages.map((e) => [e.id, e]))
    const languages = args.orderedIds.map((id, i) => {
      const entry = byId.get(id)
      if (!entry) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Une langue référencée est introuvable.",
        })
      }
      return { ...entry, position: (i + 1) * POSITION_STEP }
    })
    await ctx.db.patch(cv._id, { languages, updatedAt: Date.now() })
    return null
  },
})
