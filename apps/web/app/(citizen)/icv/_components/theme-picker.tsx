"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { cn } from "@repo/ui/lib/utils"

import {
  ICV_ACCENT,
  ICV_THEMES,
  THEME_CATEGORIES,
  type CvThemeId,
} from "../_content/themes"
import { icv } from "../_content/fr"

/**
 * Sélecteur compact de thème (panneau gauche `/icv`).
 * Affiche les 12 thèmes groupés par catégorie, met en évidence le thème
 * actif. Au clic, appelle `cv.profile.setTheme`.
 */
export function ThemePicker({
  cvId,
  activeTheme,
  onOpenGallery,
}: {
  cvId: Id<"citizenCv">
  activeTheme: CvThemeId
  onOpenGallery?: () => void
}) {
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
      <div className="mb-2.5 flex items-center gap-1.5">
        <Sparkles className="h-4 w-4" style={{ color: ICV_ACCENT }} />
        <h3 className="flex-1 text-sm font-bold text-foreground">
          {icv.themes.title}
        </h3>
        {onOpenGallery ? (
          <button
            type="button"
            onClick={onOpenGallery}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Galerie →
          </button>
        ) : null}
      </div>

      <div className="space-y-3">
        {THEME_CATEGORIES.map((cat) => {
          const themes = ICV_THEMES.filter((t) => t.category === cat)
          return (
            <div key={cat}>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-[1.2px] text-muted-foreground">
                {cat}
              </p>
              <div className="space-y-0.5">
                {themes.map((th) => {
                  const sel = th.id === activeTheme
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => handlePick(th.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                        sel
                          ? "bg-pink-50 dark:bg-pink-950/30"
                          : "hover:bg-muted",
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full shadow-sm"
                        style={{ background: th.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "truncate text-[12.5px] font-semibold",
                            sel ? "text-pink-700 dark:text-pink-300" : "text-foreground",
                          )}
                        >
                          {th.label}
                        </div>
                        <div className="truncate text-[10.5px] text-muted-foreground">
                          {th.desc}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
