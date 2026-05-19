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
 * iCV — Section « Expériences professionnelles ».
 * Cf. PLAN_BACKEND_ICV.md §5.
 */

const EXPERIENCE_INPUT = v.object({
  title: v.string(),
  company: v.string(),
  startDate: v.string(),
  endDate: v.optional(v.string()),
  current: v.boolean(),
  description: v.string(),
})

function validateInput(args: {
  title: string
  company: string
  startDate: string
  endDate?: string
  current: boolean
  description: string
}) {
  if (args.title.trim().length < 1) {
    throw new ConvexError({ code: "INVALID", message: "Intitulé de poste requis." })
  }
  if (args.company.trim().length < 1) {
    throw new ConvexError({ code: "INVALID", message: "Nom de l'entreprise requis." })
  }
  if (args.startDate.trim().length < 4) {
    throw new ConvexError({ code: "INVALID", message: "Date de début invalide." })
  }
  // Règle métier : si `current === true`, pas de `endDate`.
  if (args.current && args.endDate && args.endDate.length > 0) {
    throw new ConvexError({
      code: "INVALID",
      message: "Un poste « actuel » ne peut pas avoir de date de fin.",
    })
  }
  if (args.description.length > 5000) {
    throw new ConvexError({
      code: "INVALID",
      message: "La description est trop longue (5000 caractères max).",
    })
  }
}

export const add = mutation({
  args: { cvId: v.id("citizenCv"), data: EXPERIENCE_INPUT },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)
    validateInput(args.data)

    const id = newEntryId()
    const newEntry = {
      id,
      position: nextPosition(cv.experiences),
      title: args.data.title.trim(),
      company: args.data.company.trim(),
      startDate: args.data.startDate,
      endDate: args.data.current ? undefined : args.data.endDate,
      current: args.data.current,
      description: args.data.description,
    }

    const experiences = [...cv.experiences, newEntry]
    const score = computeCompletionScore({ ...cv, experiences })
    await ctx.db.patch(cv._id, {
      experiences,
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
      title: v.optional(v.string()),
      company: v.optional(v.string()),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      current: v.optional(v.boolean()),
      description: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)

    const idx = cv.experiences.findIndex((e) => e.id === args.id)
    if (idx === -1) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Expérience introuvable." })
    }
    const original = cv.experiences[idx]!
    const merged = {
      ...original,
      title: args.patch.title?.trim() ?? original.title,
      company: args.patch.company?.trim() ?? original.company,
      startDate: args.patch.startDate ?? original.startDate,
      endDate:
        args.patch.endDate === undefined ? original.endDate : args.patch.endDate,
      current: args.patch.current ?? original.current,
      description:
        args.patch.description === undefined
          ? original.description
          : args.patch.description,
    }
    validateInput(merged)
    if (merged.current) merged.endDate = undefined

    const experiences = [...cv.experiences]
    experiences[idx] = merged
    const score = computeCompletionScore({ ...cv, experiences })
    await ctx.db.patch(cv._id, {
      experiences,
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
    const experiences = cv.experiences.filter((e) => e.id !== args.id)
    if (experiences.length === cv.experiences.length) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Expérience introuvable." })
    }
    const score = computeCompletionScore({ ...cv, experiences })
    await ctx.db.patch(cv._id, {
      experiences,
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
    if (args.orderedIds.length !== cv.experiences.length) {
      throw new ConvexError({
        code: "INVALID",
        message: "Le nombre d'IDs ne correspond pas au nombre d'expériences.",
      })
    }
    const byId = new Map(cv.experiences.map((e) => [e.id, e]))
    const experiences = args.orderedIds.map((id, i) => {
      const entry = byId.get(id)
      if (!entry) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Une expérience référencée est introuvable.",
        })
      }
      return { ...entry, position: (i + 1) * POSITION_STEP }
    })

    await ctx.db.patch(cv._id, {
      experiences,
      updatedAt: Date.now(),
    })
    return null
  },
})
