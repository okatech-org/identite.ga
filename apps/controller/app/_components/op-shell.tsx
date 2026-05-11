import * as React from "react"

import { ControllerSidebar } from "./controller-sidebar"

/**
 * Coque opérateur — sidebar fixe 220px à gauche + zone principale.
 * Port direct de `OpShell` (idn-desktop.jsx:314-473).
 */
export function OpShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh bg-idn-bg">
      <ControllerSidebar />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}
