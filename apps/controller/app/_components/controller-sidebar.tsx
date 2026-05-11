"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "convex/react"
import { LogOutIcon, SettingsIcon } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"
import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { IdnMark } from "@repo/ui/components/idn-mark"
import { cn } from "@repo/ui/lib/utils"

import { authClient } from "@/lib/auth-client"

import { nav, shell } from "../_content/fr"
import { NavIcons } from "./icons"
import { ControllerNotificationsBell } from "./notifications-bell"

type NavItem = {
  href: string
  label: string
  icon: keyof typeof NavIcons
  /** Source du tag à droite : "pending" = live, sinon string statique. */
  tag?: "pending" | string
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
    tag: "pending",
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

function computeInitials(name: string, email: string): string {
  const fromName = name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? "")
  if (fromName.length >= 2) return (fromName[0]! + fromName[fromName.length - 1]!).slice(0, 2)
  if (fromName.length === 1) return fromName[0]!.slice(0, 2)
  const local = email.split("@")[0] ?? ""
  return (local[0]?.toUpperCase() ?? "?") + (local[1]?.toUpperCase() ?? "")
}

export function ControllerSidebar() {
  const pathname = usePathname() ?? "/"
  const me = useQuery(api.profile.getCurrentUser)
  const pendingCount = useQuery(api.controller.queue.pendingCount, {})

  const firstName = me?.profile?.pivot?.firstName ?? ""
  const lastName = me?.profile?.pivot?.lastName ?? ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ")
  const displayName = fullName || me?.email || shell.agentLabel
  const initials = me
    ? computeInitials(fullName, me.email)
    : shell.badge

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/"
  }

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-idn-border bg-idn-surface">
      <div className="flex items-center gap-2.5 px-[18px] pb-3.5 pt-[18px]">
        <IdnMark size={26} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-idn-ink">
            {shell.brand}
          </div>
          <div className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
            {shell.role}
          </div>
        </div>
        <ControllerNotificationsBell />
      </div>
      <div className="mx-[18px]">
        <IdnFlagBars width={184} height={2} />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-2.5 py-3.5">
        {items.map((item) => {
          const Icon = NavIcons[item.icon]
          const selected = item.match(pathname)
          const tagValue =
            item.tag === "pending"
              ? pendingCount === undefined
                ? null
                : String(pendingCount)
              : (item.tag ?? null)
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
              {tagValue !== null && (
                <span
                  className={cn(
                    "ml-auto rounded-full bg-idn-surface-2 px-1.5 py-px font-mono text-[10px] font-medium",
                    selected ? "text-idn-green" : "text-idn-muted",
                  )}
                >
                  {tagValue}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Compte de ${displayName}`}
            className="flex items-center gap-2.5 border-t border-idn-border-soft p-3 text-left transition-colors hover:bg-idn-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idn-green/40 focus-visible:ring-inset"
          >
            <div
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-full bg-idn-surface-2 text-xs font-semibold text-idn-ink"
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-idn-ink">
                {displayName}
              </div>
              <div className="text-[10px] text-idn-muted">{shell.status}</div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              {displayName}
            </span>
            {me?.email && (
              <span className="text-xs font-normal text-muted-foreground">
                {me.email}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <SettingsIcon aria-hidden="true" />
              <span>Paramètres</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
            <LogOutIcon aria-hidden="true" />
            <span>Se déconnecter</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  )
}
