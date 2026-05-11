/**
 * Stat card — port de idn-desktop.jsx:567-613.
 */

export function StatCard({
  label,
  value,
  delta,
  hint,
}: {
  label: string
  value: string
  delta?: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-idn-border bg-idn-surface p-[18px]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
        {label}
      </div>
      <div className="mt-2 text-[30px] font-semibold tracking-[-0.017em] text-idn-ink">
        {value}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        {delta ? (
          <span className="text-xs font-medium text-idn-green">{delta}</span>
        ) : null}
        {hint ? <span className="text-xs text-idn-muted">{hint}</span> : null}
      </div>
    </div>
  )
}
