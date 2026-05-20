"use client"

import * as React from "react"
import { ChevronRight, Edit3, Eye, EyeOff, Trash2 } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

import { icarte } from "../_content/fr"
import { CardArtIcon } from "./card-art-icon"

export type CardRowData = {
  name: string
  subtitle?: string
  gradient: string
  iconKey: string
  isOfficialStyle: boolean
  featured: boolean
}

/**
 * Ligne « autre carte » dans la colonne droite. Affiche vignette, nom,
 * sous-titre et trio d'actions (Modifier, Ajouter/Retirer du profil,
 * Supprimer). Cas spécial pour `isOfficialStyle` : pill « Voir » +
 * chevron à la place des actions, et pas de modifier/supprimer.
 */
export function CardRow({
  card,
  atMax,
  onOpen,
  onEdit,
  onToggleFeatured,
  onRemove,
  className,
}: {
  card: CardRowData
  atMax: boolean
  onOpen?: () => void
  onEdit?: () => void
  onToggleFeatured?: () => void
  onRemove?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-1 py-2",
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={card.name}
        className={cn(
          "flex h-8 w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br",
          card.isOfficialStyle ? "border border-border bg-white" : card.gradient,
        )}
      >
        <CardArtIcon
          iconKey={card.iconKey}
          size={15}
          className={card.isOfficialStyle ? "text-idn-green" : "text-white"}
        />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
      >
        <div className="truncate text-sm font-semibold text-foreground">
          {card.name}
        </div>
        {card.subtitle ? (
          <div className="truncate text-xs text-muted-foreground">
            {card.subtitle}
          </div>
        ) : null}
      </button>

      {card.isOfficialStyle ? (
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 rounded-full bg-idn-green-soft px-2.5 py-1 text-[11px] font-semibold text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark"
        >
          {icarte.actions.see}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ) : (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            title={icarte.actions.edit}
            aria-label={icarte.actions.edit}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleFeatured}
            disabled={!card.featured && atMax}
            title={
              card.featured
                ? icarte.actions.removeFromProfile
                : icarte.actions.addToProfile
            }
            aria-label={
              card.featured
                ? icarte.actions.removeFromProfile
                : icarte.actions.addToProfile
            }
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors enabled:hover:bg-secondary enabled:hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            {card.featured ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onRemove}
            title={icarte.actions.remove}
            aria-label={icarte.actions.remove}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-transparent text-[#B83A3A] transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
