"use client"

/**
 * OpShell — port de idn-desktop.jsx:314-473 (sidebar 220px + main).
 */
import type { ReactNode } from "react"
import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"
import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { IdnMark } from "@repo/ui/components/idn-mark"

import { fr } from "../_content/fr"
import { SidebarNav } from "./sidebar-nav"

function initialsFor(email: string, firstName?: string, lastName?: string): string {
  if (firstName || lastName) {
    return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "D"
  }
  const local = email.split("@")[0] ?? ""
  return local.slice(0, 1).toUpperCase() || "D"
}

export function OpShell({
  role = fr.brand.role,
  appCount,
  children,
}: {
  role?: string
  appCount?: number
  children: ReactNode
}) {
  const me = useQuery(api.profile.getCurrentUser)

  const firstName = me?.profile?.pivot?.firstName ?? ""
  const lastName = me?.profile?.pivot?.lastName ?? ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ")
  const displayName = fullName || me?.email || "—"
  const badge = me ? initialsFor(me.email, firstName, lastName) : "·"

  return (
    <div className="flex min-h-svh bg-idn-bg">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-idn-border bg-idn-surface">
        <div className="flex items-center gap-2.5 px-[18px] pt-[18px] pb-3.5">
          <IdnMark size={26} />
          <div>
            <div className="text-[13px] font-semibold tracking-[-0.012em] text-idn-ink">
              {fr.brand.name}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
              {role}
            </div>
          </div>
        </div>
        <div className="px-[18px]">
          <IdnFlagBars width={184} height={2} />
        </div>
        <SidebarNav appCount={appCount} />
        <div className="flex items-center gap-2.5 border-t border-idn-border-soft p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-idn-surface-2 text-xs font-semibold text-idn-ink">
            {badge}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-idn-ink">
              {displayName}
            </div>
            <div className="text-[10px] text-idn-muted">{fr.brand.connecte}</div>
          </div>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col" id="main">
        {children}
      </main>
    </div>
  )
}
