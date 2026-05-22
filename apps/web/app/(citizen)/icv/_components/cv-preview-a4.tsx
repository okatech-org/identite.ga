"use client"

import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

import { H, renderTemplate, W } from "./cv-templates"

/**
 * Aperçu A4 d'un CV — dispatcher vers le template correspondant au thème.
 *
 * Les 12 modèles distincts vivent dans `./cv-templates.tsx` (un par
 * `CvThemeId`). Chacun a sa propre mise en page, palette, typographie.
 *
 * Format : 320×452 (ratio A4 × 0.226) à l'échelle 1. Utiliser `scale` pour
 * ajuster dans le contexte d'affichage (preview principal vs miniatures).
 * Le rendu PDF imprimable est produit côté serveur via `cv.export.renderPdf`.
 */

export interface PreviewCv {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  summary: string
  portfolioUrl?: string
  linkedinUrl?: string
  activeTheme?: string
  experiences: Array<{
    id: string
    title: string
    company: string
    startDate: string
    endDate?: string
    current: boolean
    description: string
  }>
  education: Array<{
    id: string
    degree: string
    school: string
    year: string
    description?: string
  }>
  skills: Array<{ id: string; name: string; level: string }>
  languages: Array<{ id: string; name: string; level: string }>
  hobbies: string[]
}

export function CvPreviewA4({
  cv,
  themeId,
  scale = 1,
  className,
}: {
  cv: PreviewCv
  /** Si non fourni, utilise `cv.activeTheme`. */
  themeId?: string
  scale?: number
  className?: string
}) {
  const id = themeId ?? cv.activeTheme ?? "modern"

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white shadow-[0_14px_30px_rgba(20,20,30,0.18)]",
        className,
      )}
      style={{
        width: W,
        height: H,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {renderTemplate(id, cv)}
    </div>
  )
}
