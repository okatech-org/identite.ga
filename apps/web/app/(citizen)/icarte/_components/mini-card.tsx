"use client"

import * as React from "react"
import { EyeOff } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

import { icarte } from "../_content/fr"
import { CardArtIcon } from "./card-art-icon"

export type MiniCardData = {
  name: string
  subtitle?: string
  gradient: string // classes Tailwind ("from-X via-Y to-Z")
  iconKey: string
  isOfficialStyle: boolean
}

/**
 * Vignette featured (ratio 85/55) affichée dans la grille « Cartes dans
 * le Profil ». Variante `isOfficialStyle` = fond blanc + libellés verts
 * (style CNAMGS, cf spec §1.4).
 *
 * Le clic d'ouverture est géré par le parent (Reorder.Item via `onTap`
 * pour distinguer tap et drag) — d'où l'absence d'overlay clickable ici.
 * Le bouton « Retirer du profil » fait `stopPropagation` pour ne pas
 * déclencher l'ouverture.
 */
export function MiniCard({
  card,
  onRemoveFromProfile,
  className,
}: {
  card: MiniCardData
  onRemoveFromProfile?: () => void
  className?: string
}) {
  if (card.isOfficialStyle) {
    return (
      <div
        className={cn(
          "group relative flex aspect-[85/55] w-full select-none flex-col justify-between rounded-xl border border-border bg-white p-3 shadow-sm",
          className,
        )}
      >
        <div className="flex items-start justify-between text-idn-green">
          <CardArtIcon iconKey={card.iconKey} size={20} />
        </div>
        <div>
          <div className="text-[10px] font-bold leading-tight text-idn-green">
            {card.name}
          </div>
          {card.subtitle ? (
            <div className="mt-0.5 text-[8px] text-idn-green/60">
              {card.subtitle}
            </div>
          ) : null}
        </div>
        <div className="absolute bottom-2 right-2.5 text-[9px] font-semibold text-idn-green">
          {icarte.actions.open}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group relative aspect-[85/55] w-full select-none overflow-hidden rounded-xl bg-gradient-to-br p-3 text-white",
        card.gradient,
        className,
      )}
    >
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <CardArtIcon iconKey={card.iconKey} size={18} />
          {onRemoveFromProfile ? (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onRemoveFromProfile()
              }}
              title={icarte.actions.removeFromProfile}
              aria-label={icarte.actions.removeFromProfile}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-black/25 text-white transition-colors hover:bg-black/40"
            >
              <EyeOff className="h-2.5 w-2.5" />
            </button>
          ) : null}
        </div>
        <div>
          <div className="text-[10px] font-bold leading-tight">{card.name}</div>
          {card.subtitle ? (
            <div className="mt-0.5 text-[8px] text-white/75">
              {card.subtitle}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
