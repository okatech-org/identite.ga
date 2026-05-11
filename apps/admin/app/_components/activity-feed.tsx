/**
 * Activité récente — port de idn-desktop.jsx:822-916.
 */
import type { ActivityRow } from "../_mocks/dashboard"
import { fr } from "../_content/fr"

export function ActivityFeed({ rows }: { rows: ActivityRow[] }) {
  return (
    <div className="mt-3.5 rounded-xl border border-idn-border bg-idn-surface p-[18px]">
      <div className="mb-3 text-[13px] font-semibold text-idn-ink">
        {fr.dashboard.activity.title}
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-idn-muted">
          Aucun événement récent.
        </p>
      ) : (
        <ul role="list">
          {rows.map((r, i) => (
            <li
              key={i}
              className="flex items-center gap-3.5 border-b border-idn-border-soft py-2.5 last:border-b-0"
            >
              <span className="w-14 font-mono text-[11px] text-idn-muted">
                {r.t}
              </span>
              <span className="w-[220px] text-[13px] font-medium text-idn-ink">
                {r.e}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-idn-muted">
                {r.d}
              </span>
              <span className="rounded-full bg-idn-surface-2 px-2 py-px font-mono text-[10px] text-idn-ink-2">
                {r.tag}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
