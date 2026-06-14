import { ConvexError, v } from "convex/values"
import { Workpool, vOnCompleteArgs } from "@convex-dev/workpool"

import { components, internal } from "../_generated/api"
import {
  action,
  internalAction,
  internalMutation,
  query,
} from "../_generated/server"
import type { ActionCtx } from "../_generated/server"
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
 * Exécution asynchrone via Workpool (concurrence bornée) :
 *   1. L'action publique authentifie, applique le rate-limit cvAi
 *      (10/jour/user), crée un job `queued` et l'enfile dans `aiPool`.
 *      Elle retourne immédiatement `{ jobId }` — le frontend lit la suite
 *      via `getLastResult` (queued → running → completed/failed).
 *   2. `_run` (poolé) charge le CV et appelle le provider via `withFallback`.
 *   3. `_onComplete` écrit l'état terminal (exactly-once) et, pour
 *      `optimize_job`, crée le CV dérivé à partir du JSON IA.
 *
 * Le passage en async (vs appel synchrone) est imposé par Workpool : borner
 * la concurrence provider exige de découpler l'exécution de la requête client.
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
// Exécution via Workpool (concurrence bornée + retry au niveau pool)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Pool d'exécution des jobs IA. `maxParallelism` borne le nombre d'appels
 * provider (Gemini…) concurrents pour lisser les pics et éviter les 429,
 * indépendamment du rate-limit par utilisateur (10/jour) qui, lui, protège
 * du spam individuel.
 */
const aiPool = new Workpool(components.aiWorkpool, { maxParallelism: 5 })

type CvAiFeature = (typeof CV_AI_FEATURES)[number]

function buildPromptAndSchema(
  feature: CvAiFeature,
  cv: Doc<"citizenCv">,
  input: Record<string, unknown> | undefined,
): { prompt: string; schema: Record<string, unknown> } {
  const s = serializeCvForPrompt(cv)
  switch (feature) {
    case "improve_summary":
      return {
        prompt: PROMPTS.improve_summary.user(s),
        schema: PROMPTS.improve_summary.schema,
      }
    case "suggest_skills":
      return {
        prompt: PROMPTS.suggest_skills.user(s),
        schema: PROMPTS.suggest_skills.schema,
      }
    case "ats_check":
      return {
        prompt: PROMPTS.ats_check.user(s),
        schema: PROMPTS.ats_check.schema,
      }
    case "generate_letter":
      return {
        prompt: PROMPTS.generate_letter.user(
          s,
          typeof input?.recipient === "string" ? input.recipient : undefined,
          typeof input?.tone === "string" ? input.tone : "formal",
        ),
        schema: PROMPTS.generate_letter.schema,
      }
    case "optimize_job":
      return {
        prompt: PROMPTS.optimize_job.user(
          s,
          typeof input?.jobOfferText === "string" ? input.jobOfferText : "",
        ),
        schema: PROMPTS.optimize_job.schema,
      }
  }
}

/** Contexte transmis du site d'enqueue au callback `_onComplete`. */
const AI_JOB_CONTEXT = v.object({
  jobId: v.id("citizenCvAiJob"),
  userId: v.string(),
  cvId: v.id("citizenCv"),
  feature: FEATURE,
  newCvName: v.optional(v.string()),
})

/**
 * Enfile l'exécution d'un job IA dans le pool. `_run` est idempotent (aucun
 * side-effect hors `_markRunning`) : les écritures terminales et la création
 * du CV dérivé se font dans `_onComplete`, exactly-once. Le retry pool est
 * donc sûr.
 */
async function enqueueAiJob(
  ctx: ActionCtx,
  opts: {
    jobId: Id<"citizenCvAiJob">
    userId: string
    cvId: Id<"citizenCv">
    feature: CvAiFeature
    input?: Record<string, unknown>
    newCvName?: string
  },
): Promise<void> {
  await aiPool.enqueueAction(
    ctx,
    internal.cv.ai._run,
    {
      jobId: opts.jobId,
      userId: opts.userId,
      cvId: opts.cvId,
      feature: opts.feature,
      input: opts.input,
    },
    {
      retry: true,
      onComplete: internal.cv.ai._onComplete,
      context: {
        jobId: opts.jobId,
        userId: opts.userId,
        cvId: opts.cvId,
        feature: opts.feature,
        newCvName: opts.newCvName,
      },
    },
  )
}

/**
 * Exécuteur poolé : charge le CV, appelle le provider IA via `withFallback`,
 * et renvoie le JSON structuré. Idempotent — relançable par le pool.
 */
export const _run = internalAction({
  args: {
    jobId: v.id("citizenCvAiJob"),
    userId: v.string(),
    cvId: v.id("citizenCv"),
    feature: FEATURE,
    input: v.optional(v.record(v.string(), v.any())),
  },
  returns: v.object({
    json: v.record(v.string(), v.any()),
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const cv = await loadCvForAction(ctx, args.userId, args.cvId)
    const built = buildPromptAndSchema(args.feature, cv, args.input)

    const result = await withFallback(async (provider) => {
      await ctx.runMutation(internal.cv.aiJobs._markRunning, {
        jobId: args.jobId,
        provider: provider.id,
        model: provider.defaultModel,
      })
      return await provider.complete({
        task: `cv.${args.feature}`,
        system: SYSTEM_FR,
        prompt: built.prompt,
        jsonSchema: built.schema,
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

    return {
      json: result.json,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    }
  },
})

/**
 * Callback de terminaison du pool. Écrit l'état terminal du job (exactly-once)
 * et, pour `optimize_job`, crée le CV dérivé à partir du JSON IA.
 */
export const _onComplete = internalMutation({
  args: vOnCompleteArgs(AI_JOB_CONTEXT),
  returns: v.null(),
  handler: async (ctx, { context, result }) => {
    if (result.kind !== "success") {
      const errorMessage =
        result.kind === "failed" ? result.error : "Job IA annulé."
      await ctx.runMutation(internal.cv.aiJobs._markFailed, {
        jobId: context.jobId,
        errorMessage,
      })
      return null
    }

    const ret = result.returnValue as {
      json: Record<string, unknown>
      tokensIn?: number
      tokensOut?: number
    }

    let derivedCvId: Id<"citizenCv"> | undefined
    if (context.feature === "optimize_job") {
      const json = ret.json
      const source = await ctx.db.get(context.cvId)
      const fallbackName = source ? `${source.name} — variant` : "CV optimisé"
      derivedCvId = await ctx.runMutation(
        internal.cv.aiJobs._createOptimizedCv,
        {
          userId: context.userId,
          sourceCvId: context.cvId,
          newName: context.newCvName?.trim() || fallbackName,
          tailoredSummary: String(json.tailoredSummary ?? ""),
          prioritizedExperienceIds: Array.isArray(json.prioritizedExperienceIds)
            ? (json.prioritizedExperienceIds as unknown[]).map(String)
            : [],
          suggestedSkills: Array.isArray(json.suggestedSkills)
            ? (json.suggestedSkills as unknown[]).map(String)
            : [],
        },
      )
    }

    await ctx.runMutation(internal.cv.aiJobs._markCompleted, {
      jobId: context.jobId,
      result: ret.json,
      tokensIn: ret.tokensIn,
      tokensOut: ret.tokensOut,
      derivedCvId,
    })
    return null
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Actions publiques
// ─────────────────────────────────────────────────────────────────────────

export const improveSummary = action({
  args: { cvId: v.id("citizenCv") },
  returns: v.object({ jobId: v.id("citizenCvAiJob") }),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuthInAction(ctx)
    await rateLimiter.limit(ctx, "cvAi", { key: user.userId, throws: true })
    const jobId: Id<"citizenCvAiJob"> = await ctx.runMutation(
      internal.cv.aiJobs._createJob,
      { userId: user.userId, cvId: args.cvId, feature: "improve_summary" },
    )
    await enqueueAiJob(ctx, {
      jobId,
      userId: user.userId,
      cvId: args.cvId,
      feature: "improve_summary",
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
    const jobId: Id<"citizenCvAiJob"> = await ctx.runMutation(
      internal.cv.aiJobs._createJob,
      { userId: user.userId, cvId: args.cvId, feature: "suggest_skills" },
    )
    await enqueueAiJob(ctx, {
      jobId,
      userId: user.userId,
      cvId: args.cvId,
      feature: "suggest_skills",
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
  returns: v.object({ jobId: v.id("citizenCvAiJob") }),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuthInAction(ctx)
    await rateLimiter.limit(ctx, "cvAi", { key: user.userId, throws: true })

    const jobOfferText = args.jobOfferText?.trim() ?? ""
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

    const newCvName = args.newCvName?.trim() || undefined
    const input: Record<string, unknown> = { jobOfferText }
    if (newCvName) input.newCvName = newCvName

    const jobId: Id<"citizenCvAiJob"> = await ctx.runMutation(
      internal.cv.aiJobs._createJob,
      {
        userId: user.userId,
        cvId: args.cvId,
        feature: "optimize_job",
        input,
      },
    )
    await enqueueAiJob(ctx, {
      jobId,
      userId: user.userId,
      cvId: args.cvId,
      feature: "optimize_job",
      input,
      newCvName,
    })
    return { jobId }
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
    const input: Record<string, unknown> = { tone }
    if (args.recipient) input.recipient = args.recipient
    const jobId: Id<"citizenCvAiJob"> = await ctx.runMutation(
      internal.cv.aiJobs._createJob,
      {
        userId: user.userId,
        cvId: args.cvId,
        feature: "generate_letter",
        input,
      },
    )
    await enqueueAiJob(ctx, {
      jobId,
      userId: user.userId,
      cvId: args.cvId,
      feature: "generate_letter",
      input,
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
    const jobId: Id<"citizenCvAiJob"> = await ctx.runMutation(
      internal.cv.aiJobs._createJob,
      { userId: user.userId, cvId: args.cvId, feature: "ats_check" },
    )
    await enqueueAiJob(ctx, {
      jobId,
      userId: user.userId,
      cvId: args.cvId,
      feature: "ats_check",
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
