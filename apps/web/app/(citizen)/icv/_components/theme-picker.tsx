"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { cn } from "@repo/ui/lib/utils"

import { ICV_ACCENT, ICV_THEMES, type CvThemeId } from "../_content/themes"
import { icv } from "../_content/fr"
import { CvPreviewA4, type PreviewCv } from "./cv-preview-a4"

/**
 * Sélecteur de thème compact — grille de mini-aperçus.
 * On a 6 thèmes au total : on les affiche tous dans une grille 3×2.
 * Le bouton "Plein écran" ouvre la galerie pour un aperçu plus grand.
 */

export function ThemePicker({
  cvId,
  activeTheme,
  onOpenGallery,
}: {
  cvId: Id<"citizenCv">
  /** Accepte n'importe quel string : les anciens IDs alias vers un des 6 actuels. */
  activeTheme: string
  onOpenGallery?: () => void
}) {
  const cv = useQuery(api.cv.profile.get, { cvId })
  const setTheme = useMutation(api.cv.profile.setTheme)

  async function handlePick(themeId: CvThemeId) {
    if (themeId === activeTheme) return
    try {
      await setTheme({ cvId, theme: themeId })
    } catch (e) {
      toast.error("Impossible de changer de thème.", {
        description: (e as Error).message,
      })
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkles className="h-4 w-4" style={{ color: ICV_ACCENT }} />
        <h3 className="flex-1 text-sm font-bold text-foreground">
          {icv.themes.title}
        </h3>
        {onOpenGallery ? (
          <button
            type="button"
            onClick={onOpenGallery}
            className="text-xs font-medium text-pink-600 transition-colors hover:underline dark:text-pink-400"
          >
            Plein écran →
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ICV_THEMES.map((th) => (
          <ThemeCard
            key={th.id}
            themeId={th.id}
            cv={cv as PreviewCv | undefined}
            active={th.id === activeTheme}
            onClick={() => handlePick(th.id)}
          />
        ))}
      </div>
    </div>
  )
}

function ThemeCard({
  themeId,
  cv,
  active,
  onClick,
}: {
  themeId: CvThemeId
  cv: PreviewCv | undefined
  active: boolean
  onClick: () => void
}) {
  const meta = ICV_THEMES.find((t) => t.id === themeId)!
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-1.5 rounded-lg border-2 p-1.5 transition-all",
        active
          ? "border-pink-500 bg-pink-50/60 shadow-sm dark:bg-pink-950/30"
          : "border-border hover:border-pink-300 hover:bg-muted/40",
      )}
    >
      {/* Mini-aperçu A4 */}
      <div className="relative aspect-[0.71] overflow-hidden rounded bg-white shadow-sm">
        {cv ? (
          <CvPreviewA4 cv={cv} themeId={themeId} targetWidth={70} />
        ) : (
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-stone-100 to-stone-200" />
        )}
      </div>
      <div className="flex items-center gap-1 px-0.5">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: meta.color }}
        />
        <span
          className={cn(
            "truncate text-[10.5px] font-semibold",
            active
              ? "text-pink-700 dark:text-pink-300"
              : "text-foreground",
          )}
        >
          {meta.label}
        </span>
      </div>
    </button>
  )
}
