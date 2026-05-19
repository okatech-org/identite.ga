"use node"

import type { CV_THEMES } from "../../schema"
import { ModernCvPdf } from "./modern"

/**
 * Registre des templates PDF pour les 12 thèmes iCV.
 *
 * Phase 1 : un seul template (`modern`) — tous les autres thèmes pointent
 * dessus en attendant la déclinaison visuelle. Le composant prend en entrée
 * le CV sérialisé via `cv/profile.serializeCv`.
 *
 * Quand un thème spécifique est conçu, créer `./{themeId}.tsx` et l'ajouter
 * dans la map ci-dessous.
 */

type Theme = (typeof CV_THEMES)[number]
export type CvPdfComponent = typeof ModernCvPdf

export const PDF_THEMES: Record<Theme, CvPdfComponent> = {
  modern: ModernCvPdf,
  classic: ModernCvPdf,
  minimalist: ModernCvPdf,
  professional: ModernCvPdf,
  creative: ModernCvPdf,
  startup: ModernCvPdf,
  bold: ModernCvPdf,
  tech: ModernCvPdf,
  academic: ModernCvPdf,
  executive: ModernCvPdf,
  elegant: ModernCvPdf,
  compact: ModernCvPdf,
}
