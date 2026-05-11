"use client"

/**
 * Logs — port de idn-desktop.jsx:1249-1370 (AdminLogs).
 * Câblé sur `admin.auditLogs.list`.
 */
import { useQuery } from "convex/react"

import { cn } from "@repo/ui/lib/utils"

import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../_content/fr"
import { EmptyState } from "../../_components/empty-state"
import { OpHeader } from "../../_components/op-header"

type LogRow = {
  _id: string
  actorId?: string
  action: string
  targetType: string
  targetId: string
  ip?: string
  metadata?: Record<string, unknown>
  createdAt: number
}

const LEVEL_BY_ACTION: Record<string, "info" | "warn" | "error"> = {
  login_failure: "error",
  login_lockout: "error",
  otp_expired: "warn",
  kyc_rejected: "warn",
  account_disabled: "warn",
  consent_revoked: "warn",
  role_revoked: "warn",
  oauth_app_disabled: "warn",
}

const LEVEL_COLOR = {
  info: "text-idn-muted",
  warn: "text-idn-yellow",
  error: "text-[#B83A3A]",
} as const

function fmtTs(ts: number) {
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function shortEvent(action: string) {
  return action.replace(/_/g, ".")
}

function shortMeta(r: LogRow) {
  const parts: string[] = []
  if (r.targetId) parts.push(r.targetId)
  if (r.ip) parts.push(`ip ${r.ip}`)
  if (r.metadata) {
    for (const [k, v] of Object.entries(r.metadata)) {
      parts.push(`${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    }
  }
  return parts.join(" · ")
}

export default function LogsPage() {
  const data = useQuery(api.admin.auditLogs.list, { limit: 200 }) as
    | LogRow[]
    | undefined
  const logs = data ?? []

  return (
    <>
      <OpHeader
        sub={fr.logs.sub}
        title={fr.logs.title}
        right={
          <>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-lg border border-idn-border bg-transparent px-3 text-[13px] font-medium text-idn-ink outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
            >
              {fr.logs.filters}
            </button>
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-lg border border-idn-border bg-transparent px-3 text-[13px] font-medium text-idn-ink outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
            >
              {fr.logs.export}
            </button>
          </>
        }
      />
      <div className="flex-1 overflow-auto p-7">
        {logs.length === 0 ? (
          <EmptyState
            title="Aucun événement audité"
            description="Les actions sensibles (connexions, KYC, OAuth, RBAC) apparaîtront ici en temps réel."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-idn-border bg-idn-surface font-mono text-xs">
            {logs.map((l, i) => {
              const level = LEVEL_BY_ACTION[l.action] ?? "info"
              return (
                <div
                  key={l._id}
                  className={cn(
                    "grid grid-cols-[90px_60px_1.2fr_1.6fr_2fr] items-center gap-3 px-[18px] py-2.5",
                    i < logs.length - 1 && "border-b border-idn-border-soft",
                  )}
                >
                  <span className="text-idn-muted">{fmtTs(l.createdAt)}</span>
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase",
                      LEVEL_COLOR[level],
                    )}
                  >
                    {level}
                  </span>
                  <span className="font-medium text-idn-ink">
                    {shortEvent(l.action)}
                  </span>
                  <span className="text-idn-ink-2">{l.actorId ?? "—"}</span>
                  <span className="truncate text-idn-muted">
                    {shortMeta(l)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
