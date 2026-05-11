import type { ReactNode } from "react"

import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { IdnMark } from "@repo/ui/components/idn-mark"

import { fr } from "../_content/fr"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Aller au contenu principal
      </a>
      <header className="border-b border-idn-border bg-idn-surface">
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-6 py-3.5">
          <IdnMark size={26} />
          <div className="leading-tight">
            <div className="text-[13px] font-semibold tracking-[-0.012em] text-idn-ink">
              {fr.brand.name}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
              {fr.brand.role}
            </div>
          </div>
          <div className="ml-auto">
            <IdnFlagBars width={120} height={2} />
          </div>
        </div>
      </header>
      <div id="main">{children}</div>
    </>
  )
}
