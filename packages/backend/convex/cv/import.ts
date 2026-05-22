import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { action } from "../_generated/server"
import type { Id } from "../_generated/dataModel"
import { withFallback } from "../lib/ai/registry"
import { requireVerifiedAuthInAction } from "../lib/auth"
import { AIProviderError } from "../lib/ai/types"
import { rateLimiter } from "../rateLimiter"

/**
 * iCV — Import PDF / image → CV structuré.
 * Cf. PLAN_BACKEND_ICV.md §9.
 *
 * Pipeline (action V8, plus de `"use node"`) :
 *   1. Auth + rate-limit cvImport check (sans consommer).
 *   2. Récupère le blob via `ctx.storage.get(storageRef)`.
 *   3. Encode le binaire en base64 et l'envoie tel quel au provider IA
 *      multimodal (Gemini) via `attachments`. Pas d'extraction de texte
 *      intermédiaire — le modèle lit directement le document.
 *   4. Consomme le quota APRÈS un appel IA réussi (les échecs ne
 *      pénalisent pas l'utilisateur).
 *   5. Applique le résultat :
 *      • mode `new` : crée un nouveau CV (`source = "import"`).
 *      • mode `merge` : patche les champs non vides sur le CV cible.
 *
 * Formats acceptés : PDF + images (PNG, JPEG, WebP, HEIC, HEIF). Gemini
 * traite ces formats nativement, plus besoin de pdf-parse / mammoth.
 */

const ACCEPTED_MIMES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
])

// Note : la mutation `generateUploadUrl` est dans `cv/importInternal.ts`.

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
        // Seul `title` est requis — on tolère les CV où une entreprise ou
        // une date manque, plutôt que de tout perdre.
        required: ["title"],
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
        required: ["degree"],
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
        required: ["name"],
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
        required: ["name"],
      },
    },
  },
} as Record<string, unknown>

const IMPORT_SYSTEM = `Tu es un expert en parsing de CV. Analyse le document fourni (PDF ou image) et remplis TOUS les champs du schéma JSON quand l'information est présente. Réponds UNIQUEMENT avec le JSON conforme, sans préambule.

MAPPING DES SECTIONS (les CV utilisent des intitulés très variés — sois flexible) :
• "Expériences", "Expérience professionnelle", "Projets professionnels", "Parcours", "Career", "Work" → experiences
• "Formation", "Éducation", "Études", "Diplômes", "Education", "Academic" → education
• "Compétences", "Skills", "Outils", "Technologies", "Tools", "Tech stack" → skills (1 objet par compétence)
• "Langues", "Languages" → languages
• "Profil", "À propos", "Résumé", "Summary", "About", "Présentation" → summary
• Téléphone, email, adresse/ville, URL portfolio, URL LinkedIn → champs racine correspondants

EXPÉRIENCES (extrais TOUTES les entrées, même si la mise en page utilise une timeline ou des projets) :
• title = poste OU nom du projet + rôle (ex. "SUITE PRO ALVO - Développeur Frontend")
• company = entreprise / client / employeur (extrais "Chez X" → "X")
• startDate / endDate = conserve le format du CV (ex. "Mai 2023", "01/2022", "2023")
• current = true si "Présent", "Aujourd'hui", "En cours", sinon false
• description = concatène la description du projet + les bullets de réalisations en un texte

FORMATION :
• degree = diplôme / certification (ex. "Master Conception Numérique", "Certification RNCP 6")
• school = école / université
• year = année d'obtention (ex. "Juin 2021", "2023")

LANGUES — mappe le niveau vers l'enum {A1, A2, B1, B2, C1, C2, Natif} :
• "Natif", "Native", "Maternelle" → "Natif"
• "Courant", "Fluent", "Bilingue" → "C2"
• "Avancé", "Advanced" → "C1"
• "Intermédiaire+", "Upper-intermediate" → "B2"
• "Intermédiaire", "Intermediate" → "B1"
• "Élémentaire", "Basic" → "A2"
• "Notions", "Beginner" → "A1"
• Si le CV indique déjà "C1", "B2" etc. → garde tel quel

COMPÉTENCES :
• Liste TOUTES les compétences trouvées, même sans niveau explicite
• Niveau par défaut si absent : "Intermédiaire"

Ne renvoie pas de tableau vide si la section existe : extrais ce que tu trouves, quitte à laisser des champs facultatifs vides.`

const IMPORT_PROMPT =
  "Analyse ce CV et extrais toutes les informations structurées."

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

    // Garde-fou (sans consommer) : bloque tôt si le quota du jour est
    // épuisé. La consommation effective se fait après un appel IA réussi.
    const quota = await rateLimiter.check(ctx, "cvImport", {
      key: auth.userId,
    })
    if (!quota.ok) {
      const hours = Math.ceil((quota.retryAfter ?? 0) / (60 * 60 * 1000))
      throw new ConvexError({
        code: "RATE_LIMITED",
        message: `Quota d'imports quotidien atteint. Réessayez dans ~${hours} h.`,
      })
    }

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

    // 2. Vérifie le MIME
    const mime = blob.type
    if (!ACCEPTED_MIMES.has(mime)) {
      throw new ConvexError({
        code: "INVALID",
        message: "Format non supporté. Utilisez un PDF ou une image.",
      })
    }

    // 3. Envoie directement au modèle multimodal
    const arrayBuffer = await blob.arrayBuffer()
    const base64 = bytesToBase64(new Uint8Array(arrayBuffer))

    let structured: ImportedCv
    try {
      const result = await withFallback((provider) =>
        provider.complete({
          task: "cv.import_extract",
          system: IMPORT_SYSTEM,
          prompt: IMPORT_PROMPT,
          jsonSchema: IMPORT_SCHEMA,
          attachments: [{ mimeType: mime, data: base64 }],
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

    // Consomme le quota MAINTENANT — l'appel Gemini a réussi, le coût est
    // réel. Les échecs avant ce point ne consomment rien.
    await rateLimiter.limit(ctx, "cvImport", {
      key: auth.userId,
      throws: true,
    })

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
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Encode un tableau d'octets en base64 (runtime V8 Convex — pas de `Buffer`).
 * Chunks de 8KB pour rester sous la limite d'arguments de `.apply()`.
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunkSize = 0x2000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode.apply(
      null,
      chunk as unknown as number[],
    )
  }
  return btoa(binary)
}

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
