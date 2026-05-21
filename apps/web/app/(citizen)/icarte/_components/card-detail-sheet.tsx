"use client"

import * as React from "react"
import {
  Download,
  Edit3,
  QrCode,
  RotateCcw,
  Share2,
  Trash2,
} from "lucide-react"

import { Button } from "@repo/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@repo/ui/components/drawer"
import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { cn } from "@repo/ui/lib/utils"

import { formatDataLabel } from "../_content/cards"
import { icarte } from "../_content/fr"
import { CardArtIcon } from "./card-art-icon"

type CardDetail = {
  name: string
  subtitle?: string
  gradient: string
  iconKey: string
  isOfficialStyle: boolean
  data: Record<string, string>
  backData?: Record<string, string>
}

/**
 * Bottom sheet de détail d'une carte. Affiche la carte plein écran en
 * mode recto/verso (flip via bouton). Actions QR / Télécharger / Partager
 * désactivées (« Bientôt disponible »).
 */
export function CardDetailSheet({
  open,
  onOpenChange,
  card,
  onEdit,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: CardDetail | null
  onEdit?: () => void
  onDelete?: () => void
}) {
  const [verso, setVerso] = React.useState(false)

  // Reset au changement de carte / fermeture
  React.useEffect(() => {
    if (!open) setVerso(false)
  }, [open])

  if (!card) return null

  const frontEntries = Object.entries(card.data ?? {})
  const backEntries = Object.entries(card.backData ?? {})
  const visible = verso ? backEntries : frontEntries
  const hasBack = backEntries.length > 0
  const hasContent = visible.some(([, v]) => v && v.length > 0)

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <DrawerHeader>
          <DrawerTitle>{card.name}</DrawerTitle>
          <DrawerDescription className="sr-only">
            Détail de la carte {card.name}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-5 pb-2 sm:px-8">
          {/* Carte plein écran */}
          <div className="mx-auto w-full max-w-md">
            <div
              className={cn(
                "relative aspect-[85/55] w-full overflow-hidden rounded-2xl p-5 text-white shadow-xl",
                "bg-gradient-to-br",
                card.gradient,
              )}
              style={{
                boxShadow: "0 16px 38px rgba(14,124,58,0.28)",
              }}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/[0.08]" />
              <div className="pointer-events-none absolute bottom-3.5 right-3.5">
                <IdnFlagBars width={32} height={3} />
              </div>

              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <CardArtIcon iconKey={card.iconKey} size={28} />
                  <div className="flex items-center gap-2">
                    {hasBack ? (
                      <span className="rounded-full bg-white/15 px-2 py-1 text-[9px] font-semibold tracking-wider">
                        {verso ? icarte.detail.back : icarte.detail.front}
                      </span>
                    ) : null}
                    {hasBack ? (
                      <button
                        type="button"
                        onClick={() => setVerso((v) => !v)}
                        title={icarte.detail.flipHint}
                        aria-label={icarte.detail.flipHint}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-1 flex-col">
                  {!hasContent ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-white/85">
                      <Edit3 className="h-4 w-4" />
                      <p className="text-xs font-medium">
                        {icarte.detail.emptyHint}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {visible.map(([k, v]) => (
                        <div key={`${verso ? "b" : "f"}-${k}`}>
                          <div className="text-[9px] font-semibold tracking-wider text-white/70">
                            {formatDataLabel(k).toUpperCase()}
                          </div>
                          <div className="mt-0.5 truncate font-mono text-[13px]">
                            {v || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {hasBack ? (
              <button
                type="button"
                onClick={() => setVerso((v) => !v)}
                className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {icarte.detail.flipHint}
              </button>
            ) : null}
          </div>
        </div>

        <DrawerFooter className="gap-2">
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title={icarte.detail.comingSoon}
            >
              <QrCode className="h-3.5 w-3.5" />
              {icarte.detail.actions.qr}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title={icarte.detail.comingSoon}
            >
              <Download className="h-3.5 w-3.5" />
              {icarte.detail.actions.download}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title={icarte.detail.comingSoon}
            >
              <Share2 className="h-3.5 w-3.5" />
              {icarte.detail.actions.share}
            </Button>
          </div>
          {onEdit && !card.isOfficialStyle ? (
            <Button type="button" onClick={onEdit}>
              <Edit3 className="h-3.5 w-3.5" />
              {icarte.detail.actions.edit}
            </Button>
          ) : null}
          {onDelete && !card.isOfficialStyle ? (
            <Button type="button" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              {icarte.detail.actions.delete}
            </Button>
          ) : null}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
