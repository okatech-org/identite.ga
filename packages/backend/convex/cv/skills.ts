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
 * iCV — Section « Compétences ».
 */

const SKILL_LEVEL = v.union(
  v.literal("Débutant"),
  v.literal("Intermédiaire"),
  v.literal("Avancé"),
  v.literal("Expert"),
)

const SKILL_INPUT = v.object({
  name: v.string(),
  level: SKILL_LEVEL,
})

function validateInput(args: { name: string }) {
  if (args.name.trim().length < 1) {
    throw new ConvexError({ code: "INVALID", message: "Nom de la compétence requis." })
  }
  if (args.name.length > 60) {
    throw new ConvexError({
      code: "INVALID",
      message: "Le nom de la compétence est trop long.",
    })
  }
}

export const add = mutation({
  args: { cvId: v.id("citizenCv"), data: SKILL_INPUT },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)
    validateInput(args.data)

    const id = newEntryId()
    const newEntry = {
      id,
      position: nextPosition(cv.skills),
      name: args.data.name.trim(),
      level: args.data.level,
    }
    const skills = [...cv.skills, newEntry]
    const score = computeCompletionScore({ ...cv, skills })
    await ctx.db.patch(cv._id, {
      skills,
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
      level: v.optional(SKILL_LEVEL),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)
    const idx = cv.skills.findIndex((e) => e.id === args.id)
    if (idx === -1) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Compétence introuvable." })
    }
    const original = cv.skills[idx]!
    const merged = {
      ...original,
      name: args.patch.name?.trim() ?? original.name,
      level: args.patch.level ?? original.level,
    }
    validateInput(merged)
    const skills = [...cv.skills]
    skills[idx] = merged
    const score = computeCompletionScore({ ...cv, skills })
    await ctx.db.patch(cv._id, {
      skills,
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
    const skills = cv.skills.filter((e) => e.id !== args.id)
    if (skills.length === cv.skills.length) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Compétence introuvable." })
    }
    const score = computeCompletionScore({ ...cv, skills })
    await ctx.db.patch(cv._id, {
      skills,
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
    if (args.orderedIds.length !== cv.skills.length) {
      throw new ConvexError({
        code: "INVALID",
        message: "Le nombre d'IDs ne correspond pas au nombre de compétences.",
      })
    }
    const byId = new Map(cv.skills.map((e) => [e.id, e]))
    const skills = args.orderedIds.map((id, i) => {
      const entry = byId.get(id)
      if (!entry) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Une compétence référencée est introuvable.",
        })
      }
      return { ...entry, position: (i + 1) * POSITION_STEP }
    })
    await ctx.db.patch(cv._id, { skills, updatedAt: Date.now() })
    return null
  },
})
