"use client"

import { useQuery } from "convex/react"
import {
  ActivityIcon,
  ArrowUpRightIcon,
  GaugeIcon,
  ServerIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../_content/fr"
import { groupApplications } from "../../_components/application-groups"
import { OpHeader } from "../../_components/op-header"
import { StatCard } from "../../_components/stat-card"

export default function UsagePage() {
  const usage = useQuery(api.developer.apps.usage, {})
  const applications = useQuery(api.developer.apps.listMine, {})
  const groups = applications ? groupApplications(applications) : []

  const hasData = usage?.hasData ?? false
  const series = usage?.series ?? []
  const max = Math.max(1, ...series)

  const quotaLabel = `${(usage?.requestsQuota ?? 100_000) / 1000}k`.replace(
    ".",
    ",",
  )
  const quotaPercent = usage
    ? Math.min(
        100,
        Math.round((usage.requestsThisMonth / usage.requestsQuota) * 100),
      )
    : 0

  return (
    <>
      <OpHeader sub={fr.usage.sub} title={fr.usage.title} />
      <div className="portal-canvas flex-1 overflow-auto">
        <div className="portal-limit space-y-5">
          <section className="overflow-hidden rounded-2xl border border-idn-border bg-idn-ink text-white shadow-[0_20px_50px_rgba(15,35,23,0.14)] dark:bg-idn-surface">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative overflow-hidden p-7">
                <div className="absolute -right-16 -top-24 size-64 rounded-full bg-idn-green/25 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-300">
                    <GaugeIcon className="size-4" /> Qualité de service
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em]">
                    Votre trafic, sans perdre le signal.
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                    Suivez le quota, la latence et les erreurs avant qu’elles ne
                    deviennent visibles par les citoyens.
                  </p>
                </div>
              </div>
              <div className="border-t border-white/10 bg-white/[0.045] p-6 lg:border-l lg:border-t-0">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.07em] text-white/45">
                      Quota mensuel
                    </div>
                    <div className="mt-1 text-2xl font-semibold">
                      {hasData && usage
                        ? usage.requestsThisMonth.toLocaleString("fr-FR")
                        : "—"}{" "}
                      <span className="text-sm font-normal text-white/45">
                        / {quotaLabel}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-300">
                    {quotaPercent}%
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-idn-green"
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-white/45">
                  Réinitialisation automatique au début du mois.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label={fr.usage.stats.requests.label}
              value={
                hasData && usage
                  ? `${usage.requestsThisMonth.toLocaleString("fr-FR")} / ${quotaLabel}`
                  : `— / ${quotaLabel}`
              }
              delta={hasData ? usage?.requestsDelta : undefined}
              hint={fr.usage.stats.requests.hint}
            />
            <StatCard
              label={fr.usage.stats.latency.label}
              value={hasData && usage ? `${usage.latencyP95Ms}ms` : "—"}
              hint={fr.usage.stats.latency.hint}
            />
            <StatCard
              label={fr.usage.stats.errors.label}
              value={hasData && usage ? usage.error4xxRate : "—"}
              hint={fr.usage.stats.errors.hint}
            />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <section className="portal-panel p-5">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-idn-ink">
                  {fr.usage.chart.title}
                </h2>
                <span className="portal-section-kicker">30 jours</span>
              </div>
              {hasData && series.length > 0 ? (
                <div
                  className="mt-4 flex h-[180px] items-end gap-2"
                  role="img"
                  aria-label={fr.usage.chart.title}
                >
                  {series.map((value, idx) => {
                    const isLast = idx === series.length - 1
                    const height = Math.max(4, Math.round((value / max) * 170))
                    return (
                      <div
                        key={idx}
                        className={`w-full rounded-t-sm ${
                          isLast
                            ? "bg-[#0E7C3A]"
                            : "bg-[#B8DCC4] dark:bg-[#1F4A2E]"
                        }`}
                        style={{ height: `${height}px` }}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="mt-4 flex h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-idn-border bg-idn-surface-2/40 px-4 text-center">
                  <p className="text-sm font-medium text-idn-ink">
                    {fr.usage.empty.title}
                  </p>
                  <p className="mt-1 max-w-[420px] text-xs text-idn-muted">
                    {fr.usage.empty.body}
                  </p>
                </div>
              )}
            </section>
            <aside className="portal-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-idn-border-soft bg-idn-surface-2/55 px-5 py-4">
                <div>
                  <div className="portal-section-kicker">État du service</div>
                  <h2 className="mt-1 text-sm font-semibold text-idn-ink">
                    Indicateurs actuels
                  </h2>
                </div>
                <ActivityIcon className="size-5 text-idn-green" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 rounded-lg border border-idn-green/20 bg-idn-green-soft/65 p-3 dark:bg-idn-green/10">
                  <span className="size-2 rounded-full bg-idn-green shadow-[0_0_0_4px_rgba(14,124,58,0.12)]" />
                  <div>
                    <div className="text-xs font-semibold text-idn-ink">
                      Services opérationnels
                    </div>
                    <div className="mt-0.5 text-[10px] text-idn-muted">
                      Aucune alerte active
                    </div>
                  </div>
                </div>
                <dl className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-xs text-idn-muted">
                      <ServerIcon className="size-3.5" /> Applications
                    </dt>
                    <dd className="text-sm font-semibold text-idn-ink">
                      {groups.length}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-xs text-idn-muted">
                      <ShieldCheckIcon className="size-3.5" /> Disponibilité
                    </dt>
                    <dd className="text-sm font-semibold text-idn-ink">—</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-xs text-idn-muted">
                      <ActivityIcon className="size-3.5" /> Fenêtre
                    </dt>
                    <dd className="text-sm font-semibold text-idn-ink">
                      30 jours
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>
          </div>

          <section>
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <div className="portal-section-kicker">Ventilation</div>
                <h2 className="mt-1 text-sm font-semibold text-idn-ink">
                  Par application
                </h2>
              </div>
              <span className="text-xs text-idn-muted">Période courante</span>
            </div>
            <div className="portal-table overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead>
                  <tr className="border-b border-idn-border bg-idn-surface-2">
                    <th className="px-4 py-3 font-semibold text-idn-muted">
                      Application
                    </th>
                    <th className="px-4 py-3 font-semibold text-idn-muted">
                      Environnement
                    </th>
                    <th className="px-4 py-3 font-semibold text-idn-muted">
                      Requêtes
                    </th>
                    <th className="px-4 py-3 font-semibold text-idn-muted">
                      Latence p95
                    </th>
                    <th className="px-4 py-3 font-semibold text-idn-muted">
                      Erreurs
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-idn-border-soft">
                  {groups.length > 0 ? (
                    groups.map((group) => {
                      const primary = group.production ?? group.sandbox
                      return (
                        <tr key={group.id} className="bg-idn-surface">
                          <td className="px-4 py-3 font-medium text-idn-ink">
                            {group.name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-1 font-mono text-[10px] ${group.production ? "bg-idn-green-soft text-idn-green" : "bg-idn-surface-2 text-idn-muted"}`}
                            >
                              {group.production ? "production" : "sandbox"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-idn-muted">—</td>
                          <td className="px-4 py-3 text-idn-muted">—</td>
                          <td className="px-4 py-3 text-idn-muted">—</td>
                          <td className="px-4 py-3 text-right">
                            <a
                              href={`/applications/${primary?.clientId}/keys`}
                              className="inline-flex items-center gap-1 font-semibold text-idn-green"
                            >
                              Ouvrir <ArrowUpRightIcon className="size-3" />
                            </a>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-idn-muted"
                      >
                        Les applications apparaîtront ici dès leur création.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
