"use client"

import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../_content/fr"
import { OpHeader } from "../../_components/op-header"
import { StatCard } from "../../_components/stat-card"

export default function UsagePage() {
  const usage = useQuery(api.developer.apps.usage, {})

  const hasData = usage?.hasData ?? false
  const series = usage?.series ?? []
  const max = Math.max(1, ...series)

  const quotaLabel = `${(usage?.requestsQuota ?? 100_000) / 1000}k`.replace(
    ".",
    ",",
  )

  return (
    <>
      <OpHeader sub={fr.usage.sub} title={fr.usage.title} />
      <div className="flex-1 overflow-auto px-7 py-6">
        <div className="grid gap-3.5 md:grid-cols-3">
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

        <div className="mt-3.5 rounded-xl border border-idn-border bg-idn-surface p-5">
          <div className="text-[13px] font-semibold text-idn-ink">
            {fr.usage.chart.title}
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
        </div>
      </div>
    </>
  )
}
