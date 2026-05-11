import * as React from "react"

/**
 * En-tête de page contrôleur — surcatégorie en small caps + titre H1
 * + slot d'actions à droite. Port de `OpHeader` (idn-desktop.jsx:475-513).
 */
export function OpHeader({
  sub,
  title,
  right,
}: {
  sub: React.ReactNode
  title: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex items-end gap-4 border-b border-idn-border bg-idn-bg px-7 pb-4 pt-5">
      <div className="flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
          {sub}
        </div>
        <h1 className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.01em] text-idn-ink">
          {title}
        </h1>
      </div>
      {right}
    </div>
  )
}
