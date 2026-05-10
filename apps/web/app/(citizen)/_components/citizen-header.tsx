"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import { BellIcon } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import { IdnMark } from "@repo/ui/components/idn-mark"
import { cn } from "@repo/ui/lib/utils"

import { UserMenu } from "@/app/_components/user-menu"

import { citizenNav } from "../_content/fr"

const NAV_ITEMS = [
  { href: "/dashboard", label: citizenNav.home },
  { href: "/profile", label: citizenNav.profile },
  { href: "/consents", label: citizenNav.consents },
] as const

export function CitizenHeader({ className }: { className?: string }) {
  const pathname = usePathname()
  const me = useQuery(api.profile.getCurrentUser)

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href)

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-15 min-h-[60px] items-center gap-7 border-b border-border bg-card/95 px-7 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        className,
      )}
    >
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          aria-label="Identité Numérique — Tableau de bord"
        >
          <IdnMark size={26} />
          <span className="hidden whitespace-nowrap text-sm font-semibold text-foreground sm:inline">
            Identité Numérique
          </span>
          <span className="hidden whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold tracking-[0.05em] text-muted-foreground md:inline">
            RÉPUBLIQUE GABONAISE
          </span>
        </Link>

        <nav
          className="ml-2 flex items-center gap-1"
          aria-label="Navigation principale"
        >
          {NAV_ITEMS.map((tab) => {
            const active = isActive(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-idn-green-soft font-semibold text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark"
                    : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <BellIcon className="size-4" aria-hidden="true" />
          </button>
          {me ? (
            <UserMenu user={me} />
          ) : (
            <div
              aria-hidden="true"
              className="size-9 animate-pulse rounded-[10px] bg-secondary"
            />
          )}
        </div>
    </header>
  )
}
