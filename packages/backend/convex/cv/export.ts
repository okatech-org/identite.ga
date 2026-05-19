"use node"

import { ConvexError, v } from "convex/values"
import * as React from "react"
import { renderToBuffer } from "@react-pdf/renderer"
import { createHash } from "node:crypto"

import { internal } from "../_generated/api"
import { action } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { requireVerifiedAuthInAction } from "../lib/auth"
import { rateLimiter } from "../rateLimiter"
import { CV_THEMES } from "../schema"
import { PDF_THEMES } from "./pdfThemes"
import type { CvData } from "./pdfThemes/modern"

/**
 * iCV — Export PDF serveur.
 * Cf. PLAN_BACKEND_ICV.md §10 + SPECS_FEATURE_ICV.md §5.7.
 *
 * Pipeline (action Node) :
 *   1. Auth + rate-limit cvExport (30/jour/user).
 *   2. Charge le CV via `internal.cv.exportInternal._getCvForExport`.
 *   3. Calcule `contentHash = sha256(JSON canonique du CV + theme)`.
 *   4. Si un export non expiré existe avec ce hash → réutilise son blob.
 *   5. Sinon → render `@react-pdf/renderer` → upload Convex Storage →
 *      persiste dans `citizenCvExport`.
 *   6. Retourne `{ storageRef, url, expiresAt }`.
 */

const THEME = v.union(...CV_THEMES.map((t) => v.literal(t)))

const EXPORT_OUT = v.object({
  storageRef: v.id("_storage"),
  url: v.string(),
  expiresAt: v.number(),
})

export const renderPdf = action({
  args: {
    cvId: v.id("citizenCv"),
    theme: v.optional(THEME),
  },
  returns: EXPORT_OUT,
  handler: async (
    ctx,
    args,
  ): Promise<{
    storageRef: Id<"_storage">
    url: string
    expiresAt: number
  }> => {
    const auth = await requireVerifiedAuthInAction(ctx)
    await rateLimiter.limit(ctx, "cvExport", {
      key: auth.userId,
      throws: true,
    })

    // 1. Charge le CV
    const cv: Doc<"citizenCv"> | null = await ctx.runQuery(
      internal.cv.exportInternal._getCvForExport,
      { userId: auth.userId, cvId: args.cvId },
    )
    if (!cv) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "CV introuvable.",
      })
    }
    const theme = args.theme ?? cv.activeTheme

    // 2. Hash de contenu pour le cache
    const contentHash = hashCvForExport(cv, theme)

    // 3. Cache hit ?
    const cached: { storageRef: Id<"_storage">; expiresAt: number } | null =
      await ctx.runQuery(internal.cv.exportInternal._findCachedExport, {
        contentHash,
      })
    if (cached) {
      const url = await ctx.storage.getUrl(cached.storageRef)
      if (url) {
        return {
          storageRef: cached.storageRef,
          url,
          expiresAt: cached.expiresAt,
        }
      }
      // Le blob a été supprimé manuellement → on regénère.
    }

    // 4. Render PDF
    const Template = PDF_THEMES[theme]
    const cvData = toCvData(cv)
    let buffer: Buffer
    try {
      // Le typage de `renderToBuffer` exige un `ReactElement<DocumentProps>`
      // alors que notre Template wrappe `<Document>` — on cast vers `any`
      // pour faire passer le runtime (le composant retourne bien un Document).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const element = React.createElement(Template, { cv: cvData }) as any
      buffer = await renderToBuffer(element)
    } catch (e) {
      throw new ConvexError({
        code: "RENDER_FAILED",
        message: `Échec du rendu PDF : ${(e as Error).message}`,
      })
    }

    // 5. Upload Convex Storage
    const blob = new Blob([new Uint8Array(buffer)], {
      type: "application/pdf",
    })
    const storageRef: Id<"_storage"> = await ctx.storage.store(blob)

    // 6. Persiste la trace de cache
    await ctx.runMutation(internal.cv.exportInternal._recordExport, {
      userId: auth.userId,
      cvId: args.cvId,
      theme,
      contentHash,
      storageRef,
    })

    const url = await ctx.storage.getUrl(storageRef)
    if (!url) {
      throw new ConvexError({
        code: "STORAGE_FAILED",
        message: "Impossible de générer l'URL du PDF.",
      })
    }
    return {
      storageRef,
      url,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    }
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function toCvData(cv: Doc<"citizenCv">): CvData {
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
      id: e.id,
      degree: e.degree,
      school: e.school,
      year: e.year,
      description: e.description,
    })),
    skills: cv.skills.map((s) => ({
      id: s.id,
      name: s.name,
      level: s.level,
    })),
    languages: cv.languages.map((l) => ({
      id: l.id,
      name: l.name,
      level: l.level,
    })),
    hobbies: cv.hobbies,
  }
}

function hashCvForExport(cv: Doc<"citizenCv">, theme: string): string {
  // Sérialisation canonique (clés stables, pas d'`updatedAt`/`_creationTime`)
  const canon = {
    theme,
    firstName: cv.firstName,
    lastName: cv.lastName,
    email: cv.email,
    phone: cv.phone,
    address: cv.address,
    summary: cv.summary,
    portfolioUrl: cv.portfolioUrl ?? "",
    linkedinUrl: cv.linkedinUrl ?? "",
    experiences: cv.experiences
      .map((e) => `${e.position}|${e.title}|${e.company}|${e.startDate}|${e.endDate ?? ""}|${e.current}|${e.description}`)
      .join("\n"),
    education: cv.education
      .map((e) => `${e.position}|${e.degree}|${e.school}|${e.year}|${e.description ?? ""}`)
      .join("\n"),
    skills: cv.skills
      .map((s) => `${s.position}|${s.name}|${s.level}`)
      .join("\n"),
    languages: cv.languages
      .map((l) => `${l.position}|${l.name}|${l.level}`)
      .join("\n"),
    hobbies: cv.hobbies.join("|"),
  }
  return createHash("sha256")
    .update(JSON.stringify(canon))
    .digest("hex")
}
