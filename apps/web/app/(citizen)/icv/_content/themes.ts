/**
 * Catalogue iCV — 6 thèmes alignés sur `gabon-diplomatie`. Le backend
 * (convex/schema.ts) conserve 12 IDs pour rétro-compatibilité avec les
 * CV existants ; les anciens IDs (startup, bold, tech, academic,
 * executive, compact) sont aliasés vers le template le plus proche par
 * `cv-templates.tsx`. Les utilisateurs ne voient désormais que ces 6.
 */

export type CvThemeId =
  | "modern"
  | "classic"
  | "minimalist"
  | "professional"
  | "creative"
  | "elegant"

export type ThemeCategory =
  | "Classique & Pro"
  | "Moderne"
  | "Créatif"

export interface CvThemeMeta {
  id: CvThemeId
  label: string
  desc: string
  category: ThemeCategory
  /** Couleur d'accent du thème (utilisée pour la pastille et l'aperçu). */
  color: string
}

export const ICV_THEMES: CvThemeMeta[] = [
  { id: "modern",       label: "Modern",     desc: "Sidebar sombre + timeline",       category: "Moderne",         color: "#0f172a" },
  { id: "professional", label: "Professional", desc: "Bandeau teal, sections marquées", category: "Classique & Pro", color: "#0f766e" },
  { id: "classic",      label: "Classic",    desc: "Centré serif, traits horizontaux", category: "Classique & Pro", color: "#374151" },
  { id: "minimalist",   label: "Minimalist", desc: "Helvetica, beaucoup d'air",       category: "Classique & Pro", color: "#1f2937" },
  { id: "creative",     label: "Creative",   desc: "Gradient rose/violet, glass",     category: "Créatif",         color: "#a855f7" },
  { id: "elegant",      label: "Elegant",    desc: "Playfair + accents amber",        category: "Créatif",         color: "#b45309" },
]

export const THEME_CATEGORIES: ThemeCategory[] = [
  "Classique & Pro",
  "Moderne",
  "Créatif",
]

export function getThemeById(id: string | undefined | null): CvThemeMeta {
  if (!id) return ICV_THEMES[0]!
  return ICV_THEMES.find((t) => t.id === id) ?? ICV_THEMES[0]!
}

export function themesByCategory(category: ThemeCategory): CvThemeMeta[] {
  return ICV_THEMES.filter((t) => t.category === category)
}

/** Couleur d'accent iCV (rose) — utilisée dans les chrome de la feature. */
export const ICV_ACCENT = "#EC4899"
export const ICV_ACCENT_SOFT = "#FCE7F3"
