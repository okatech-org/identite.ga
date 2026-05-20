"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import {
  ArrowLeftIcon,
  ClockIcon,
  DownloadIcon,
  PrinterIcon,
  ReplyIcon,
  Share2Icon,
  Trash2Icon,
} from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { cn } from "@repo/ui/lib/utils"

import { iboite, type CourrierFolder } from "../_content/fr"
import { useCourrierActions } from "../_hooks/use-courrier-actions"

type Props = {
  letterId: Id<"iboiteLetter">
  currentFolder: CourrierFolder
  onBack: () => void
}

/** Panneau d'actions vertical — uniquement desktop (md+). */
export function CourrierActionsPanel({
  letterId,
  currentFolder,
  onBack,
}: Props) {
  const letter = useQuery(api.iboite.letters.get, { letterId })
  const actions = useCourrierActions({ letterId, onAfterMove: onBack })

  const showPending = currentFolder !== "pending" && currentFolder !== "trash"
  const showReply = currentFolder !== "trash"

  return (
    <nav
      aria-label="Actions courrier"
      className="hidden flex-col gap-2 rounded-2xl border border-border bg-card p-3 md:flex"
    >
      <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {iboite.courriers.actions.title}
      </p>

      {showReply ? (
        <button
          type="button"
          onClick={actions.onReply}
          className="flex items-center justify-center gap-2 rounded-lg bg-idn-green px-3 py-2 text-sm font-semibold text-white hover:bg-idn-green/90"
        >
          <ReplyIcon className="h-4 w-4" aria-hidden="true" />
          {iboite.courriers.actions.reply}
        </button>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <ActionTile
          icon={DownloadIcon}
          label={iboite.courriers.actions.download}
          tone="blue"
          onClick={actions.onDownload}
        />
        <ActionTile
          icon={PrinterIcon}
          label={iboite.courriers.actions.print}
          tone="slate"
          onClick={actions.onPrint}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {showPending ? (
          <ActionTile
            icon={ClockIcon}
            label={iboite.courriers.actions.toPending}
            tone="amber"
            onClick={() => actions.moveTo("pending")}
          />
        ) : null}
        <ActionTile
          icon={Share2Icon}
          label={iboite.courriers.actions.share}
          tone="green"
          onClick={() =>
            letter
              ? actions.onShare({
                  title: letter.subject,
                  text: `${letter.senderName} — ${letter.subject}`,
                })
              : undefined
          }
          className={cn(!showPending && "col-span-2")}
        />
      </div>

      {currentFolder !== "trash" ? (
        <button
          type="button"
          onClick={() => actions.moveTo("trash")}
          className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          <Trash2Icon className="h-4 w-4" aria-hidden="true" />
          {iboite.courriers.actions.delete}
        </button>
      ) : null}

      <button
        type="button"
        onClick={onBack}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {iboite.courriers.backToList}
      </button>
    </nav>
  )
}

const TONE_CLASSES = {
  blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
  amber:
    "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
  green:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
  slate:
    "border-border bg-background text-foreground/80 hover:bg-secondary hover:text-foreground",
} as const

function ActionTile({
  icon: Icon,
  label,
  tone,
  onClick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  tone: keyof typeof TONE_CLASSES
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
        TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  )
}

/** Toolbar horizontale en bas — uniquement mobile (<md). */
export function CourrierActionsBar({ letterId, currentFolder, onBack }: Props) {
  const letter = useQuery(api.iboite.letters.get, { letterId })
  const actions = useCourrierActions({ letterId, onAfterMove: onBack })

  const showPending = currentFolder !== "pending" && currentFolder !== "trash"
  const showReply = currentFolder !== "trash"

  // 4 cellules max sur mobile pour rester lisible.
  const items: Array<{
    key: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: () => void
    primary?: boolean
    danger?: boolean
  }> = []
  if (showReply) {
    items.push({
      key: "reply",
      icon: ReplyIcon,
      label: iboite.courriers.actions.reply,
      onClick: actions.onReply,
      primary: true,
    })
  }
  if (showPending) {
    items.push({
      key: "pending",
      icon: ClockIcon,
      label: iboite.courriers.actions.toPending,
      onClick: () => actions.moveTo("pending"),
    })
  }
  items.push({
    key: "print",
    icon: PrinterIcon,
    label: iboite.courriers.actions.print,
    onClick: actions.onPrint,
  })
  items.push({
    key: "share",
    icon: Share2Icon,
    label: iboite.courriers.actions.share,
    onClick: () =>
      letter
        ? actions.onShare({
            title: letter.subject,
            text: `${letter.senderName} — ${letter.subject}`,
          })
        : undefined,
  })
  if (currentFolder !== "trash") {
    items.push({
      key: "delete",
      icon: Trash2Icon,
      label: iboite.courriers.actions.delete,
      onClick: () => actions.moveTo("trash"),
      danger: true,
    })
  }

  return (
    <div className="sticky bottom-0 z-10 border-t border-border bg-card px-2 py-2 md:hidden">
      <div className="flex items-stretch justify-around gap-1">
        {items.slice(0, 5).map((it) => {
          const Icon = it.icon
          return (
            <button
              key={it.key}
              type="button"
              onClick={it.onClick}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
                it.primary
                  ? "text-idn-green"
                  : it.danger
                    ? "text-red-600"
                    : "text-foreground/80 hover:bg-secondary",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">{it.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
