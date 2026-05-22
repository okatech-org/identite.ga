"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { Check } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { cn } from "@repo/ui/lib/utils"

import {
  ICV_ACCENT,
  ICV_THEMES,
  THEME_CATEGORIES,
  getThemeById,
  type CvThemeId,
  type ThemeCategory,
} from "../_content/themes"
import { icv } from "../_content/fr"
import { CvPreviewA4, type PreviewCv } from "./cv-preview-a4"

export function ThemesGalleryModal({
  open,
  onOpenChange,
  cvId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cvId: Id<"citizenCv"> | null
}) {
  const cv = useQuery(api.cv.profile.get, cvId ? { cvId } : "skip")
  const setTheme = useMutation(api.cv.profile.setTheme)
  const [selected, setSelected] = React.useState<CvThemeId | null>(null)
  const [filter, setFilter] = React.useState<ThemeCategory | "Tous">("Tous")
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (open && cv) {
      setSelected(cv.activeTheme as CvThemeId)
      setFilter("Tous")
      setPending(false)
    }
  }, [open, cv])

  if (!cv) return null

  async function handleApply() {
    if (!cvId || !selected || pending) return
    if (selected === cv?.activeTheme) {
      onOpenChange(false)
      return
    }
    setPending(true)
    try {
      await setTheme({ cvId, theme: selected })
      toast.success("Thème appliqué.")
      onOpenChange(false)
    } catch (e) {
      toast.error("Impossible d'appliquer.", {
        description: (e as Error).message,
      })
    } finally {
      setPending(false)
    }
  }

  const filtered =
    filter === "Tous"
      ? ICV_THEMES
      : ICV_THEMES.filter((t) => t.category === filter)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] sm:max-w-[1100px]">
        <DialogHeader>
          <DialogTitle>{icv.themes.gallery}</DialogTitle>
          <DialogDescription>{icv.themes.galleryDesc}</DialogDescription>
        </DialogHeader>

        {/* Filtres horizontaux — bien plus compact que des intertitres */}
        <div className="flex flex-wrap gap-2">
          <FilterPill
            label={`Tous · ${ICV_THEMES.length}`}
            active={filter === "Tous"}
            onClick={() => setFilter("Tous")}
          />
          {THEME_CATEGORIES.map((cat) => {
            const count = ICV_THEMES.filter((t) => t.category === cat).length
            return (
              <FilterPill
                key={cat}
                label={`${cat} · ${count}`}
                active={filter === cat}
                onClick={() => setFilter(cat)}
              />
            )
          })}
        </div>

        <div className="max-h-[58vh] overflow-auto pr-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((th) => {
              const sel = th.id === selected
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setSelected(th.id)}
                  className={cn(
                    "group flex flex-col gap-2 rounded-xl border-[1.5px] p-2 text-left transition-all",
                    sel
                      ? "border-pink-500 bg-pink-50/70 shadow-sm dark:bg-pink-950/30"
                      : "border-border bg-card hover:border-pink-300 hover:shadow-sm",
                  )}
                >
                  <div className="relative aspect-[0.71] overflow-hidden rounded-md bg-white shadow-sm">
                    <div className="origin-top-left scale-[0.72]">
                      <CvPreviewA4 cv={cv as PreviewCv} themeId={th.id} />
                    </div>
                    {sel ? (
                      <div
                        className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full shadow"
                        style={{ background: ICV_ACCENT }}
                      >
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: th.color }}
                      />
                      <span
                        className={cn(
                          "truncate text-[13px] font-bold",
                          sel
                            ? "text-pink-700 dark:text-pink-300"
                            : "text-foreground",
                        )}
                      >
                        {th.label}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {th.desc}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {icv.create.cancel}
          </Button>
          <Button type="button" onClick={handleApply} disabled={!selected || pending}>
            {selected
              ? icv.themes.apply(getThemeById(selected).label)
              : icv.themes.apply("…")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        active
          ? "border-pink-500 bg-pink-500 text-white"
          : "border-border bg-card text-foreground/80 hover:bg-muted",
      )}
    >
      {label}
    </button>
  )
}
