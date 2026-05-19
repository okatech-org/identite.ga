"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"
import { IdnMark } from "@repo/ui/components/idn-mark"
import { cn } from "@repo/ui/lib/utils"

import { NotificationsBell } from "@/app/_components/notifications-bell"
import { UserMenu } from "@/app/_components/user-menu"

import { citizenNav } from "../_content/fr"

type NavItem = {
  href: string
  label: string
  disabled?: boolean
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/dashboard", label: citizenNav.home },
  { href: "/icarte", label: citizenNav.icarte, disabled: true },
  { href: "/iboite", label: citizenNav.iboite, disabled: true },
  { href: "/idoc", label: citizenNav.idoc, disabled: true },
  { href: "/icv", label: citizenNav.icv },
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
        "sticky top-0 z-40 flex h-15 min-h-[60px] items-center justify-between border-b border-border bg-card/95 px-7 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        className,
      )}
    >
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          aria-label="Identité Numérique — Tableau de bord"
        >
          <IdnMark size={26} />
          <span className="hidden flex-col leading-tight whitespace-nowrap sm:flex">
            <span className="text-sm font-semibold text-foreground">
              Identité Numérique
            </span>
            <span className="text-[10px] font-medium tracking-[0.04em] text-muted-foreground">
              République Gabonaise
            </span>
          </span>
        </Link>

        <nav
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1"
          aria-label="Navigation principale"
        >
          {NAV_ITEMS.map((tab) => {
            const active = isActive(tab.href)
            if (tab.disabled) {
              return (
                <button
                  key={tab.href}
                  type="button"
                  disabled
                  title={citizenNav.comingSoon}
                  className="cursor-not-allowed rounded-md px-3.5 py-2 text-[13px] font-medium text-foreground/40"
                >
                  {tab.label}
                </button>
              )
            }
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

        <div className="flex items-center gap-3">
          <NotificationsBell />
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
