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
    <div className="portal-panel relative min-h-[132px] overflow-hidden p-5">
      <span
        className="absolute inset-x-0 top-0 h-[2px] bg-[var(--portal-accent)] opacity-80"
        aria-hidden
      />
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.09em] text-idn-muted">
        {label}
      </div>
      <div className="mt-3 font-mono text-[32px] font-semibold leading-none tracking-[-0.035em] text-idn-ink">
        {value}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {delta ? (
          <span className="rounded-full bg-idn-green-soft px-2 py-0.5 text-[11px] font-semibold text-idn-green dark:bg-[#0F2A18]">
            {delta}
          </span>
        ) : null}
        {hint ? (
          <span className="text-[11px] text-idn-muted">{hint}</span>
        ) : null}
      </div>
    </div>
  )
}
