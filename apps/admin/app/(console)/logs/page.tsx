"use client"

/**
 * Logs — port de idn-desktop.jsx:1249-1370 (AdminLogs).
 * Câblé sur `admin.auditLogs.list` avec filtres date + limit.
 *
 * Defaults : 100 dernières entrées sur l'heure en cours.
 * Filtres user : plage horaire (heure / 24h / 7j / tout) + nombre (100/250/500).
 * Export CSV : sérialise localement les `logs` déjà filtrés par la query.
 */
import { useMemo, useState } from "react"
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

type Range = "hour" | "24h" | "7d" | "all"
type Limit = 100 | 250 | 500

const RANGE_LABEL: Record<Range, string> = {
  hour: "Heure en cours",
  "24h": "24 heures",
  "7d": "7 jours",
  all: "Tout",
}

const RANGE_LABEL_COMPACT: Record<Range, string> = {
  hour: "HEURE EN COURS",
  "24h": "24 DERNIÈRES HEURES",
  "7d": "7 DERNIERS JOURS",
  all: "HISTORIQUE COMPLET",
}

const RANGE_MS: Record<Exclude<Range, "all">, number> = {
  hour: 3_600_000,
  "24h": 86_400_000,
  "7d": 7 * 86_400_000,
}

const LIMIT_OPTIONS: Limit[] = [100, 250, 500]

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

/** Échappe une cellule CSV (RFC 4180). */
function csvCell(value: unknown): string {
  if (value === undefined || value === null) return ""
  const s = typeof value === "string" ? value : String(value)
  if (
    s.includes(",") ||
    s.includes('"') ||
    s.includes("\n") ||
    s.includes("\r")
  ) {
    return `"${s.replaceAll('"', '""')}"`
  }
  return s
}

function buildCsv(logs: LogRow[]): string {
  const header = [
    "timestamp_iso",
    "level",
    "action",
    "target_type",
    "target_id",
    "actor_id",
    "ip",
    "metadata",
  ].join(",")
  const lines = logs.map((l) => {
    const level = LEVEL_BY_ACTION[l.action] ?? "info"
    return [
      csvCell(new Date(l.createdAt).toISOString()),
      csvCell(level),
      csvCell(l.action),
      csvCell(l.targetType),
      csvCell(l.targetId),
      csvCell(l.actorId ?? ""),
      csvCell(l.ip ?? ""),
      csvCell(l.metadata ? JSON.stringify(l.metadata) : ""),
    ].join(",")
  })
  return [header, ...lines].join("\r\n")
}

function fileSuffix(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours(),
  )}${pad(d.getMinutes())}`
}

export default function LogsPage() {
  const [range, setRange] = useState<Range>("hour")
  const [limit, setLimit] = useState<Limit>(100)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // dateFrom mémoïsé pour éviter de pulvériser le cache useQuery à chaque
  // render (Date.now() change à chaque tick sinon).
  const dateFrom = useMemo(() => {
    if (range === "all") return undefined
    // On accepte de ne pas recalculer pendant que l'utilisateur reste sur
    // la page : `dateFrom` se fige au moment de la sélection. Un changement
    // de range relance le calcul et rafraîchit la fenêtre côté query.
    return Date.now() - RANGE_MS[range]
  }, [range])

  const queryArgs = useMemo<{ limit: number; dateFrom?: number }>(() => {
    return dateFrom !== undefined ? { limit, dateFrom } : { limit }
  }, [limit, dateFrom])

  const data = useQuery(api.admin.auditLogs.list, queryArgs) as
    | LogRow[]
    | undefined
  const logs = data ?? []

  const onExport = () => {
    if (logs.length === 0) return
    const csv = buildCsv(logs)
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `idn-audit-${range}-${fileSuffix()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const sub = `AUDIT · ${RANGE_LABEL_COMPACT[range]} · ${logs.length} ENTRÉE${
    logs.length > 1 ? "S" : ""
  }`

  return (
    <>
      <OpHeader
        sub={sub}
        title={fr.logs.title}
        right={
          <>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="logs-filters-panel"
              className={cn(
                "inline-flex h-8 items-center rounded-lg border bg-transparent px-3 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-idn-green",
                filtersOpen
                  ? "border-idn-green text-idn-green"
                  : "border-idn-border text-idn-ink hover:bg-idn-surface-2",
              )}
            >
              {fr.logs.filters}
            </button>
            <button
              type="button"
              onClick={onExport}
              disabled={logs.length === 0 || data === undefined}
              className="inline-flex h-8 items-center rounded-lg border border-idn-border bg-transparent px-3 text-[13px] font-medium text-idn-ink outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green disabled:opacity-50"
            >
              {fr.logs.export}
            </button>
          </>
        }
      />
      {filtersOpen ? (
        <div
          id="logs-filters-panel"
          className="border-b border-idn-border bg-idn-bg px-7 py-4"
        >
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
                Plage
              </span>
              <div className="flex gap-1">
                {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={cn(
                      "h-7 rounded-lg px-2.5 text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-idn-green",
                      range === r
                        ? "bg-idn-green-soft text-idn-green"
                        : "text-idn-muted hover:bg-idn-surface-2",
                    )}
                  >
                    {RANGE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
                Nombre
              </span>
              <div className="flex gap-1">
                {LIMIT_OPTIONS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLimit(l)}
                    className={cn(
                      "h-7 rounded-lg px-2.5 font-mono text-[11px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-idn-green",
                      limit === l
                        ? "bg-idn-green-soft text-idn-green"
                        : "text-idn-muted hover:bg-idn-surface-2",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <div className="portal-canvas flex-1 overflow-auto">
        <div className="portal-limit">
          {logs.length === 0 ? (
            <EmptyState
              title="Aucun événement audité"
              description={
                range === "hour"
                  ? "Aucun log dans l'heure en cours. Élargissez la plage pour voir l'historique."
                  : "Aucun log dans la plage sélectionnée."
              }
            />
          ) : (
            <div className="portal-table font-mono text-xs">
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
      </div>
    </>
  )
}
