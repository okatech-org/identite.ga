"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"
import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { IdnMark } from "@repo/ui/components/idn-mark"
import { cn } from "@repo/ui/lib/utils"

import { nav, shell } from "../_content/fr"
import { NavIcons } from "./icons"

type NavItem = {
  href: string
  label: string
  icon: keyof typeof NavIcons
  tag?: string
  /** Routes considered active for this item (besides exact match). */
  match: (pathname: string) => boolean
}

const items: NavItem[] = [
  {
    href: "/",
    label: nav.dashboard,
    icon: "home",
    match: (p) => p === "/",
  },
  {
    href: "/queue",
    label: nav.queue,
    icon: "shield",
    tag: nav.queueTag,
    match: (p) => p.startsWith("/queue"),
  },
  {
    href: "/scan",
    label: nav.scan,
    icon: "qr",
    match: (p) => p.startsWith("/scan"),
  },
  {
    href: "/verify",
    label: nav.verify,
    icon: "check",
    match: (p) => p.startsWith("/verify"),
  },
  {
    href: "/history",
    label: nav.history,
    icon: "doc",
    match: (p) => p.startsWith("/history"),
  },
]

export function ControllerSidebar() {
  const pathname = usePathname() ?? "/"
  const me = useQuery(api.controller.me.current, {})
  const displayName = me?.displayName ?? shell.agentLabel
  const badge = me?.initials ?? shell.badge

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-idn-border bg-idn-surface">
      <div className="flex items-center gap-2.5 px-[18px] pb-3.5 pt-[18px]">
        <IdnMark size={26} />
        <div>
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-idn-ink">
            {shell.brand}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
            {shell.role}
          </div>
        </div>
      </div>
      <div className="mx-[18px]">
        <IdnFlagBars width={184} height={2} />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-2.5 py-3.5">
        {items.map((item) => {
          const Icon = NavIcons[item.icon]
          const selected = item.match(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                selected
                  ? "bg-idn-green-soft font-semibold text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark"
                  : "text-idn-ink-2 hover:bg-idn-surface-2",
              )}
            >
              <Icon
                aria-hidden="true"
                className={cn(
                  "size-4",
                  selected ? "opacity-100" : "opacity-70",
                )}
              />
              <span>{item.label}</span>
              {item.tag && (
                <span
                  className={cn(
                    "ml-auto rounded-full bg-idn-surface-2 px-1.5 py-px font-mono text-[10px] font-medium",
                    selected ? "text-idn-green" : "text-idn-muted",
                  )}
                >
                  {item.tag}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="flex items-center gap-2.5 border-t border-idn-border-soft p-3">
        <div
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-idn-surface-2 text-xs font-semibold text-idn-ink"
        >
          {badge}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-idn-ink">
            {displayName}
          </div>
          <div className="text-[10px] text-idn-muted">{shell.status}</div>
        </div>
      </div>
    </aside>
  )
}
