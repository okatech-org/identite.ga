"use client"

import * as React from "react"
import {
  ArchiveIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ForwardIcon,
  ReplyAllIcon,
  ReplyIcon,
  Trash2Icon,
} from "lucide-react"

import type { Id } from "@repo/backend/convex/_generated/dataModel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"
import { cn } from "@repo/ui/lib/utils"

import { iboite } from "../_content/fr"
import { useEmailActions } from "../_hooks/use-email-actions"

type Props = {
  messageId: Id<"iboiteMessage">
  onBack: () => void
  onCompose: () => void
}

/** Panneau d'actions vertical — uniquement desktop (md+). */
export function EmailActionsPanel({ messageId, onBack, onCompose }: Props) {
  const actions = useEmailActions({ messageId, onAfterMove: onBack })

  return (
    <nav
      aria-label="Actions email"
      className="hidden flex-col gap-2 rounded-2xl border border-border bg-card p-3 md:flex"
    >
      <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {iboite.emails.actions.title}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 rounded-lg bg-idn-green px-3 py-2 text-sm font-semibold text-white hover:bg-idn-green/90"
            >
              <ReplyIcon className="h-4 w-4" aria-hidden="true" />
              {iboite.emails.actions.reply}
              <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={onCompose}>
              <ReplyIcon className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              {iboite.emails.actions.reply}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onCompose}>
              <ReplyAllIcon className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              {iboite.emails.actions.replyAll}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={onCompose}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300"
        >
          <ForwardIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {iboite.emails.actions.forward}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={actions.onArchive}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground/80 hover:bg-secondary"
        >
          <ArchiveIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {iboite.emails.actions.archive}
        </button>
        <button
          type="button"
          onClick={actions.onDelete}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          <Trash2Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {iboite.emails.actions.delete}
        </button>
      </div>

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

/** Toolbar horizontale en bas — uniquement mobile (<md). */
export function EmailActionsBar({ messageId, onBack, onCompose }: Props) {
  const actions = useEmailActions({ messageId, onAfterMove: onBack })

  const items: Array<{
    key: string
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: () => void
    primary?: boolean
    danger?: boolean
  }> = [
    {
      key: "reply",
      icon: ReplyIcon,
      label: iboite.emails.actions.reply,
      onClick: onCompose,
      primary: true,
    },
    {
      key: "forward",
      icon: ForwardIcon,
      label: iboite.emails.actions.forward,
      onClick: onCompose,
    },
    {
      key: "archive",
      icon: ArchiveIcon,
      label: iboite.emails.actions.archive,
      onClick: actions.onArchive,
    },
    {
      key: "delete",
      icon: Trash2Icon,
      label: iboite.emails.actions.delete,
      onClick: actions.onDelete,
      danger: true,
    },
  ]

  return (
    <div className="sticky bottom-0 z-10 border-t border-border bg-card px-2 py-2 md:hidden">
      <div className="flex items-stretch justify-around gap-1">
        {items.map((it) => {
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
