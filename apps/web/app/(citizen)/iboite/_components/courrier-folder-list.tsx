"use client"

import * as React from "react"
import {
  ClockIcon,
  InboxIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"

import { iboite, type CourrierFolder } from "../_content/fr"

type Counters = {
  unreadLetters: number
  pendingLetters: number
}

const FOLDERS: ReadonlyArray<{
  id: CourrierFolder
  label: string
  icon: React.ComponentType<{ className?: string }>
  counterKey?: keyof Counters
}> = [
  { id: "inbox", label: iboite.courriers.folders.inbox, icon: InboxIcon, counterKey: "unreadLetters" },
  { id: "sent", label: iboite.courriers.folders.sent, icon: SendIcon },
  { id: "pending", label: iboite.courriers.folders.pending, icon: ClockIcon, counterKey: "pendingLetters" },
  { id: "trash", label: iboite.courriers.folders.trash, icon: Trash2Icon },
]

export function CourrierFolderList({
  active,
  counters,
  onChange,
}: {
  active: CourrierFolder
  counters: Counters
  onChange: (folder: CourrierFolder) => void
}) {
  return (
    <>
      {/* Version mobile : chips horizontaux scrollables. */}
      <div
        className="-mx-3 flex gap-2 overflow-x-auto px-3 md:hidden"
        role="tablist"
        aria-label="Dossiers courriers"
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
              {f.label}
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

      {/* Version desktop : panneau vertical avec bouton Nouveau plein largeur. */}
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
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
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
        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={() => toast.info(iboite.toasts.soonAvailable)}
        >
          <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {iboite.courriers.newLetter}
        </Button>
      </div>
    </>
  )
}
