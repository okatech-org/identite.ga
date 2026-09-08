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
    <header className="relative z-10 flex min-h-[82px] items-center gap-6 border-b border-idn-border bg-idn-surface/95 px-8 py-4 shadow-[0_1px_0_rgba(15,35,23,0.02)] backdrop-blur-sm">
      <span
        className="absolute bottom-[-1px] left-8 h-[2px] w-14 rounded-full bg-idn-green"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="portal-section-kicker flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-idn-green" aria-hidden />
          {sub}
        </div>
        <h1 className="mt-1.5 text-[24px] font-semibold leading-tight tracking-[-0.025em] text-idn-ink">
          {title}
        </h1>
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </header>
  )
}
