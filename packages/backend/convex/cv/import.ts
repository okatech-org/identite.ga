"use node"

import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { action } from "../_generated/server"
import type { Id } from "../_generated/dataModel"
import { withFallback } from "../lib/ai/registry"
import { requireVerifiedAuthInAction } from "../lib/auth"
import { AIProviderError } from "../lib/ai/types"
import { rateLimiter } from "../rateLimiter"

/**
 * iCV — Import PDF/DOCX → CV structuré.
 * Cf. PLAN_BACKEND_ICV.md §9.
 *
 * Pipeline (action Node) :
 *   1. Auth + rate-limit cvImport (5/jour).
 *   2. Récupère le blob via `ctx.storage.get(storageRef)`.
 *   3. Extrait le texte (pdf-parse pour PDF, mammoth pour DOCX).
 *   4. Envoie le texte au provider IA actif avec un JSON Schema strict.
 *   5. Applique le résultat :
 *      • mode `new` : crée un nouveau CV (`source = "import"`).
 *      • mode `merge` : patche les champs non vides sur le CV cible.
 *
 * Notes :
 *   • `"use node"` car pdf-parse et mammoth nécessitent les modules Node.
 *   • Pas de trace en `citizenCvAiJob` Phase 1 (table dédiée aux 5 features
 *     IA citoyen). Les exceptions remontent normalement au client.
 */

const MAX_PDF_PAGES = 20
const MAX_TEXT_CHARS = 30_000 // ~7 500 tokens d'entrée pour le LLM
const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

// Note : la mutation `generateUploadUrl` est dans `cv/importInternal.ts`
// (ce fichier est en `"use node"` et ne peut donc pas exposer de mutation).

// ─────────────────────────────────────────────────────────────────────────
// Action principale : parse + apply
// ─────────────────────────────────────────────────────────────────────────

const IMPORT_SCHEMA = {
  type: "object",
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    address: { type: "string" },
    summary: { type: "string" },
    portfolioUrl: { type: "string" },
    linkedinUrl: { type: "string" },
    experiences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          company: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          current: { type: "boolean" },
          description: { type: "string" },
        },
        required: ["title", "company", "startDate", "current", "description"],
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          degree: { type: "string" },
          school: { type: "string" },
          year: { type: "string" },
          description: { type: "string" },
        },
        required: ["degree", "school", "year"],
      },
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          level: {
            type: "string",
            enum: ["Débutant", "Intermédiaire", "Avancé", "Expert"],
          },
        },
        required: ["name", "level"],
      },
    },
    languages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          level: {
            type: "string",
            enum: ["A1", "A2", "B1", "B2", "C1", "C2", "Natif"],
          },
        },
        required: ["name", "level"],
      },
    },
  },
} as Record<string, unknown>

const IMPORT_SYSTEM =
  "Tu es un expert en parsing de CV. Extrais la structure du CV depuis le texte brut fourni. Réponds uniquement avec le JSON conforme au schéma, sans préambule. Si un champ n'est pas trouvé, omets-le. Pour les compétences sans niveau explicite, mets « Intermédiaire »."

export const parseAndApply = action({
  args: {
    storageRef: v.id("_storage"),
    mode: v.union(v.literal("new"), v.literal("merge")),
    targetCvId: v.optional(v.id("citizenCv")),
    newCvName: v.optional(v.string()),
  },
  returns: v.object({
    cvId: v.id("citizenCv"),
    appliedFields: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const auth = await requireVerifiedAuthInAction(ctx)
    await rateLimiter.limit(ctx, "cvImport", {
      key: auth.userId,
      throws: true,
    })

    if (args.mode === "merge" && !args.targetCvId) {
      throw new ConvexError({
        code: "INVALID",
        message: "Le mode `merge` requiert un targetCvId.",
      })
    }

    // 1. Récupère le blob
    const blob = await ctx.storage.get(args.storageRef)
    if (!blob) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Fichier introuvable. Veuillez le ré-uploader.",
      })
    }
    if (blob.size > 5 * 1024 * 1024) {
      throw new ConvexError({
        code: "INVALID",
        message: "Le fichier dépasse 5 MB. Compressez-le et réessayez.",
      })
    }

    // 2. Extrait le texte selon le type
    const mime = blob.type
    if (!ACCEPTED_MIME.has(mime)) {
      throw new ConvexError({
        code: "INVALID",
        message: "Format non supporté. Utilisez un PDF ou un DOCX.",
      })
    }
    let extractedText: string
    try {
      const buffer = Buffer.from(await blob.arrayBuffer())
      if (mime === "application/pdf") {
        const { PDFParse } = await import("pdf-parse")
        const parser = new PDFParse({ data: new Uint8Array(buffer) })
        try {
          const result = await parser.getText({
            last: MAX_PDF_PAGES,
          })
          extractedText = String(result.text ?? "")
        } finally {
          await parser.destroy()
        }
      } else {
        const mammoth = await import("mammoth")
        const result = await mammoth.extractRawText({ buffer })
        extractedText = String(result.value ?? "")
      }
    } catch (e) {
      throw new ConvexError({
        code: "PARSE_FAILED",
        message: `Échec de l'extraction du texte : ${(e as Error).message}`,
      })
    }
    extractedText = extractedText.replace(/\s+\n/g, "\n").trim()
    if (extractedText.length < 50) {
      throw new ConvexError({
        code: "EMPTY_DOCUMENT",
        message:
          "Le document ne contient pas assez de texte exploitable. Vérifiez qu'il n'est pas scanné en image.",
      })
    }
    if (extractedText.length > MAX_TEXT_CHARS) {
      extractedText = extractedText.slice(0, MAX_TEXT_CHARS)
    }

    // 3. Demande au LLM de structurer
    let structured: ImportedCv
    try {
      const result = await withFallback((provider) =>
        provider.complete({
          task: "cv.import_extract",
          system: IMPORT_SYSTEM,
          prompt: `Texte extrait :\n\n${extractedText}`,
          jsonSchema: IMPORT_SCHEMA,
        }),
      )
      if (!result.json) {
        throw new AIProviderError(
          "Le provider IA n'a pas renvoyé de JSON.",
          "INVALID_RESPONSE",
          result.provider,
          false,
        )
      }
      structured = result.json as ImportedCv
    } catch (e) {
      if (e instanceof AIProviderError) {
        throw new ConvexError({
          code: "AI_FAILED",
          message: `L'extraction IA a échoué : ${e.message}`,
        })
      }
      throw e
    }

    // 4. Apply
    if (args.mode === "new") {
      const cvId: Id<"citizenCv"> = await ctx.runMutation(
        internal.cv.importInternal._applyAsNewCv,
        {
          userId: auth.userId,
          newCvName: args.newCvName?.trim() || "CV importé",
          data: structured,
        },
      )
      return { cvId, appliedFields: listAppliedFields(structured) }
    } else {
      await ctx.runMutation(internal.cv.importInternal._mergeIntoCv, {
        userId: auth.userId,
        targetCvId: args.targetCvId!,
        data: structured,
      })
      return {
        cvId: args.targetCvId!,
        appliedFields: listAppliedFields(structured),
      }
    }
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

type ImportedCv = {
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

function listAppliedFields(d: ImportedCv): string[] {
  const fields: string[] = []
  for (const k of [
    "firstName",
    "lastName",
    "email",
    "phone",
    "address",
    "summary",
    "portfolioUrl",
    "linkedinUrl",
  ] as const) {
    if (d[k] && String(d[k]).trim().length > 0) fields.push(k)
  }
  if (d.experiences && d.experiences.length > 0)
    fields.push(`experiences(${d.experiences.length})`)
  if (d.education && d.education.length > 0)
    fields.push(`education(${d.education.length})`)
  if (d.skills && d.skills.length > 0) fields.push(`skills(${d.skills.length})`)
  if (d.languages && d.languages.length > 0)
    fields.push(`languages(${d.languages.length})`)
  return fields
}
