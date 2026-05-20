"use client"

import * as React from "react"
import { MailIcon, MessageCircleIcon, PackageIcon } from "lucide-react"

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
    {
      id: "emails",
      label: iboite.sections.emails,
      icon: MessageCircleIcon,
      badge: counters.unreadMessages,
      offColor: "text-green-500",
    },
  ]

  return (
    <div
      role="tablist"
      aria-label="Sections iBoîte"
      className="flex flex-row gap-1.5 rounded-2xl border border-border bg-card p-1.5 md:flex-col md:p-2"
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
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center text-xs font-medium transition-colors md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-left md:text-sm",
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
                    "absolute -right-2 -top-1.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none md:hidden",
                    "bg-idn-green text-white",
                  )}
                >
                  {tb.badge}
                </span>
              ) : null}
            </span>
            <span className="flex-1 truncate md:block">{tb.label}</span>
            {tb.badge > 0 ? (
              <span
                className={cn(
                  "hidden h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold md:inline-flex",
                  selected
                    ? "bg-idn-green text-white"
                    : "bg-secondary text-foreground",
                )}
              >
                {tb.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
