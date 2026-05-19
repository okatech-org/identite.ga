"use client"

import * as React from "react"
import Link from "next/link"
import { Check, ChevronDown, Plus } from "lucide-react"

import type { Id } from "@repo/backend/convex/_generated/dataModel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"

import { icv } from "../_content/fr"
import { ICV_ACCENT } from "../_content/themes"

interface CvSummary {
  _id: Id<"citizenCv">
  name: string
  isDefault: boolean
  source: "onboarding" | "manual" | "ai_optimize" | "import"
  completionScore: number
}

const SOURCE_BADGE: Record<CvSummary["source"], string> = {
  onboarding: icv.selector.sourceOnboarding,
  manual: icv.selector.sourceManual,
  ai_optimize: icv.selector.sourceAiOptimize,
  import: icv.selector.sourceImport,
}

const SOURCE_BADGE_COLOR: Record<CvSummary["source"], string> = {
  onboarding: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  manual: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ai_optimize: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  import: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
}

/**
 * Sélecteur de CV transverse (header `/icv` et `/icv/studio`).
 * Affiche le CV actif sous forme de pill + popover de switch.
 * Voir SPECS_FEATURE_ICV.md §3.
 */
export function CvSelector({
  cvs,
  activeCvId,
  onSelectCv,
  onCreateClick,
}: {
  cvs: CvSummary[]
  activeCvId: Id<"citizenCv"> | null
  onSelectCv: (id: Id<"citizenCv">) => void
  onCreateClick: () => void
}) {
  const active = cvs.find((c) => c._id === activeCvId) ?? cvs[0]
  if (!active) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <span className="max-w-[200px] truncate">{active.name}</span>
          {active.isDefault ? (
            <span
              className="rounded-full px-2 py-[1px] text-[10px] font-bold"
              style={{ color: ICV_ACCENT, background: "#FCE7F3" }}
            >
              {icv.selector.principalBadge}
            </span>
          ) : null}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[320px]">
        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Mes CV ({cvs.length}/10)
        </DropdownMenuLabel>
        {cvs.map((cv) => {
          const sel = cv._id === active._id
          return (
            <DropdownMenuItem
              key={cv._id}
              onSelect={() => onSelectCv(cv._id)}
              className="flex items-start gap-2 py-2"
            >
              <div className="mt-1 h-4 w-4 shrink-0">
                {sel ? (
                  <Check
                    className="h-4 w-4"
                    style={{ color: ICV_ACCENT }}
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">
                    {cv.name}
                  </span>
                  {cv.isDefault ? (
                    <span
                      className="rounded-full px-1.5 py-[1px] text-[9px] font-bold"
                      style={{ color: ICV_ACCENT, background: "#FCE7F3" }}
                    >
                      {icv.selector.principalBadge}
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span
                    className={`rounded px-1.5 py-[1px] text-[9px] font-medium ${SOURCE_BADGE_COLOR[cv.source]}`}
                  >
                    {SOURCE_BADGE[cv.source]}
                  </span>
                  <span>Score {cv.completionScore}</span>
                </div>
              </div>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onCreateClick}
          disabled={cvs.length >= 10}
          className="text-sm font-semibold"
          style={{ color: cvs.length >= 10 ? undefined : ICV_ACCENT }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {cvs.length >= 10
            ? icv.list.limitReached
            : icv.selector.newCv}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/icv/list" className="text-sm">
            {icv.selector.viewAll} →
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
