/**
 * OpShell — port de idn-desktop.jsx:314-473.
 *
 * Sidebar (220px) avec :
 *   - Logo + libellé "Identité Numérique" + badge rôle "ESPACE ADMIN"
 *   - IdnFlagBars Gabon
 *   - Nav (SidebarNav, client)
 *   - Pied de page : dropdown UserMenu (Paramètres / Se déconnecter)
 */
import type { ReactNode } from "react"

import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { IdnMark } from "@repo/ui/components/idn-mark"

import { fr } from "../_content/fr"
import { SidebarNav } from "./sidebar-nav"
import { UserMenu } from "./user-menu"

export function OpShell({
  role = fr.brand.role,
  children,
}: {
  role?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh bg-idn-bg">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-idn-border bg-idn-surface">
        <div className="flex items-center gap-2.5 px-[18px] pt-[18px] pb-3.5">
          <IdnMark size={26} />
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold tracking-[-0.012em] text-idn-ink">
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
        <UserMenu />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col" id="main">
        {children}
      </main>
    </div>
  )
}
