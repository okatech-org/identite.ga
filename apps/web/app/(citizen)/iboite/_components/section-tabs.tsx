"use client"

import * as React from "react"
import { InboxIcon, MailIcon, PackageIcon } from "lucide-react"

import { cn } from "@repo/ui/lib/utils"

import { iboite, type SectionKey } from "../_content/fr"

type Counters = {
  unreadLetters: number
  pendingLetters: number
  availablePackages: number
  unreadMessages: number
}

type Tab = {
  id: SectionKey
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge: number
  offColor: string
}

export function SectionTabs({
  active,
  counters,
  onChange,
}: {
  active: SectionKey
  counters: Counters
  onChange: (section: SectionKey) => void
}) {
  const tabs: Tab[] = [
    {
      id: "emails",
      label: iboite.sections.emails,
      icon: InboxIcon,
      badge: counters.unreadMessages,
      offColor: "text-emerald-600",
    },
    {
      id: "courriers",
      label: iboite.sections.courriers,
      icon: MailIcon,
      badge: counters.unreadLetters,
      offColor: "text-blue-500",
    },
    {
      id: "colis",
      label: iboite.sections.colis,
      icon: PackageIcon,
      badge: counters.availablePackages,
      offColor: "text-amber-500",
    },
  ]

  return (
    <div
      role="tablist"
      aria-label="Sections iBoîte"
      className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-secondary/45 p-1"
    >
      {tabs.map((tb) => {
        const Icon = tb.icon
        const selected = tb.id === active
        return (
          <button
            key={tb.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`iboite-panel-${tb.id}`}
            onClick={() => onChange(tb.id)}
            className={cn(
              "flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
              selected
                ? "bg-idn-green-soft text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark"
                : "text-foreground/80 hover:bg-secondary hover:text-foreground",
            )}
          >
            <span className="relative inline-flex">
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  selected ? "text-current" : tb.offColor,
                )}
                aria-hidden="true"
              />
              {tb.badge > 0 ? (
                <span
                  className={cn(
                    "absolute -right-2 -top-1.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none",
                    "bg-idn-green text-white",
                  )}
                >
                  {tb.badge}
                </span>
              ) : null}
            </span>
            <span className="truncate">{tb.label}</span>
          </button>
        )
      })}
    </div>
  )
}
