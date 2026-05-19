import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import {
  internalMutation as rawInternalMutation,
  query,
} from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import type { QueryCtx, MutationCtx } from "../_generated/server"
import { authComponent } from "../auth"
import { mutation } from "../functions"
import { requireVerifiedAuth } from "../lib/auth"
import { rateLimiter } from "../rateLimiter"
import { CV_SOURCES, CV_THEMES } from "../schema"
import {
  computeCompletionScore,
  listActiveCvs,
  loadOwnedCv,
  MAX_CVS_PER_USER,
} from "./shared"

/**
 * iCV — Gestion multi-CV.
 * Cf. PLAN_BACKEND_ICV.md §3 + SPECS_FEATURE_ICV.md §3.
 */

const SOURCE = v.union(...CV_SOURCES.map((s) => v.literal(s)))
const THEME = v.union(...CV_THEMES.map((t) => v.literal(t)))

// ─────────────────────────────────────────────────────────────────────────
// Validators de sortie
// ─────────────────────────────────────────────────────────────────────────

const CV_SUMMARY = v.object({
  _id: v.id("citizenCv"),
  name: v.string(),
  isDefault: v.boolean(),
  source: SOURCE,
  derivedFromCvId: v.optional(v.id("citizenCv")),
  activeTheme: THEME,
  completionScore: v.number(),
  updatedAt: v.number(),
})

function serializeSummary(cv: Doc<"citizenCv">) {
  return {
    _id: cv._id,
    name: cv.name,
    isDefault: cv.isDefault,
    source: cv.source,
    derivedFromCvId: cv.derivedFromCvId,
    activeTheme: cv.activeTheme,
    completionScore: cv.completionScore,
    updatedAt: cv.updatedAt,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

export const listMine = query({
  args: {},
  returns: v.array(CV_SUMMARY),
  handler: async (ctx) => {
    const user = await requireVerifiedAuth(ctx)
    const cvs = await listActiveCvs(ctx, user.userId)
    // Tri : default d'abord, puis updatedAt desc.
    cvs.sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
    return cvs.map(serializeSummary)
  },
})

export const getDefaultId = query({
  args: {},
  returns: v.union(v.id("citizenCv"), v.null()),
  handler: async (ctx) => {
    const user = await requireVerifiedAuth(ctx)
    const cv = await ctx.db
      .query("citizenCv")
      .withIndex("by_userId_default", (q) =>
        q.eq("userId", user.userId).eq("isDefault", true),
      )
      .first()
    if (!cv || cv.deletedAt !== undefined) return null
    return cv._id
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Helpers de création
// ─────────────────────────────────────────────────────────────────────────

type CvWritableFields = Pick<
  Doc<"citizenCv">,
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "address"
  | "summary"
  | "portfolioUrl"
  | "linkedinUrl"
  | "activeTheme"
  | "experiences"
  | "education"
  | "skills"
  | "languages"
  | "hobbies"
>

function emptyCvFields(): CvWritableFields {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    summary: "",
    portfolioUrl: undefined,
    linkedinUrl: undefined,
    activeTheme: "modern",
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    hobbies: [],
  }
}

function cloneCvFields(source: Doc<"citizenCv">): CvWritableFields {
  return {
    firstName: source.firstName,
    lastName: source.lastName,
    email: source.email,
    phone: source.phone,
    address: source.address,
    summary: source.summary,
    portfolioUrl: source.portfolioUrl,
    linkedinUrl: source.linkedinUrl,
    activeTheme: source.activeTheme,
    experiences: source.experiences.map((e) => ({ ...e })),
    education: source.education.map((e) => ({ ...e })),
    skills: source.skills.map((e) => ({ ...e })),
    languages: source.languages.map((e) => ({ ...e })),
    hobbies: [...source.hobbies],
  }
}

async function countActiveCvs(
  ctx: QueryCtx | MutationCtx,
  userId: string,
): Promise<number> {
  const all = await listActiveCvs(ctx, userId)
  return all.length
}

// ─────────────────────────────────────────────────────────────────────────
// Mutations citoyen
// ─────────────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    copyFromCvId: v.optional(v.id("citizenCv")),
  },
  returns: v.id("citizenCv"),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })

    const trimmed = args.name.trim()
    if (trimmed.length < 1 || trimmed.length > 80) {
      throw new ConvexError({
        code: "INVALID",
        message: "Le nom du CV doit faire entre 1 et 80 caractères.",
      })
    }

    const count = await countActiveCvs(ctx, user.userId)
    if (count >= MAX_CVS_PER_USER) {
      throw new ConvexError({
        code: "CV_LIMIT_REACHED",
        message: `Vous avez atteint la limite de ${MAX_CVS_PER_USER} CV.`,
      })
    }

    let fields: ReturnType<typeof emptyCvFields>
    let derivedFromCvId: Id<"citizenCv"> | undefined

    if (args.copyFromCvId) {
      const source = await loadOwnedCv(ctx, args.copyFromCvId, user.userId)
      fields = cloneCvFields(source)
      derivedFromCvId = source._id
    } else {
      fields = emptyCvFields()
      // Pré-remplit nom/email depuis Better Auth quand on crée un CV vierge.
      const authUser = await authComponent.getAnyUserById(ctx, user.userId)
      if (authUser) {
        const fullName = (authUser as { name?: string }).name ?? ""
        const parts = fullName.split(" ")
        fields.firstName = parts.slice(0, -1).join(" ") || parts[0] || ""
        fields.lastName = parts.length > 1 ? parts[parts.length - 1]! : ""
        fields.email = (authUser as { email?: string }).email ?? ""
      }
    }

    const score = computeCompletionScore(fields)
    const now = Date.now()
    const cvId = await ctx.db.insert("citizenCv", {
      userId: user.userId,
      name: trimmed,
      isDefault: count === 0, // si premier CV, devient default automatiquement
      source: "manual",
      derivedFromCvId,
      ...fields,
      completionScore: score,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_modified",
      targetType: "user",
      targetId: user.userId,
      metadata: { module: "cv", op: "cvs.create", cvId, copyFrom: derivedFromCvId },
    })

    return cvId
  },
})

export const rename = mutation({
  args: {
    cvId: v.id("citizenCv"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)
    const trimmed = args.name.trim()
    if (trimmed.length < 1 || trimmed.length > 80) {
      throw new ConvexError({
        code: "INVALID",
        message: "Le nom du CV doit faire entre 1 et 80 caractères.",
      })
    }
    await ctx.db.patch(cv._id, { name: trimmed, updatedAt: Date.now() })
    return null
  },
})

export const setDefault = mutation({
  args: { cvId: v.id("citizenCv") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const target = await loadOwnedCv(ctx, args.cvId, user.userId)
    if (target.isDefault) return null

    // Atomique : on retire isDefault de l'ancien default avant de le poser
    // sur la nouvelle cible.
    const oldDefault = await ctx.db
      .query("citizenCv")
      .withIndex("by_userId_default", (q) =>
        q.eq("userId", user.userId).eq("isDefault", true),
      )
      .first()
    const now = Date.now()
    if (oldDefault && oldDefault._id !== target._id) {
      await ctx.db.patch(oldDefault._id, { isDefault: false, updatedAt: now })
    }
    await ctx.db.patch(target._id, { isDefault: true, updatedAt: now })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_modified",
      targetType: "user",
      targetId: user.userId,
      metadata: { module: "cv", op: "cvs.setDefault", cvId: target._id },
    })
    return null
  },
})

export const remove = mutation({
  args: { cvId: v.id("citizenCv") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })
    const cv = await loadOwnedCv(ctx, args.cvId, user.userId)

    if (cv.isDefault) {
      throw new ConvexError({
        code: "CANNOT_DELETE_DEFAULT",
        message:
          "Impossible de supprimer le CV principal. Désignez d'abord un autre CV comme principal.",
      })
    }

    await ctx.db.patch(cv._id, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_modified",
      targetType: "user",
      targetId: user.userId,
      metadata: { module: "cv", op: "cvs.remove", cvId: cv._id },
    })
    return null
  },
})

export const restore = mutation({
  args: { cvId: v.id("citizenCv") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "cvWrite", { key: user.userId, throws: true })

    const cv = await ctx.db.get(args.cvId)
    if (!cv || cv.userId !== user.userId) {
      throw new ConvexError({ code: "NOT_FOUND", message: "CV introuvable." })
    }
    if (cv.deletedAt === undefined) return null

    const count = await countActiveCvs(ctx, user.userId)
    if (count >= MAX_CVS_PER_USER) {
      throw new ConvexError({
        code: "CV_LIMIT_REACHED",
        message: `Vous avez atteint la limite de ${MAX_CVS_PER_USER} CV. Supprimez-en un avant de restaurer.`,
      })
    }

    await ctx.db.patch(cv._id, {
      deletedAt: undefined,
      updatedAt: Date.now(),
    })
    return null
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Internal — seed depuis onboarding.selectProfile
// ─────────────────────────────────────────────────────────────────────────

export const ensureDefaultForUser = rawInternalMutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Idempotent : si l'user a déjà un CV non supprimé, on ne fait rien.
    const existing = await ctx.db
      .query("citizenCv")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first()
    if (existing) return null

    // Pré-remplit avec les infos Better Auth.
    const authUser = await authComponent.getAnyUserById(ctx, args.userId)
    const fullName = ((authUser as { name?: string } | null)?.name ?? "").trim()
    const parts = fullName.split(/\s+/).filter(Boolean)
    const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : (parts[0] ?? "")
    const lastName = parts.length > 1 ? parts[parts.length - 1]! : ""
    const email = (authUser as { email?: string } | null)?.email ?? ""

    const fields = {
      ...emptyCvFields(),
      firstName,
      lastName,
      email,
    }
    const score = computeCompletionScore(fields)
    const now = Date.now()
    await ctx.db.insert("citizenCv", {
      userId: args.userId,
      name: "CV principal",
      isDefault: true,
      source: "onboarding",
      ...fields,
      completionScore: score,
      createdAt: now,
      updatedAt: now,
    })
    return null
  },
})
