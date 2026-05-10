"use client"

import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"
import { cn } from "@repo/ui/lib/utils"

import {
  auditActionLabels,
  dashboard,
  formatAuditMeta,
  formatRelativeDate,
} from "../_content/fr"

export function RecentActivity({ className }: { className?: string }) {
  const data = useQuery(api.activity.listMine, { limit: 5 })

  return (
    <section className={cn("", className)} aria-labelledby="recent-activity">
      <p
        id="recent-activity"
        className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
      >
        {dashboard.recentEyebrow}
      </p>
      {data === undefined ? (
        <div className="mt-3 h-32 animate-pulse rounded-xl bg-secondary" />
      ) : data.length === 0 ? (
        <div className="mt-3 rounded-xl border border-border bg-card p-5 text-center text-xs text-muted-foreground">
          {dashboard.recentEmpty}
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
          {data.map((row, i) => {
            const label =
              auditActionLabels[row.action] ?? row.action
            const meta = formatAuditMeta(row.action, row.metadata, row.ip)
            return (
              <div
                key={row._id}
                className={cn(
                  "flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5",
                  i < data.length - 1 && "border-b border-idn-border-soft",
                )}
              >
                <span className="font-mono text-[11px] text-muted-foreground sm:w-[130px] sm:shrink-0">
                  {formatRelativeDate(row.createdAt)}
                </span>
                <span className="text-[13px] font-medium text-foreground sm:flex-1">
                  {label}
                </span>
                {meta && (
                  <span className="text-xs text-muted-foreground">{meta}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
