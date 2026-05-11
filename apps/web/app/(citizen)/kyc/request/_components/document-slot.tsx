"use client"

import * as React from "react"
import { ExpandIcon } from "lucide-react"

import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"

const STRIPED_BG =
  "repeating-linear-gradient(45deg, var(--idn-surface-2), var(--idn-surface-2) 8px, #E8E5DC 8px, #E8E5DC 16px)"

/**
 * Vignette d'un document KYC — affiche l'image en `object-contain`
 * (sans rognage) avec lightbox plein cadre au clic. Réutilisable côté
 * citoyen (`/kyc/request`) et calque la version contrôleur.
 *
 * Optional `onReplace` : si fourni, affiche un bouton "Remplacer" pour
 * permettre au citoyen de ré-uploader l'image (cas `complement_required`).
 */
export function DocumentSlot({
  url,
  label,
  onReplace,
  replaceLabel,
}: {
  url: string | null
  label: string
  onReplace?: () => void
  replaceLabel?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      {url ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Agrandir : ${label}`}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-[12px] border border-border bg-idn-surface-2 transition-colors hover:ring-2 hover:ring-idn-green/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idn-green"
            style={{ aspectRatio: "1.6 / 1" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={label}
              className="size-full object-contain"
              loading="lazy"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 py-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                {label}
              </span>
              <ExpandIcon
                aria-hidden="true"
                className="size-3.5 text-white"
              />
            </span>
          </button>
          <DialogContent
            className="max-w-[90vw] sm:max-w-[1100px] p-0 overflow-hidden bg-background"
            showCloseButton={false}
          >
            <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-border px-5 py-3">
              <DialogTitle className="text-sm font-semibold text-foreground">
                {label}
              </DialogTitle>
              <DialogClose asChild>
                <Button variant="ghost" size="sm" aria-label="Fermer">
                  Fermer
                </Button>
              </DialogClose>
            </DialogHeader>
            <div className="flex max-h-[80vh] items-center justify-center bg-black/30 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={label}
                className="max-h-[78vh] w-auto max-w-full object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <div
          className="flex items-center justify-center rounded-[12px] border border-dashed border-border font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
          style={{ aspectRatio: "1.6 / 1", background: STRIPED_BG }}
        >
          Non fourni
        </div>
      )}
      {onReplace && replaceLabel && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReplace}
          className="w-full"
        >
          {replaceLabel}
        </Button>
      )}
    </div>
  )
}
