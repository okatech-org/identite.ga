import { ConvexError } from "convex/values"

import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

/**
 * Helpers partagés du module iCV.
 * Pas de fonctions Convex (query/mutation) ici — uniquement des helpers TS
 * importés par les modules `cv/*.ts`.
 */

export const MAX_CVS_PER_USER = 10
export const POSITION_STEP = 1000

// ─────────────────────────────────────────────────────────────────────────
// Ownership
// ─────────────────────────────────────────────────────────────────────────

export async function loadOwnedCv(
  ctx: QueryCtx | MutationCtx,
  cvId: Id<"citizenCv">,
  userId: string,
): Promise<Doc<"citizenCv">> {
  const cv = await ctx.db.get(cvId)
  if (!cv || cv.userId !== userId || cv.deletedAt !== undefined) {
    throw new ConvexError({ code: "NOT_FOUND", message: "CV introuvable." })
  }
  return cv
}

export async function listActiveCvs(
  ctx: QueryCtx | MutationCtx,
  userId: string,
): Promise<Doc<"citizenCv">[]> {
  const all = await ctx.db
    .query("citizenCv")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect()
  return all.filter((c) => c.deletedAt === undefined)
}

// ─────────────────────────────────────────────────────────────────────────
// Calcul du score de complétion (0..100)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Calcule un score 0..100 basé sur la présence et la qualité des champs
 * du CV. Pondération conçue pour récompenser un CV "présentable" plutôt
 * qu'un CV exhaustif :
 *
 *   • Coordonnées (nom + prénom + email + téléphone)  → 15 pts
 *   • Résumé professionnel (>= 50 caractères)         → 10 pts
 *   • >= 1 expérience                                  → 20 pts (puis +5 par expérience supplémentaire, cap +10)
 *   • >= 1 formation                                   → 15 pts
 *   • >= 3 compétences                                 → 15 pts (palier : 1 → 5, 2 → 10, ≥3 → 15)
 *   • >= 1 langue                                      → 10 pts
 *   • Lien portfolio ou LinkedIn                       → 5 pts
 *
 * Total max : 100 pts.
 */
export function computeCompletionScore(cv: {
  firstName: string
  lastName: string
  email: string
  phone: string
  summary: string
  portfolioUrl?: string
  linkedinUrl?: string
  experiences: { title: string }[]
  education: unknown[]
  skills: unknown[]
  languages: unknown[]
}): number {
  let score = 0

  // Coordonnées (15)
  const hasCoords =
    cv.firstName.trim().length > 0 &&
    cv.lastName.trim().length > 0 &&
    cv.email.trim().length > 0 &&
    cv.phone.trim().length > 0
  if (hasCoords) score += 15

  // Résumé (10) — qualité minimum
  if (cv.summary.trim().length >= 50) score += 10

  // Expériences (20 + jusqu'à +10)
  const expCount = cv.experiences.length
  if (expCount >= 1) {
    score += 20
    score += Math.min(10, Math.max(0, expCount - 1) * 5)
  }

  // Formation (15)
  if (cv.education.length >= 1) score += 15

  // Compétences (15 par palier)
  const skillsCount = cv.skills.length
  if (skillsCount >= 3) score += 15
  else if (skillsCount === 2) score += 10
  else if (skillsCount === 1) score += 5

  // Langues (10)
  if (cv.languages.length >= 1) score += 10

  // Lien portfolio/linkedin (5)
  if (
    (cv.portfolioUrl && cv.portfolioUrl.trim().length > 0) ||
    (cv.linkedinUrl && cv.linkedinUrl.trim().length > 0)
  ) {
    score += 5
  }

  return Math.min(100, score)
}

export type CompletionLevel = "Débutant" | "Bon" | "Expert"

export function scoreToLevel(score: number): CompletionLevel {
  if (score >= 80) return "Expert"
  if (score >= 50) return "Bon"
  return "Débutant"
}

// ─────────────────────────────────────────────────────────────────────────
// Positions (drag-reorder pattern partagé avec walletCard)
// ─────────────────────────────────────────────────────────────────────────

export function nextPosition<T extends { position: number }>(items: T[]): number {
  let max = 0
  for (const i of items) if (i.position > max) max = i.position
  return max + POSITION_STEP
}

// ─────────────────────────────────────────────────────────────────────────
// Génération d'IDs aléatoires pour les entrées de sections embarquées
// ─────────────────────────────────────────────────────────────────────────

export function newEntryId(): string {
  return crypto.randomUUID()
}
