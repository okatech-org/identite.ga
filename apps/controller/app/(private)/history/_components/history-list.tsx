"use client"

import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

import { IdnCard } from "../../../_components/idn-card"
import { ResultBadge } from "../../../_components/result-badge"

const FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

function formatTs(ts: number): string {
  // Cible "10 mai · 14:32" — Intl ne sait pas insérer le séparateur
  // français médian, on le fait à la main.
  const parts = FORMATTER.formatToParts(new Date(ts))
  const day = parts.find((p) => p.type === "day")?.value ?? ""
  const month = (parts.find((p) => p.type === "month")?.value ?? "").replace(
    ".",
    "",
  )
  const hour = parts.find((p) => p.type === "hour")?.value ?? ""
  const minute = parts.find((p) => p.type === "minute")?.value ?? ""
  return `${day} ${month} · ${hour}:${minute}`
}

export function HistoryList() {
  const entries = useQuery(api.controller.history.listMine, {})

  if (entries === undefined) {
    return (
      <IdnCard className="overflow-hidden p-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={
              i === 3
                ? "flex items-center gap-3.5 px-5 py-3.5"
                : "flex items-center gap-3.5 border-b border-idn-border-soft px-5 py-3.5"
            }
          >
            <div className="h-3 w-[110px] animate-pulse rounded bg-idn-surface-2" />
            <div className="h-3.5 flex-1 animate-pulse rounded bg-idn-surface-2" />
            <div className="h-3 flex-1 animate-pulse rounded bg-idn-surface-2" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-idn-surface-2" />
          </div>
        ))}
      </IdnCard>
    )
  }

  if (entries.length === 0) {
    return (
      <IdnCard>
        <div className="text-sm text-idn-muted">
          Aucun contrôle effectué dans la période. Les revues KYC, scans et
          vérifications de signature apparaîtront ici.
        </div>
      </IdnCard>
    )
  }

  return (
    <IdnCard className="overflow-hidden p-0">
      {entries.map((h, i) => (
        <div
          key={h._id}
          className={
            i === entries.length - 1
              ? "flex items-center gap-3.5 px-5 py-3.5"
              : "flex items-center gap-3.5 border-b border-idn-border-soft px-5 py-3.5"
          }
        >
          <span className="w-[130px] font-mono text-[11px] text-idn-muted">
            {formatTs(h.createdAt)}
          </span>
          <span className="flex-1 text-[13px] font-medium text-idn-ink">
            {h.citizenName || "—"}
          </span>
          <span className="flex-1 text-xs text-idn-muted">
            {h.location || labelForAction(h.action)}
          </span>
          <ResultBadge result={h.result} />
        </div>
      ))}
    </IdnCard>
  )
}

function labelForAction(action: string): string {
  switch (action) {
    case "kyc_approved":
      return "Revue KYC — approuvée"
    case "kyc_rejected":
      return "Revue KYC — rejetée"
    case "identity_check_performed":
      return "Contrôle terrain"
    case "signature_verified":
      return "Vérification signature"
    default:
      return action
  }
}
