"use client"

import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

import { getThemeById } from "../_content/themes"

/**
 * Aperçu A4 d'un CV — rendu unifié Phase 1 (1 layout pour les 12 thèmes,
 * seule la couleur d'accent et la typographie changent). Le rendu final
 * imprimable est généré côté serveur via `cv.export.renderPdf`.
 *
 * Le composant prend un CV complet (cf. `api.cv.profile.get`) — il n'est
 * pas responsable du chargement.
 *
 * Format : 320x452 (ratio A4) à l'échelle 1. Utiliser `scale` pour ajuster
 * dans le contexte d'affichage (preview principal vs miniatures).
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

const W = 320
const H = 452

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
  const theme = getThemeById(themeId ?? cv.activeTheme)
  const fontFamily =
    theme.font === "serif"
      ? '"IBM Plex Serif", Georgia, serif'
      : theme.font === "mono"
        ? '"IBM Plex Mono", "JetBrains Mono", monospace'
        : 'system-ui, -apple-system, sans-serif'

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white text-[#16170F] shadow-[0_14px_30px_rgba(20,20,30,0.18)]",
        className,
      )}
      style={{
        width: W,
        height: H,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        fontFamily,
      }}
    >
      {/* Bandeau coloré en haut */}
      <div
        className="px-[22px] py-[18px] text-white"
        style={{ background: theme.color }}
      >
        <div className="text-[20px] font-bold leading-none tracking-[-0.4px]">
          {cv.firstName || "—"}{" "}
          <span className="font-normal opacity-85">{cv.lastName}</span>
        </div>
        {cv.experiences[0]?.title ? (
          <div className="mt-1 text-[10px] opacity-92">
            {cv.experiences[0].title}
          </div>
        ) : null}
        <div className="mt-2 text-[8px] opacity-86 tracking-[0.2px]">
          {[cv.email, cv.phone, cv.address].filter(Boolean).join(" · ")}
        </div>
      </div>

      {/* Corps */}
      <div className="flex-1 px-[22px] py-[14px] text-[8px] leading-[1.45]">
        {/* Profil */}
        {cv.summary ? (
          <>
            <Heading color={theme.color}>Profil</Heading>
            <p
              className="leading-[1.5]"
              style={{ color: "#74766B", fontSize: 8 }}
            >
              {cv.summary}
            </p>
          </>
        ) : null}

        {cv.experiences.length > 0 ? (
          <>
            <Heading color={theme.color}>Expériences</Heading>
            {cv.experiences.map((e) => (
              <div key={e.id} className="mb-1.5">
                <div className="flex justify-between gap-1.5">
                  <div className="font-bold text-[9px] text-[#16170F]">
                    {e.title}
                  </div>
                  <div
                    className="whitespace-nowrap text-[7px]"
                    style={{ color: "#74766B" }}
                  >
                    {formatDateRange(e.startDate, e.endDate, e.current)}
                  </div>
                </div>
                <div
                  className="text-[8px] font-semibold"
                  style={{ color: theme.color }}
                >
                  {e.company}
                </div>
                {e.description ? (
                  <p
                    className="mt-0.5 text-[7.5px]"
                    style={{ color: "#74766B" }}
                  >
                    {e.description}
                  </p>
                ) : null}
              </div>
            ))}
          </>
        ) : null}

        {cv.education.length > 0 ? (
          <>
            <Heading color={theme.color}>Formation</Heading>
            {cv.education.map((e) => (
              <div key={e.id} className="mb-0.5 flex justify-between">
                <div>
                  <div className="font-semibold text-[8.5px] text-[#16170F]">
                    {e.degree}
                  </div>
                  <div className="text-[7.5px]" style={{ color: "#74766B" }}>
                    {e.school}
                  </div>
                </div>
                <div className="text-[7px]" style={{ color: "#74766B" }}>
                  {e.year}
                </div>
              </div>
            ))}
          </>
        ) : null}

        {cv.skills.length > 0 ? (
          <>
            <Heading color={theme.color}>Compétences</Heading>
            <div className="flex flex-wrap gap-1">
              {cv.skills.map((s) => (
                <span
                  key={s.id}
                  className="rounded-full px-1.5 py-[2px] text-[7.5px] font-medium"
                  style={{ border: `1px solid ${theme.color}`, color: theme.color }}
                >
                  {s.name}
                </span>
              ))}
            </div>
          </>
        ) : null}

        {cv.languages.length > 0 ? (
          <>
            <Heading color={theme.color}>Langues</Heading>
            <div className="flex flex-wrap gap-2 text-[8px]">
              {cv.languages.map((l) => (
                <span key={l.id}>
                  {l.name}{" "}
                  <span style={{ color: "#74766B" }}>· {l.level}</span>
                </span>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function Heading({
  color,
  children,
}: {
  color: string
  children: React.ReactNode
}) {
  return (
    <div
      className="mt-3 mb-1.5 text-[9px] font-bold uppercase tracking-[1.2px]"
      style={{ color }}
    >
      {children}
    </div>
  )
}

function formatDateRange(start: string, end?: string, current?: boolean) {
  if (current) return `${start} → Aujourd'hui`
  if (!end) return start
  return `${start} → ${end}`
}
