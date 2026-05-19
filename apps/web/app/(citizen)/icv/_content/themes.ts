/**
 * Catalogue iCV des 12 thèmes — verbatim SPECS_FEATURE_ICV.md §9.
 * Doit rester aligné avec `CV_THEMES` côté backend (convex/schema.ts).
 */

export type CvThemeId =
  | "modern"
  | "classic"
  | "minimalist"
  | "professional"
  | "creative"
  | "startup"
  | "bold"
  | "tech"
  | "academic"
  | "executive"
  | "elegant"
  | "compact"

export type ThemeCategory =
  | "Classique & Pro"
  | "Créatif & Moderne"
  | "Spécialisé"

export interface CvThemeMeta {
  id: CvThemeId
  label: string
  desc: string
  category: ThemeCategory
  /** Couleur d'accent du thème (utilisée pour la pastille et l'aperçu). */
  color: string
  /** Famille typographique de l'aperçu A4. */
  font: "sans" | "serif" | "mono"
}

export const ICV_THEMES: CvThemeMeta[] = [
  // Classique & Pro
  { id: "modern", label: "Modern", desc: "Clean & contemporain", category: "Classique & Pro", color: "#3B82F6", font: "sans" },
  { id: "classic", label: "Classic", desc: "Intemporel", category: "Classique & Pro", color: "#6B7280", font: "serif" },
  { id: "minimalist", label: "Minimal", desc: "Épuré & simple", category: "Classique & Pro", color: "#1F2937", font: "sans" },
  { id: "professional", label: "Pro", desc: "Formel & sérieux", category: "Classique & Pro", color: "#0F766E", font: "sans" },
  // Créatif & Moderne
  { id: "creative", label: "Créatif", desc: "Artistique", category: "Créatif & Moderne", color: "#EC4899", font: "sans" },
  { id: "startup", label: "Startup", desc: "Tech & dynamique", category: "Créatif & Moderne", color: "#F97316", font: "sans" },
  { id: "bold", label: "Bold", desc: "Audacieux", category: "Créatif & Moderne", color: "#7C3AED", font: "sans" },
  { id: "tech", label: "Tech", desc: "IT & Digital", category: "Créatif & Moderne", color: "#06B6D4", font: "mono" },
  // Spécialisé
  { id: "academic", label: "Academic", desc: "Universitaire", category: "Spécialisé", color: "#0369A1", font: "serif" },
  { id: "executive", label: "Executive", desc: "Direction", category: "Spécialisé", color: "#1E3A5F", font: "serif" },
  { id: "elegant", label: "Elegant", desc: "Raffiné", category: "Spécialisé", color: "#9D4EDD", font: "serif" },
  { id: "compact", label: "Compact", desc: "Dense & efficace", category: "Spécialisé", color: "#059669", font: "sans" },
]

export const THEME_CATEGORIES: ThemeCategory[] = [
  "Classique & Pro",
  "Créatif & Moderne",
  "Spécialisé",
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
