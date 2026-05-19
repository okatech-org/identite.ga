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
 * iCV — Section « Formation ».
 */

const EDUCATION_INPUT = v.object({
  degree: v.string(),
  school: v.string(),
  year: v.string(),
  description: v.optional(v.string()),
})

function validateInput(args: {
  degree: string
  school: string
  year: string
  description?: string
}) {
  if (args.degree.trim().length < 1) {
    throw new ConvexError({ code: "INVALID", message: "Diplôme requis." })
  }
  if (args.school.trim().length < 1) {
    throw new ConvexError({ code: "INVALID", message: "Établissement requis." })
  }
  if (args.year.trim().length < 4) {
    throw new ConvexError({ code: "INVALID", message: "Année invalide." })
  }
  if (args.description !== undefined && args.description.length > 2000) {
    throw new ConvexError({
      code: "INVALID",
      message: "La description est trop longue.",
    })
  }
}

export const add = mutation({
  args: { cvId: v.id("citizenCv"), data: EDUCATION_INPUT },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)
    validateInput(args.data)

    const id = newEntryId()
    const newEntry = {
      id,
      position: nextPosition(cv.education),
      degree: args.data.degree.trim(),
      school: args.data.school.trim(),
      year: args.data.year,
      description: args.data.description,
    }
    const education = [...cv.education, newEntry]
    const score = computeCompletionScore({ ...cv, education })
    await ctx.db.patch(cv._id, {
      education,
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
      degree: v.optional(v.string()),
      school: v.optional(v.string()),
      year: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)
    const idx = cv.education.findIndex((e) => e.id === args.id)
    if (idx === -1) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Formation introuvable." })
    }
    const original = cv.education[idx]!
    const merged = {
      ...original,
      degree: args.patch.degree?.trim() ?? original.degree,
      school: args.patch.school?.trim() ?? original.school,
      year: args.patch.year ?? original.year,
      description:
        args.patch.description === undefined
          ? original.description
          : args.patch.description,
    }
    validateInput(merged)

    const education = [...cv.education]
    education[idx] = merged
    const score = computeCompletionScore({ ...cv, education })
    await ctx.db.patch(cv._id, {
      education,
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
    const education = cv.education.filter((e) => e.id !== args.id)
    if (education.length === cv.education.length) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Formation introuvable." })
    }
    const score = computeCompletionScore({ ...cv, education })
    await ctx.db.patch(cv._id, {
      education,
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
    if (args.orderedIds.length !== cv.education.length) {
      throw new ConvexError({
        code: "INVALID",
        message: "Le nombre d'IDs ne correspond pas au nombre de formations.",
      })
    }
    const byId = new Map(cv.education.map((e) => [e.id, e]))
    const education = args.orderedIds.map((id, i) => {
      const entry = byId.get(id)
      if (!entry) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Une formation référencée est introuvable.",
        })
      }
      return { ...entry, position: (i + 1) * POSITION_STEP }
    })
    await ctx.db.patch(cv._id, { education, updatedAt: Date.now() })
    return null
  },
})
