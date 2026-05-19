import { ConvexError, v } from "convex/values"

import {
  internalMutation,
  internalQuery,
} from "../_generated/server"
import { CV_AI_FEATURES } from "../schema"
import {
  computeCompletionScore,
  POSITION_STEP,
  newEntryId,
} from "./shared"

/**
 * iCV — Cycle de vie des jobs IA (internal).
 *
 * Exposé uniquement aux actions `cv/ai.ts` — pas accessible directement
 * au client (toutes les mutations sont des `internalMutation`).
 */

const FEATURE = v.union(...CV_AI_FEATURES.map((f) => v.literal(f)))

export const _createJob = internalMutation({
  args: {
    userId: v.string(),
    cvId: v.id("citizenCv"),
    feature: FEATURE,
    input: v.optional(v.record(v.string(), v.any())),
  },
  returns: v.id("citizenCvAiJob"),
  handler: async (ctx, args) => {
    const cv = await ctx.db.get(args.cvId)
    if (!cv || cv.userId !== args.userId || cv.deletedAt !== undefined) {
      throw new ConvexError({ code: "NOT_FOUND", message: "CV introuvable." })
    }
    return await ctx.db.insert("citizenCvAiJob", {
      userId: args.userId,
      cvId: args.cvId,
      feature: args.feature,
      status: "queued",
      input: args.input,
      createdAt: Date.now(),
    })
  },
})

export const _markRunning = internalMutation({
  args: {
    jobId: v.id("citizenCvAiJob"),
    provider: v.string(),
    model: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "running",
      provider: args.provider,
      model: args.model,
      startedAt: Date.now(),
    })
    return null
  },
})

export const _markCompleted = internalMutation({
  args: {
    jobId: v.id("citizenCvAiJob"),
    result: v.record(v.string(), v.any()),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    derivedCvId: v.optional(v.id("citizenCv")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "completed",
      result: args.result,
      tokensIn: args.tokensIn,
      tokensOut: args.tokensOut,
      derivedCvId: args.derivedCvId,
      completedAt: Date.now(),
    })
    return null
  },
})

export const _markFailed = internalMutation({
  args: {
    jobId: v.id("citizenCvAiJob"),
    errorMessage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: "failed",
      errorMessage: args.errorMessage,
      completedAt: Date.now(),
    })
    return null
  },
})

/**
 * Lecture interne d'un CV pour les actions IA (qui ne peuvent pas faire
 * de `ctx.db.get`).
 */
export const _getCvForAi = internalQuery({
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

/**
 * Clone un CV existant et applique les recommandations IA d'`optimize_job`.
 *
 *   • `source = "ai_optimize"`, `derivedFromCvId = sourceCvId`
 *   • Réécrit `summary` avec `tailoredSummary`
 *   • Reordonne les expériences selon `prioritizedExperienceIds`
 *   • Ajoute les compétences IA suggérées (avec niveau « Avancé » par défaut)
 */
export const _createOptimizedCv = internalMutation({
  args: {
    userId: v.string(),
    sourceCvId: v.id("citizenCv"),
    newName: v.string(),
    tailoredSummary: v.string(),
    prioritizedExperienceIds: v.array(v.string()),
    suggestedSkills: v.array(v.string()),
  },
  returns: v.id("citizenCv"),
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceCvId)
    if (
      !source ||
      source.userId !== args.userId ||
      source.deletedAt !== undefined
    ) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "CV source introuvable.",
      })
    }

    // Reorder experiences selon la priorité IA, puis ajoute celles qui
    // n'étaient pas mentionnées à la fin (préserve l'historique complet).
    const byId = new Map(source.experiences.map((e) => [e.id, e]))
    const ordered: typeof source.experiences = []
    let pos = POSITION_STEP
    for (const id of args.prioritizedExperienceIds) {
      const e = byId.get(id)
      if (e) {
        ordered.push({ ...e, position: pos })
        pos += POSITION_STEP
        byId.delete(id)
      }
    }
    for (const e of byId.values()) {
      ordered.push({ ...e, position: pos })
      pos += POSITION_STEP
    }

    // Ajoute les compétences suggérées qui n'existent pas déjà.
    const existingSkillNames = new Set(
      source.skills.map((s) => s.name.toLowerCase()),
    )
    const skills = source.skills.map((s) => ({ ...s }))
    let skillPos = nextPosition(skills)
    for (const name of args.suggestedSkills) {
      if (!existingSkillNames.has(name.toLowerCase())) {
        skills.push({
          id: newEntryId(),
          position: skillPos,
          name,
          level: "Avancé",
        })
        skillPos += POSITION_STEP
        existingSkillNames.add(name.toLowerCase())
      }
    }

    const fields = {
      firstName: source.firstName,
      lastName: source.lastName,
      email: source.email,
      phone: source.phone,
      address: source.address,
      summary: args.tailoredSummary,
      portfolioUrl: source.portfolioUrl,
      linkedinUrl: source.linkedinUrl,
      activeTheme: source.activeTheme,
      experiences: ordered,
      education: source.education.map((e) => ({ ...e })),
      skills,
      languages: source.languages.map((l) => ({ ...l })),
      hobbies: [...source.hobbies],
    }
    const score = computeCompletionScore(fields)
    const now = Date.now()
    return await ctx.db.insert("citizenCv", {
      userId: args.userId,
      name: args.newName,
      isDefault: false,
      source: "ai_optimize",
      derivedFromCvId: args.sourceCvId,
      ...fields,
      completionScore: score,
      createdAt: now,
      updatedAt: now,
    })
  },
})

function nextPosition<T extends { position: number }>(items: T[]): number {
  let max = 0
  for (const i of items) if (i.position > max) max = i.position
  return max + POSITION_STEP
}
