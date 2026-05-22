import { ConvexError, v } from "convex/values"

import { internalMutation } from "../_generated/server"
import type { Doc } from "../_generated/dataModel"
import { mutation } from "../functions"
import { requireVerifiedAuth } from "../lib/auth"
import {
  computeCompletionScore,
  MAX_CVS_PER_USER,
  newEntryId,
  POSITION_STEP,
} from "./shared"

/**
 * `generateUploadUrl` reste séparé de l'action `cv/import.ts` (les actions
 * Convex ne peuvent pas exposer de mutation). Pas de rate-limit ici — le
 * quota cvImport est consommé par `parseAndApply` uniquement après un
 * appel IA réussi (sinon une erreur réseau pénaliserait l'utilisateur).
 */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireVerifiedAuth(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * iCV — Internals d'application des CV importés (séparé de `cv/import.ts`
 * parce que ce dernier est en `"use node"` et ne peut pas exposer
 * d'internalMutations qui utilisent `ctx.db`).
 */

const SKILL_LEVEL = v.union(
  v.literal("Débutant"),
  v.literal("Intermédiaire"),
  v.literal("Avancé"),
  v.literal("Expert"),
)
const LANG_LEVEL = v.union(
  v.literal("A1"),
  v.literal("A2"),
  v.literal("B1"),
  v.literal("B2"),
  v.literal("C1"),
  v.literal("C2"),
  v.literal("Natif"),
)

const IMPORT_DATA = v.object({
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  summary: v.optional(v.string()),
  portfolioUrl: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
  experiences: v.optional(
    v.array(
      v.object({
        title: v.string(),
        company: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        current: v.boolean(),
        description: v.string(),
      }),
    ),
  ),
  education: v.optional(
    v.array(
      v.object({
        degree: v.string(),
        school: v.string(),
        year: v.string(),
        description: v.optional(v.string()),
      }),
    ),
  ),
  skills: v.optional(
    v.array(
      v.object({
        name: v.string(),
        level: SKILL_LEVEL,
      }),
    ),
  ),
  languages: v.optional(
    v.array(
      v.object({
        name: v.string(),
        level: LANG_LEVEL,
      }),
    ),
  ),
})

type ImportData = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  summary?: string
  portfolioUrl?: string
  linkedinUrl?: string
  experiences?: Array<{
    title: string
    company: string
    startDate: string
    endDate?: string
    current: boolean
    description: string
  }>
  education?: Array<{
    degree: string
    school: string
    year: string
    description?: string
  }>
  skills?: Array<{
    name: string
    level: "Débutant" | "Intermédiaire" | "Avancé" | "Expert"
  }>
  languages?: Array<{
    name: string
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Natif"
  }>
}

function buildExperiences(
  source: ImportData["experiences"] | undefined,
  startPos = POSITION_STEP,
): Doc<"citizenCv">["experiences"] {
  if (!source) return []
  return source.map((e, i) => ({
    id: newEntryId(),
    position: startPos + i * POSITION_STEP,
    title: e.title.trim(),
    company: e.company.trim(),
    startDate: e.startDate,
    endDate: e.current ? undefined : e.endDate,
    current: e.current,
    description: e.description,
  }))
}

function buildEducation(
  source: ImportData["education"] | undefined,
  startPos = POSITION_STEP,
): Doc<"citizenCv">["education"] {
  if (!source) return []
  return source.map((e, i) => ({
    id: newEntryId(),
    position: startPos + i * POSITION_STEP,
    degree: e.degree.trim(),
    school: e.school.trim(),
    year: e.year,
    description: e.description,
  }))
}

function buildSkills(
  source: ImportData["skills"] | undefined,
  startPos = POSITION_STEP,
): Doc<"citizenCv">["skills"] {
  if (!source) return []
  return source.map((e, i) => ({
    id: newEntryId(),
    position: startPos + i * POSITION_STEP,
    name: e.name.trim(),
    level: e.level,
  }))
}

function buildLanguages(
  source: ImportData["languages"] | undefined,
  startPos = POSITION_STEP,
): Doc<"citizenCv">["languages"] {
  if (!source) return []
  return source.map((e, i) => ({
    id: newEntryId(),
    position: startPos + i * POSITION_STEP,
    name: e.name.trim(),
    level: e.level,
  }))
}

function nextPos<T extends { position: number }>(items: T[]): number {
  let max = 0
  for (const i of items) if (i.position > max) max = i.position
  return max + POSITION_STEP
}

export const _applyAsNewCv = internalMutation({
  args: {
    userId: v.string(),
    newCvName: v.string(),
    data: IMPORT_DATA,
  },
  returns: v.id("citizenCv"),
  handler: async (ctx, args) => {
    // Cap 10/user (le rate-limit cvImport borne le débit, mais on garde
    // aussi la limite stricte pour éviter qu'un user n'ait 50 CV)
    const all = await ctx.db
      .query("citizenCv")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
    const active = all.filter((c) => c.deletedAt === undefined)
    if (active.length >= MAX_CVS_PER_USER) {
      throw new ConvexError({
        code: "CV_LIMIT_REACHED",
        message: `Limite de ${MAX_CVS_PER_USER} CV atteinte.`,
      })
    }

    const d = args.data as ImportData
    const fields = {
      firstName: d.firstName?.trim() ?? "",
      lastName: d.lastName?.trim() ?? "",
      email: d.email?.trim() ?? "",
      phone: d.phone?.trim() ?? "",
      address: d.address?.trim() ?? "",
      summary: d.summary?.trim() ?? "",
      portfolioUrl: d.portfolioUrl?.trim() || undefined,
      linkedinUrl: d.linkedinUrl?.trim() || undefined,
      activeTheme: "modern" as const,
      experiences: buildExperiences(d.experiences),
      education: buildEducation(d.education),
      skills: buildSkills(d.skills),
      languages: buildLanguages(d.languages),
      hobbies: [] as string[],
    }
    const score = computeCompletionScore(fields)
    const now = Date.now()
    return await ctx.db.insert("citizenCv", {
      userId: args.userId,
      name: args.newCvName,
      isDefault: false,
      source: "import",
      ...fields,
      completionScore: score,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const _mergeIntoCv = internalMutation({
  args: {
    userId: v.string(),
    targetCvId: v.id("citizenCv"),
    data: IMPORT_DATA,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const cv = await ctx.db.get(args.targetCvId)
    if (!cv || cv.userId !== args.userId || cv.deletedAt !== undefined) {
      throw new ConvexError({ code: "NOT_FOUND", message: "CV cible introuvable." })
    }

    const d = args.data as ImportData

    // Pour les champs racine : ne remplace que si la valeur source est non vide.
    function pick<T extends string | undefined>(
      newVal: T,
      current: string | undefined,
    ): T | string | undefined {
      if (typeof newVal === "string" && newVal.trim().length > 0) return newVal.trim()
      return current
    }

    const firstName = pick(d.firstName, cv.firstName) as string
    const lastName = pick(d.lastName, cv.lastName) as string
    const email = pick(d.email, cv.email) as string
    const phone = pick(d.phone, cv.phone) as string
    const address = pick(d.address, cv.address) as string
    const summary = pick(d.summary, cv.summary) as string
    const portfolioUrl = pick(d.portfolioUrl, cv.portfolioUrl) as
      | string
      | undefined
    const linkedinUrl = pick(d.linkedinUrl, cv.linkedinUrl) as
      | string
      | undefined

    // Pour les sections : on append (sans dédup). Le designer/UX peut
    // proposer plus tard un "écran de confirmation" si on veut éviter
    // les doublons — Phase 1 on accepte la concaténation.
    const experiences = [
      ...cv.experiences,
      ...buildExperiences(d.experiences, nextPos(cv.experiences)),
    ]
    const education = [
      ...cv.education,
      ...buildEducation(d.education, nextPos(cv.education)),
    ]
    const skills = [
      ...cv.skills,
      ...buildSkills(d.skills, nextPos(cv.skills)),
    ]
    const languages = [
      ...cv.languages,
      ...buildLanguages(d.languages, nextPos(cv.languages)),
    ]

    const merged = {
      firstName,
      lastName,
      email,
      phone,
      address,
      summary,
      portfolioUrl,
      linkedinUrl,
      experiences,
      education,
      skills,
      languages,
    }
    const score = computeCompletionScore({
      ...merged,
      portfolioUrl,
      linkedinUrl,
    })

    await ctx.db.patch(cv._id, {
      ...merged,
      completionScore: score,
      updatedAt: Date.now(),
    })
    return null
  },
})
