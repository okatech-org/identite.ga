/**
 * OpShell — port de idn-desktop.jsx:314-473.
 * Sidebar (220px) + IdnMark + IdnFlagBars + nav (client) + footer opérateur.
 */
import type { ReactNode } from "react"

import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { IdnMark } from "@repo/ui/components/idn-mark"

import { fr } from "../_content/fr"
import { SidebarNav } from "./sidebar-nav"

export function OpShell({
  title = fr.brand.operator,
  role = fr.brand.role,
  badge = fr.brand.badge,
  children,
}: {
  title?: string
  role?: string
  badge?: string
  children: ReactNode
}) {
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
        <SidebarNav />
        <div className="flex items-center gap-2.5 border-t border-idn-border-soft p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-idn-surface-2 text-xs font-semibold text-idn-ink">
            {badge}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-idn-ink">
              {title}
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
