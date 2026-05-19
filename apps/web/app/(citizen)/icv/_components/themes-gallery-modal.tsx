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
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (open && cv) {
      setSelected(cv.activeTheme as CvThemeId)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] sm:max-w-[1040px]">
        <DialogHeader>
          <DialogTitle>{icv.themes.gallery}</DialogTitle>
          <DialogDescription>{icv.themes.galleryDesc}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-auto pr-1">
          {THEME_CATEGORIES.map((cat) => {
            const themes = ICV_THEMES.filter((t) => t.category === cat)
            return (
              <div key={cat} className="mb-6">
                <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
                  {cat}
                </h4>
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
                  {themes.map((th) => {
                    const sel = th.id === selected
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => setSelected(th.id)}
                        className={cn(
                          "rounded-xl border-[1.5px] p-2.5 text-left transition-all",
                          sel
                            ? "border-pink-500 bg-pink-50/70 dark:bg-pink-950/30"
                            : "border-border bg-card hover:border-pink-300",
                        )}
                      >
                        <div className="aspect-[0.71] overflow-hidden rounded-md bg-white">
                          <div className="origin-top-left scale-[0.7]">
                            <CvPreviewA4 cv={cv as PreviewCv} themeId={th.id} />
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ background: th.color }}
                          />
                          <span
                            className={cn(
                              "text-[13px] font-bold",
                              sel
                                ? "text-pink-700 dark:text-pink-300"
                                : "text-foreground",
                            )}
                          >
                            {th.label}
                          </span>
                          {sel ? (
                            <Check
                              className="ml-auto h-3.5 w-3.5"
                              style={{ color: ICV_ACCENT }}
                            />
                          ) : null}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {th.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
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
