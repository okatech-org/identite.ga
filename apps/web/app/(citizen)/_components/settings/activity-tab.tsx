"use client"

import * as React from "react"
import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"
import { cn } from "@repo/ui/lib/utils"

import {
  auditActionLabels,
  formatAuditMeta,
  formatRelativeDate,
  settings,
} from "../../_content/fr"
import { SettingsSection } from "../settings-section"

type Filter = "all" | "auth" | "consent" | "kyc" | "security"

const FILTER_MATCH: Record<Filter, (action: string) => boolean> = {
  all: () => true,
  auth: (a) => a.startsWith("login_") || a.startsWith("otp_") || a === "session_revoked" || a === "session_revoked_global",
  consent: (a) => a.startsWith("consent_"),
  kyc: (a) => a.startsWith("kyc_"),
  security: (a) =>
    a === "password_changed" ||
    a === "pin_changed" ||
    a === "email_changed" ||
    a === "account_disabled",
}

export function ActivityTab() {
  const [filter, setFilter] = React.useState<Filter>("all")
  const data = useQuery(api.activity.listMine, { limit: 50 })
  const isLoading = data === undefined
  const filtered = (data ?? []).filter((row) => FILTER_MATCH[filter](row.action))

  return (
    <SettingsSection title={settings.activity.title} sub={settings.activity.sub}>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(Object.keys(FILTER_MATCH) as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
              filter === f
                ? "bg-idn-green-soft font-semibold text-idn-green dark:bg-[#0F2A18] dark:text-idn-green-on-dark"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80",
            )}
          >
            {settings.activity.filters[f]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded bg-secondary" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{settings.activity.empty}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          {filtered.map((row, i) => (
            <div
              key={row._id}
              className={cn(
                "flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4",
                i < filtered.length - 1 && "border-b border-idn-border-soft",
              )}
            >
              <span className="font-mono text-[11px] text-muted-foreground sm:w-[130px] sm:shrink-0">
                {formatRelativeDate(row.createdAt)}
              </span>
              <span className="text-[13px] font-medium text-foreground sm:flex-1">
                {auditActionLabels[row.action] ?? row.action}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatAuditMeta(row.action, row.metadata, row.ip)}
              </span>
            </div>
          ))}
        </div>
      )}
    </SettingsSection>
  )
}
