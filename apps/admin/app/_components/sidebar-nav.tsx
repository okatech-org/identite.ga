"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { useQuery } from "convex/react"

import { cn } from "@repo/ui/lib/utils"
import { api } from "@repo/backend/convex/_generated/api"

import { IdnIcons } from "./icons"

type NavItem = {
  id: string
  href: string
  label: string
  icon: ReactNode
  tag?: string
}

/**
 * Format compact pour les badges sidebar : "142" jusqu'à 999, "1.2k" après.
 * Renvoie undefined quand la valeur n'a pas encore été chargée pour ne pas
 * flasher un "0" avant que la query Convex revienne.
 */
function fmtCompact(n: number | undefined): string | undefined {
  if (n === undefined) return undefined
  if (n < 1000) return String(n)
  const k = n / 1000
  return `${k < 10 ? k.toFixed(1) : Math.round(k)}k`
}

export function SidebarNav() {
  const pathname = usePathname() ?? ""

  const totalAccounts = useQuery(api.admin.users.totalAccounts, {}) as
    | number
    | undefined
  const apps = useQuery(api.admin.oauthApps.listApps, { limit: 500 }) as
    | { disabled: boolean }[]
    | undefined
  const appsActive =
    apps === undefined ? undefined : apps.filter((a) => !a.disabled).length

  const NAV: NavItem[] = [
    {
      id: "dashboard",
      href: "/dashboard",
      label: "Tableau de bord",
      icon: IdnIcons.dashboard,
    },
    {
      id: "apps",
      href: "/apps",
      label: "Applications OAuth",
      icon: IdnIcons.link,
      tag: fmtCompact(appsActive),
    },
    {
      id: "users",
      href: "/users",
      label: "Comptes IDN",
      icon: IdnIcons.user,
      tag: fmtCompact(totalAccounts),
    },
    {
      id: "logs",
      href: "/logs",
      label: "Logs & audit",
      icon: IdnIcons.doc,
    },
    {
      id: "roles",
      href: "/roles",
      label: "Rôles & habilitations",
      icon: IdnIcons.shield,
    },
    {
      id: "providers",
      href: "/providers",
      label: "Providers email/SMS",
      icon: IdnIcons.mail,
    },
  ]

  return (
    <nav
      className="flex flex-1 flex-col gap-0.5 px-2.5 py-3.5"
      aria-label="Navigation administrateur"
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
