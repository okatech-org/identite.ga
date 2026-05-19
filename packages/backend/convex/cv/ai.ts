import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { action, query } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { requireVerifiedAuth, requireVerifiedAuthInAction } from "../lib/auth"
import { withFallback } from "../lib/ai/registry"
import { AIProviderError } from "../lib/ai/types"
import { rateLimiter } from "../rateLimiter"
import { CV_AI_FEATURES, CV_AI_STATUSES } from "../schema"

/**
 * iCV — Actions IA citoyen.
 * Cf. PLAN_BACKEND_ICV.md §8 + SPECS_FEATURE_ICV.md §5.4.
 *
 * Chaque action suit ce pattern :
 *   1. Auth + rate-limit cvAi (10/jour/user).
 *   2. Crée un job `queued` (internal._createJob).
 *   3. Bascule en `running` + provider/model (internal._markRunning).
 *   4. Charge le CV (internal._getCvForAi).
 *   5. Appelle le provider via `withFallback`.
 *   6. Side-effects feature-specific (ex: clone CV pour optimize_job).
 *   7. `_markCompleted` ou `_markFailed`.
 *
 * Toutes les actions retournent l'`Id<"citizenCvAiJob">` (et l'`Id<"citizenCv">`
 * dérivé pour optimize_job). Le frontend lit le résultat via `getLastResult`.
 */

const FEATURE = v.union(...CV_AI_FEATURES.map((f) => v.literal(f)))
const STATUS = v.union(...CV_AI_STATUSES.map((s) => v.literal(s)))

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function serializeCvForPrompt(cv: Doc<"citizenCv">) {
  return {
    name: cv.name,
    firstName: cv.firstName,
    lastName: cv.lastName,
    email: cv.email,
    phone: cv.phone,
    address: cv.address,
    summary: cv.summary,
    portfolioUrl: cv.portfolioUrl,
    linkedinUrl: cv.linkedinUrl,
    experiences: cv.experiences.map((e) => ({
      id: e.id,
      title: e.title,
      company: e.company,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      description: e.description,
    })),
    education: cv.education.map((e) => ({
      degree: e.degree,
      school: e.school,
      year: e.year,
      description: e.description,
    })),
    skills: cv.skills.map((s) => ({ name: s.name, level: s.level })),
    languages: cv.languages.map((l) => ({ name: l.name, level: l.level })),
    hobbies: cv.hobbies,
  }
}

async function loadCvForAction(
  ctx: any,
  userId: string,
  cvId: Id<"citizenCv">,
): Promise<Doc<"citizenCv">> {
  const cv: Doc<"citizenCv"> | null = await ctx.runQuery(
    internal.cv.aiJobs._getCvForAi,
    { userId, cvId },
  )
  if (!cv) {
    throw new ConvexError({ code: "NOT_FOUND", message: "CV introuvable." })
  }
  return cv
}

// ─────────────────────────────────────────────────────────────────────────
// Prompts figés v1 (FR — cf. PLAN_BACKEND_ICV.md §8.1)
// ─────────────────────────────────────────────────────────────────────────

const SYSTEM_FR =
  "Tu es un expert en rédaction de CV professionnels en français. Réponds uniquement avec le JSON demandé, sans préambule ni commentaire."

const PROMPTS = {
  improve_summary: {
    schema: {
      type: "object",
      properties: { rewrittenSummary: { type: "string" } },
      required: ["rewrittenSummary"],
    } as Record<string, unknown>,
    user: (cv: ReturnType<typeof serializeCvForPrompt>) =>
      `Voici un CV. Réécris le résumé professionnel (~60-80 mots, impactant, sans superlatifs creux) en t'appuyant sur les expériences fournies.\n\nCV:\n${JSON.stringify(cv, null, 2)}`,
  },
  suggest_skills: {
    schema: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              level: {
                type: "string",
                enum: ["Débutant", "Intermédiaire", "Avancé", "Expert"],
              },
              rationale: { type: "string" },
            },
            required: ["name", "level", "rationale"],
          },
        },
      },
      required: ["suggestions"],
    } as Record<string, unknown>,
    user: (cv: ReturnType<typeof serializeCvForPrompt>) =>
      `Suggère jusqu'à 5 compétences pertinentes à ajouter à ce CV, en t'appuyant uniquement sur les expériences décrites. Évite les compétences déjà listées.\n\nCV:\n${JSON.stringify(cv, null, 2)}`,
  },
  optimize_job: {
    schema: {
      type: "object",
      properties: {
        tailoredSummary: { type: "string" },
        prioritizedExperienceIds: {
          type: "array",
          items: { type: "string" },
        },
        suggestedSkills: { type: "array", items: { type: "string" } },
        addedKeywords: { type: "array", items: { type: "string" } },
      },
      required: [
        "tailoredSummary",
        "prioritizedExperienceIds",
        "suggestedSkills",
        "addedKeywords",
      ],
    } as Record<string, unknown>,
    user: (
      cv: ReturnType<typeof serializeCvForPrompt>,
      jobOfferText: string,
    ) =>
      `On souhaite postuler à l'offre suivante. Adapte le CV : réécris le résumé, ordonne les expériences (les plus pertinentes d'abord), suggère des compétences à ajouter et liste les mots-clés à incorporer.\n\nOFFRE D'EMPLOI:\n${jobOfferText}\n\nCV:\n${JSON.stringify(cv, null, 2)}`,
  },
  generate_letter: {
    schema: {
      type: "object",
      properties: {
        letter: { type: "string" },
        suggestedSubject: { type: "string" },
      },
      required: ["letter", "suggestedSubject"],
    } as Record<string, unknown>,
    user: (
      cv: ReturnType<typeof serializeCvForPrompt>,
      recipient: string | undefined,
      tone: string,
    ) =>
      `Rédige une lettre de motivation en français (~250-300 mots) à partir de ce CV.\nDestinataire: ${recipient ?? "Madame, Monsieur"}\nTon souhaité: ${tone}\n\nCV:\n${JSON.stringify(cv, null, 2)}`,
  },
  ats_check: {
    schema: {
      type: "object",
      properties: {
        score: { type: "number", minimum: 0, maximum: 100 },
        breakdown: {
          type: "object",
          properties: {
            keywords: { type: "number" },
            structure: { type: "number" },
            length: { type: "number" },
            readability: { type: "number" },
          },
          required: ["keywords", "structure", "length", "readability"],
        },
        recommendations: {
          type: "array",
          maxItems: 6,
          items: { type: "string" },
        },
      },
      required: ["score", "breakdown", "recommendations"],
    } as Record<string, unknown>,
    user: (cv: ReturnType<typeof serializeCvForPrompt>) =>
      `Analyse ce CV avec le regard d'un ATS (Applicant Tracking System) et d'un recruteur. Donne un score 0-100, un détail par dimension (mots-clés, structure, longueur, lisibilité, chaque dimension sur 25), et 3 à 6 recommandations concrètes.\n\nCV:\n${JSON.stringify(cv, null, 2)}`,
  },
}

// ─────────────────────────────────────────────────────────────────────────
// Wrapper d'exécution commun
// ─────────────────────────────────────────────────────────────────────────

async function runJob<T extends Record<string, unknown>>(opts: {
  ctx: any
  userId: string
  cvId: Id<"citizenCv">
  feature: keyof typeof PROMPTS
  input?: Record<string, unknown>
  buildPrompt: (cv: Doc<"citizenCv">) => string
  schema: Record<string, unknown>
  onResult?: (result: T, cv: Doc<"citizenCv">, jobId: Id<"citizenCvAiJob">) => Promise<{
    derivedCvId?: Id<"citizenCv">
  } | void>
}): Promise<{ jobId: Id<"citizenCvAiJob">; derivedCvId?: Id<"citizenCv"> }> {
  const { ctx, userId, cvId, feature, input, buildPrompt, schema, onResult } = opts

  const jobId: Id<"citizenCvAiJob"> = await ctx.runMutation(
    internal.cv.aiJobs._createJob,
    { userId, cvId, feature, input },
  )

  try {
    const cv = await loadCvForAction(ctx, userId, cvId)
    const result = await withFallback(async (provider) => {
      await ctx.runMutation(internal.cv.aiJobs._markRunning, {
        jobId,
        provider: provider.id,
        model: provider.defaultModel,
      })
      return await provider.complete({
        task: `cv.${feature}`,
        system: SYSTEM_FR,
        prompt: buildPrompt(cv),
        jsonSchema: schema,
      })
    })

    if (!result.json) {
      throw new AIProviderError(
        "Le provider IA n'a pas renvoyé de JSON structuré.",
        "INVALID_RESPONSE",
        result.provider,
        false,
      )
    }

    let derivedCvId: Id<"citizenCv"> | undefined
    if (onResult) {
      const sideEffect = await onResult(result.json as T, cv, jobId)
      if (sideEffect && "derivedCvId" in sideEffect) {
        derivedCvId = sideEffect.derivedCvId
      }
    }

    await ctx.runMutation(internal.cv.aiJobs._markCompleted, {
      jobId,
      result: result.json,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      derivedCvId,
    })

    return { jobId, derivedCvId }
  } catch (err) {
    const message =
      err instanceof AIProviderError
        ? `${err.code}: ${err.message}`
        : (err as Error).message
    await ctx.runMutation(internal.cv.aiJobs._markFailed, {
      jobId,
      errorMessage: message,
    })
    throw err
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Actions publiques
// ─────────────────────────────────────────────────────────────────────────

export const improveSummary = action({
  args: { cvId: v.id("citizenCv") },
  returns: v.object({ jobId: v.id("citizenCvAiJob") }),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuthInAction(ctx)
    await rateLimiter.limit(ctx, "cvAi", { key: user.userId, throws: true })
    const { jobId } = await runJob({
      ctx,
      userId: user.userId,
      cvId: args.cvId,
      feature: "improve_summary",
      schema: PROMPTS.improve_summary.schema,
      buildPrompt: (cv) =>
        PROMPTS.improve_summary.user(serializeCvForPrompt(cv)),
    })
    return { jobId }
  },
})

export const suggestSkills = action({
  args: { cvId: v.id("citizenCv") },
  returns: v.object({ jobId: v.id("citizenCvAiJob") }),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuthInAction(ctx)
    await rateLimiter.limit(ctx, "cvAi", { key: user.userId, throws: true })
    const { jobId } = await runJob({
      ctx,
      userId: user.userId,
      cvId: args.cvId,
      feature: "suggest_skills",
      schema: PROMPTS.suggest_skills.schema,
      buildPrompt: (cv) =>
        PROMPTS.suggest_skills.user(serializeCvForPrompt(cv)),
    })
    return { jobId }
  },
})

export const optimizeForJob = action({
  args: {
    cvId: v.id("citizenCv"),
    jobOfferText: v.optional(v.string()),
    jobOfferUrl: v.optional(v.string()),
    newCvName: v.optional(v.string()),
  },
  returns: v.object({
    jobId: v.id("citizenCvAiJob"),
    derivedCvId: v.id("citizenCv"),
  }),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuthInAction(ctx)
    await rateLimiter.limit(ctx, "cvAi", { key: user.userId, throws: true })

    let jobOfferText = args.jobOfferText?.trim() ?? ""
    if (!jobOfferText && args.jobOfferUrl) {
      throw new ConvexError({
        code: "NOT_IMPLEMENTED",
        message:
          "Le scraping d'URL n'est pas encore disponible — collez le texte de l'offre.",
      })
    }
    if (jobOfferText.length < 30) {
      throw new ConvexError({
        code: "INVALID",
        message: "Le texte de l'offre est trop court (30 caractères minimum).",
      })
    }
    if (jobOfferText.length > 8000) {
      throw new ConvexError({
        code: "INVALID",
        message: "Le texte de l'offre est trop long (8000 caractères max).",
      })
    }

    const { jobId, derivedCvId } = await runJob({
      ctx,
      userId: user.userId,
      cvId: args.cvId,
      feature: "optimize_job",
      input: { jobOfferText, newCvName: args.newCvName },
      schema: PROMPTS.optimize_job.schema,
      buildPrompt: (cv) =>
        PROMPTS.optimize_job.user(serializeCvForPrompt(cv), jobOfferText),
      onResult: async (json: any, cv) => {
        const derived: Id<"citizenCv"> = await ctx.runMutation(
          internal.cv.aiJobs._createOptimizedCv,
          {
            userId: user.userId,
            sourceCvId: cv._id,
            newName: args.newCvName?.trim() || `${cv.name} — variant`,
            tailoredSummary: String(json.tailoredSummary ?? cv.summary),
            prioritizedExperienceIds: Array.isArray(json.prioritizedExperienceIds)
              ? (json.prioritizedExperienceIds as unknown[]).map(String)
              : [],
            suggestedSkills: Array.isArray(json.suggestedSkills)
              ? (json.suggestedSkills as unknown[]).map(String)
              : [],
          },
        )
        return { derivedCvId: derived }
      },
    })

    if (!derivedCvId) {
      throw new ConvexError({
        code: "INTERNAL",
        message: "Impossible de créer le CV optimisé.",
      })
    }
    return { jobId, derivedCvId }
  },
})

export const generateLetter = action({
  args: {
    cvId: v.id("citizenCv"),
    recipient: v.optional(v.string()),
    tone: v.optional(
      v.union(
        v.literal("formal"),
        v.literal("friendly"),
        v.literal("direct"),
      ),
    ),
  },
  returns: v.object({ jobId: v.id("citizenCvAiJob") }),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuthInAction(ctx)
    await rateLimiter.limit(ctx, "cvAi", { key: user.userId, throws: true })
    const tone = args.tone ?? "formal"
    const { jobId } = await runJob({
      ctx,
      userId: user.userId,
      cvId: args.cvId,
      feature: "generate_letter",
      input: { recipient: args.recipient, tone },
      schema: PROMPTS.generate_letter.schema,
      buildPrompt: (cv) =>
        PROMPTS.generate_letter.user(
          serializeCvForPrompt(cv),
          args.recipient,
          tone,
        ),
    })
    return { jobId }
  },
})

export const atsCheck = action({
  args: { cvId: v.id("citizenCv") },
  returns: v.object({ jobId: v.id("citizenCvAiJob") }),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuthInAction(ctx)
    await rateLimiter.limit(ctx, "cvAi", { key: user.userId, throws: true })
    const { jobId } = await runJob({
      ctx,
      userId: user.userId,
      cvId: args.cvId,
      feature: "ats_check",
      schema: PROMPTS.ats_check.schema,
      buildPrompt: (cv) => PROMPTS.ats_check.user(serializeCvForPrompt(cv)),
    })
    return { jobId }
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Queries de lecture des jobs
// ─────────────────────────────────────────────────────────────────────────

const JOB_OUT = v.object({
  _id: v.id("citizenCvAiJob"),
  cvId: v.id("citizenCv"),
  feature: FEATURE,
  status: STATUS,
  provider: v.optional(v.string()),
  model: v.optional(v.string()),
  result: v.optional(v.record(v.string(), v.any())),
  errorMessage: v.optional(v.string()),
  derivedCvId: v.optional(v.id("citizenCv")),
  tokensIn: v.optional(v.number()),
  tokensOut: v.optional(v.number()),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  createdAt: v.number(),
})

function serializeJob(j: Doc<"citizenCvAiJob">) {
  return {
    _id: j._id,
    cvId: j.cvId,
    feature: j.feature,
    status: j.status,
    provider: j.provider,
    model: j.model,
    result: j.result,
    errorMessage: j.errorMessage,
    derivedCvId: j.derivedCvId,
    tokensIn: j.tokensIn,
    tokensOut: j.tokensOut,
    startedAt: j.startedAt,
    completedAt: j.completedAt,
    createdAt: j.createdAt,
  }
}

export const getLastResult = query({
  args: { cvId: v.id("citizenCv"), feature: FEATURE },
  returns: v.union(JOB_OUT, v.null()),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const cv = await ctx.db.get(args.cvId)
    if (!cv || cv.userId !== user.userId) return null

    const job = await ctx.db
      .query("citizenCvAiJob")
      .withIndex("by_user_cv_feature", (q) =>
        q
          .eq("userId", user.userId)
          .eq("cvId", args.cvId)
          .eq("feature", args.feature),
      )
      .order("desc")
      .first()
    if (!job) return null
    return serializeJob(job)
  },
})

export const listJobs = query({
  args: { cvId: v.optional(v.id("citizenCv")), limit: v.optional(v.number()) },
  returns: v.array(JOB_OUT),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const limit = Math.min(args.limit ?? 50, 200)
    const jobs = args.cvId
      ? await ctx.db
          .query("citizenCvAiJob")
          .withIndex("by_user_cv", (q) =>
            q.eq("userId", user.userId).eq("cvId", args.cvId!),
          )
          .order("desc")
          .take(limit)
      : await ctx.db
          .query("citizenCvAiJob")
          .withIndex("by_userId", (q) => q.eq("userId", user.userId))
          .order("desc")
          .take(limit)
    return jobs.map(serializeJob)
  },
})
