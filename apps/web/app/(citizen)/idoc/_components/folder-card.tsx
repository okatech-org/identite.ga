"use client"

import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

import { idoc } from "../_content/fr"
import type { FolderConfig } from "../_content/folders"

export type FolderCardProps = {
  folder: FolderConfig
  count: number
  hasExpiring: boolean
  /** `true` si l'utilisateur l'a déjà ouvert (persisté localStorage). */
  opened: boolean
  onSelect: () => void
}

/**
 * Vignette de dossier iDocument — accueil.
 * Composition visuelle (cf. SPECS §3.4.3) :
 *   - `closed-empty`  : count = 0 → dossier fermé opacité 30 %.
 *   - `closed-filled` : count > 0, jamais ouvert → dossier fermé plein.
 *   - `open-filled`   : count > 0, déjà ouvert → corps ouvert + papier qui dépasse.
 */
export function FolderCard({
  folder,
  count,
  hasExpiring,
  opened,
  onSelect,
}: FolderCardProps) {
  const empty = count === 0
  const Icon = folder.icon
  const showOpenedPaper = !empty && opened

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label={`${folder.label} — ${idoc.home.folderCount(count)}`}
    >
      {/* Folder stylisé */}
      <div className="relative h-[60px] w-[72px]">
        {/* Onglet arrière */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute left-1.5 top-1 h-2.5 w-7 rounded-t-md bg-gradient-to-br",
            folder.gradient,
            empty && "opacity-30",
          )}
        />
        {/* Corps du dossier */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 bottom-0 top-2.5 flex items-center justify-center bg-gradient-to-br text-white shadow-sm",
            folder.gradient,
            empty && "opacity-30",
          )}
          style={{ borderRadius: "5px 10px 8px 8px" }}
        >
          <Icon className="h-6 w-6" strokeWidth={1.7} />
        </div>
        {/* Doc qui dépasse (déjà ouvert) */}
        {showOpenedPaper ? (
          <div
            aria-hidden="true"
            className="absolute -right-1 top-3 h-5 w-4 rounded-l-sm bg-white shadow-[-2px_2px_4px_rgba(0,0,0,0.15)] dark:bg-stone-100"
          />
        ) : null}
        {/* Bullet "bientôt expirant" */}
        {hasExpiring ? (
          <span
            className="absolute -right-0.5 top-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-amber-500"
            aria-label={idoc.home.folderHasExpiring}
            title={idoc.home.folderHasExpiring}
          />
        ) : null}
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">{folder.label}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {idoc.home.folderCount(count)}
        </p>
      </div>
    </button>
  )
}
