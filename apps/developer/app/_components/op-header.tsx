/**
 * OpHeader — port de idn-desktop.jsx:475-513.
 */
import type { ReactNode } from "react"

export function OpHeader({
  sub,
  title,
  right,
}: {
  sub: string
  title: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-end gap-4 border-b border-idn-border bg-idn-bg px-7 pb-4 pt-5">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
          {sub}
        </div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.014em] text-idn-ink">
          {title}
        </h1>
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  )
}
