"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { cn } from "@repo/ui/lib/utils"

import { fr } from "../_content/fr"
import { IdnIcons } from "./icons"

type NavItem = {
  id: string
  href: string
  label: string
  icon: ReactNode
  tag?: string
}

export function SidebarNav({ appCount }: { appCount?: number }) {
  const pathname = usePathname() ?? ""

  const NAV: NavItem[] = [
    {
      id: "applications",
      href: "/applications",
      label: fr.nav.applications,
      icon: IdnIcons.link,
      tag: appCount !== undefined ? String(appCount) : undefined,
    },
    {
      id: "api-keys",
      href: "/api-keys",
      label: fr.nav.apiKeys,
      icon: IdnIcons.key,
    },
    {
      id: "docs",
      href: "/docs",
      label: fr.nav.docs,
      icon: IdnIcons.doc,
    },
    {
      id: "usage",
      href: "/usage",
      label: fr.nav.usage,
      icon: IdnIcons.dashboard,
    },
    {
      id: "settings",
      href: "/settings",
      label: fr.nav.settings,
      icon: IdnIcons.settings,
    },
  ]

  return (
    <nav
      className="flex flex-1 flex-col gap-0.5 px-2.5 py-3.5"
      aria-label="Navigation développeur"
    >
      {NAV.map((n) => {
        const sel =
          pathname === n.href ||
          (n.href !== "/" && pathname.startsWith(`${n.href}/`))
        return (
          <Link
            key={n.id}
            href={n.href}
            aria-current={sel ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-idn-green",
              sel
                ? "bg-idn-green-soft font-semibold text-idn-green dark:bg-[#0F2A18]"
                : "text-idn-ink-2 hover:bg-idn-surface-2",
            )}
          >
            <span className={cn("flex", sel ? "opacity-100" : "opacity-70")}>
              {n.icon}
            </span>
            <span className="truncate">{n.label}</span>
            {n.tag ? (
              <span className="ml-auto rounded-full bg-idn-surface-2 px-1.5 py-px font-mono text-[10px] text-idn-muted">
                {n.tag}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
