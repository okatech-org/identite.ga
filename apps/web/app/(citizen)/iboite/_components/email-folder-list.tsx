"use client"

import * as React from "react"
import {
  InboxIcon,
  PlusIcon,
  SendIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"

import { iboite, type EmailFolder } from "../_content/fr"

type Counters = {
  unreadMessages: number
}

const FOLDERS: ReadonlyArray<{
  id: EmailFolder
  label: string
  icon: React.ComponentType<{ className?: string; fill?: string }>
  counterKey?: keyof Counters
}> = [
  {
    id: "inbox",
    label: iboite.emails.folders.inbox,
    icon: InboxIcon,
    counterKey: "unreadMessages",
  },
  { id: "starred", label: iboite.emails.folders.starred, icon: StarIcon },
  { id: "sent", label: iboite.emails.folders.sent, icon: SendIcon },
  { id: "trash", label: iboite.emails.folders.trash, icon: Trash2Icon },
]

const MOBILE_LABELS: Record<EmailFolder, string> = {
  inbox: "Réception",
  starred: "Favoris",
  sent: "Envoyés",
  trash: "Corbeille",
}

export function EmailFolderList({
  active,
  counters,
  onChange,
  onCompose,
}: {
  active: EmailFolder
  counters: Counters
  onChange: (folder: EmailFolder) => void
  onCompose: () => void
}) {
  return (
    <>
      {/* Mobile : chips horizontaux scrollables. */}
      <div
        className="-mx-3 flex gap-2 overflow-x-auto px-3 md:hidden"
        role="tablist"
        aria-label="Dossiers eMails"
      >
        {FOLDERS.map((f) => {
          const selected = f.id === active
          const count = f.counterKey ? counters[f.counterKey] : 0
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(f.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                selected
                  ? "border-idn-green bg-idn-green text-white"
                  : "border-border bg-card text-foreground/80 hover:bg-secondary",
              )}
            >
              {MOBILE_LABELS[f.id]}
              {count > 0 ? (
                <span
                  className={cn(
                    "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none",
                    selected
                      ? "bg-white/25 text-white"
                      : "bg-secondary text-foreground",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Desktop : panneau vertical avec bouton Nouveau message. */}
      <div className="hidden flex-col gap-2 rounded-2xl border border-border bg-card p-2 md:flex">
        <ul className="flex flex-col gap-0.5">
          {FOLDERS.map((f) => {
            const Icon = f.icon
            const selected = f.id === active
            const count = f.counterKey ? counters[f.counterKey] : 0
            return (
              <li key={f.id}>
                <button
                  type="button"
                  aria-current={selected ? "true" : undefined}
                  onClick={() => onChange(f.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    selected
                      ? "bg-idn-green-soft text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark"
                      : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      f.id === "starred" && selected
                        ? "fill-current text-amber-500"
                        : "",
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex-1 font-medium">{f.label}</span>
                  {count > 0 ? (
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        selected
                          ? "bg-idn-green text-white"
                          : "bg-secondary text-foreground",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
        <Button type="button" size="sm" className="w-full" onClick={onCompose}>
          <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {iboite.emails.newMessage}
        </Button>
      </div>
    </>
  )
}
