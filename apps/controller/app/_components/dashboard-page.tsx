import Link from "next/link"

import { OpHeader } from "./op-header"
import { IdnCard } from "./idn-card"
import { ResultBadge } from "./result-badge"
import { dashboard } from "../_content/fr"
import { historyEntries } from "../_lib/mocks"
import { NavIcons } from "./icons"

/**
 * Tableau de bord — page d'entrée des contrôleurs connectés.
 * Pas de mockup dédié : on compose à partir des éléments existants
 * (cartes, OpHeader, badges) sans inventer de copy hors maquettes.
 */
export function DashboardPage() {
  const cards = [
    {
      key: "queue" as const,
      href: "/queue",
      icon: NavIcons.shield,
      ...dashboard.cards.queue,
    },
    {
      key: "history" as const,
      href: "/history",
      icon: NavIcons.doc,
      ...dashboard.cards.history,
    },
    {
      key: "verify" as const,
      href: "/verify",
      icon: NavIcons.check,
      ...dashboard.cards.verify,
    },
  ]

  return (
    <>
      <OpHeader sub={dashboard.sub} title={dashboard.title} />
      <div className="flex-1 overflow-auto p-7">
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.key}
                href={card.href}
                className="rounded-[12px] border border-idn-border bg-idn-surface p-5 transition-colors hover:border-idn-green focus-visible:border-idn-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idn-green/30"
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
                  <Icon aria-hidden="true" className="size-3.5" />
                  {card.sub}
                </div>
                <div className="mt-3 text-[18px] font-semibold leading-tight text-idn-ink">
                  {card.headline}
                </div>
                <div className="mt-2 text-[13px] text-idn-green dark:text-idn-green-on-dark">
                  {card.cta} →
                </div>
              </Link>
            )
          })}
        </div>

        <IdnCard className="mt-5 p-0">
          <div className="border-b border-idn-border-soft px-5 py-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
              {dashboard.recent.loc}
            </div>
            <div className="mt-1 text-[13px] font-semibold text-idn-ink">
              {dashboard.recent.title}
            </div>
          </div>
          <div>
            {historyEntries.map((h, i) => (
              <div
                key={`${h.ts}-${h.name}`}
                className={
                  i === historyEntries.length - 1
                    ? "flex items-center gap-3.5 px-5 py-3.5"
                    : "flex items-center gap-3.5 border-b border-idn-border-soft px-5 py-3.5"
                }
              >
                <span className="w-[130px] font-mono text-[11px] text-idn-muted">
                  {h.ts}
                </span>
                <span className="flex-1 text-[13px] font-medium text-idn-ink">
                  {h.name}
                </span>
                <span className="flex-1 text-xs text-idn-muted">{h.loc}</span>
                <ResultBadge result={h.result} />
              </div>
            ))}
          </div>
        </IdnCard>
      </div>
    </>
  )
}
