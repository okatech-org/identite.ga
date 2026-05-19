import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { query } from "../_generated/server"
import type { Doc } from "../_generated/dataModel"
import { mutation } from "../functions"
import { requireVerifiedAuth } from "../lib/auth"
import { rateLimiter } from "../rateLimiter"
import { CV_SOURCES, CV_THEMES } from "../schema"
import { computeCompletionScore, loadOwnedCv } from "./shared"

/**
 * iCV — Champs racine + thème actif d'un CV donné.
 * Cf. PLAN_BACKEND_ICV.md §4.
 */

const THEME = v.union(...CV_THEMES.map((t) => v.literal(t)))
const SOURCE = v.union(...CV_SOURCES.map((s) => v.literal(s)))

// ─────────────────────────────────────────────────────────────────────────
// Validators de sortie : CV complet (avec sections embarquées)
// ─────────────────────────────────────────────────────────────────────────

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

const CV_FULL = v.object({
  _id: v.id("citizenCv"),
  name: v.string(),
  isDefault: v.boolean(),
  source: SOURCE,
  derivedFromCvId: v.optional(v.id("citizenCv")),
  firstName: v.string(),
  lastName: v.string(),
  email: v.string(),
  phone: v.string(),
  address: v.string(),
  summary: v.string(),
  portfolioUrl: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
  activeTheme: THEME,
  experiences: v.array(
    v.object({
      id: v.string(),
      position: v.number(),
      title: v.string(),
      company: v.string(),
      startDate: v.string(),
      endDate: v.optional(v.string()),
      current: v.boolean(),
      description: v.string(),
    }),
  ),
  education: v.array(
    v.object({
      id: v.string(),
      position: v.number(),
      degree: v.string(),
      school: v.string(),
      year: v.string(),
      description: v.optional(v.string()),
    }),
  ),
  skills: v.array(
    v.object({
      id: v.string(),
      position: v.number(),
      name: v.string(),
      level: SKILL_LEVEL,
    }),
  ),
  languages: v.array(
    v.object({
      id: v.string(),
      position: v.number(),
      name: v.string(),
      level: LANG_LEVEL,
    }),
  ),
  hobbies: v.array(v.string()),
  completionScore: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})

export function serializeCv(cv: Doc<"citizenCv">) {
  return {
    _id: cv._id,
    name: cv.name,
    isDefault: cv.isDefault,
    source: cv.source,
    derivedFromCvId: cv.derivedFromCvId,
    firstName: cv.firstName,
    lastName: cv.lastName,
    email: cv.email,
    phone: cv.phone,
    address: cv.address,
    summary: cv.summary,
    portfolioUrl: cv.portfolioUrl,
    linkedinUrl: cv.linkedinUrl,
    activeTheme: cv.activeTheme,
    experiences: cv.experiences,
    education: cv.education,
    skills: cv.skills,
    languages: cv.languages,
    hobbies: cv.hobbies,
    completionScore: cv.completionScore,
    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

export const get = query({
  args: { cvId: v.id("citizenCv") },
  returns: v.union(CV_FULL, v.null()),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const cv = await ctx.db.get(args.cvId)
    if (!cv || cv.userId !== user.userId || cv.deletedAt !== undefined) {
      return null
    }
    return serializeCv(cv)
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

const URL_PATTERN = /^https?:\/\/.+/i

function validatePatch(args: {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  summary?: string
  portfolioUrl?: string
  linkedinUrl?: string
}) {
  if (
    args.firstName !== undefined &&
    (args.firstName.trim().length < 1 || args.firstName.length > 80)
  ) {
    throw new ConvexError({ code: "INVALID", message: "Prénom invalide." })
  }
  if (
    args.lastName !== undefined &&
    (args.lastName.trim().length < 1 || args.lastName.length > 80)
  ) {
    throw new ConvexError({ code: "INVALID", message: "Nom invalide." })
  }
  if (args.email !== undefined && args.email.length > 0 && !args.email.includes("@")) {
    throw new ConvexError({ code: "INVALID", message: "Email invalide." })
  }
  if (args.phone !== undefined && args.phone.length > 30) {
    throw new ConvexError({ code: "INVALID", message: "Téléphone trop long." })
  }
  if (args.summary !== undefined && args.summary.length > 2000) {
    throw new ConvexError({
      code: "INVALID",
      message: "Le résumé professionnel ne peut pas dépasser 2000 caractères.",
    })
  }
  for (const [field, url] of [
    ["portfolioUrl", args.portfolioUrl],
    ["linkedinUrl", args.linkedinUrl],
  ] as const) {
    if (url !== undefined && url.length > 0 && !URL_PATTERN.test(url)) {
      throw new ConvexError({
        code: "INVALID",
        message: `URL ${field} invalide (doit commencer par http:// ou https://).`,
      })
    }
  }
}

export const upsert = mutation({
  args: {
    cvId: v.id("citizenCv"),
    patch: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      summary: v.optional(v.string()),
      portfolioUrl: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
      hobbies: v.optional(v.array(v.string())),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)

    validatePatch(args.patch)

    const merged = {
      firstName: args.patch.firstName ?? cv.firstName,
      lastName: args.patch.lastName ?? cv.lastName,
      email: args.patch.email ?? cv.email,
      phone: args.patch.phone ?? cv.phone,
      address: args.patch.address ?? cv.address,
      summary: args.patch.summary ?? cv.summary,
      portfolioUrl: args.patch.portfolioUrl ?? cv.portfolioUrl,
      linkedinUrl: args.patch.linkedinUrl ?? cv.linkedinUrl,
      hobbies: args.patch.hobbies ?? cv.hobbies,
    }
    const score = computeCompletionScore({
      ...merged,
      experiences: cv.experiences,
      education: cv.education,
      skills: cv.skills,
      languages: cv.languages,
    })

    await ctx.db.patch(cv._id, {
      ...merged,
      completionScore: score,
      updatedAt: Date.now(),
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_modified",
      targetType: "user",
      targetId: user.userId,
      metadata: { module: "cv", op: "profile.upsert", cvId: cv._id },
    })
    return null
  },
})

export const setTheme = mutation({
  args: {
    cvId: v.id("citizenCv"),
    theme: THEME,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)
    if (cv.activeTheme === args.theme) return null
    await ctx.db.patch(cv._id, {
      activeTheme: args.theme,
      updatedAt: Date.now(),
    })
    return null
  },
})
