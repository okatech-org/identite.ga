"use client"

import Link from "next/link"
import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

import { OpHeader } from "./op-header"
import { IdnCard } from "./idn-card"
import { ResultBadge } from "./result-badge"
import { dashboard } from "../_content/fr"
import { NavIcons } from "./icons"

const FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

function formatTs(ts: number): string {
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

/**
 * Tableau de bord du contrôleur — câblé sur :
 *   - profile.getCurrentUser  (salutation personnalisée)
 *   - controller.queue.pendingCount  (compteur file en attente)
 *   - controller.history.todayCount  (contrôles du jour)
 *   - controller.history.listMine    (5 dernières entrées)
 */
export function DashboardPage() {
  const me = useQuery(api.profile.getCurrentUser)
  const pending = useQuery(api.controller.queue.pendingCount, {})
  const today = useQuery(api.controller.history.todayCount, {})
  const recent = useQuery(api.controller.history.listMine, { limit: 5 })

  const firstName = me?.profile?.pivot?.firstName ?? ""
  const lastName = me?.profile?.pivot?.lastName ?? ""
  const greetingName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    (me?.email ? `Agent ${me.email.split("@")[0]}` : "")

  return (
    <>
      <OpHeader
        sub={greetingName ? dashboard.sub(greetingName) : dashboard.subFallback}
        title={dashboard.title}
      />
      <div className="flex-1 overflow-auto p-7">
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
          <DashCard
            sub={dashboard.cards.queue.sub}
            headline={
              pending === undefined
                ? null
                : dashboard.cards.queue.headline(pending)
            }
            cta={dashboard.cards.queue.cta}
            href="/queue"
            icon={NavIcons.shield}
          />
          <DashCard
            sub={dashboard.cards.history.sub}
            headline={
              today === undefined
                ? null
                : dashboard.cards.history.headline(today)
            }
            cta={dashboard.cards.history.cta}
            href="/history"
            icon={NavIcons.doc}
          />
          <DashCard
            sub={dashboard.cards.verify.sub}
            headline={dashboard.cards.verify.headline}
            cta={dashboard.cards.verify.cta}
            href="/verify"
            icon={NavIcons.check}
          />
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
            {recent === undefined ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={
                    i === 2
                      ? "flex items-center gap-3.5 px-5 py-3.5"
                      : "flex items-center gap-3.5 border-b border-idn-border-soft px-5 py-3.5"
                  }
                >
                  <div className="h-3 w-[110px] animate-pulse rounded bg-idn-surface-2" />
                  <div className="h-3.5 flex-1 animate-pulse rounded bg-idn-surface-2" />
                  <div className="h-3 flex-1 animate-pulse rounded bg-idn-surface-2" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-idn-surface-2" />
                </div>
              ))
            ) : recent.length === 0 ? (
              <div className="px-5 py-6 text-sm text-idn-muted">
                {dashboard.recent.empty}
              </div>
            ) : (
              recent.map((h, i) => (
                <div
                  key={h._id}
                  className={
                    i === recent.length - 1
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
              ))
            )}
          </div>
        </IdnCard>
      </div>
    </>
  )
}

function DashCard({
  sub,
  headline,
  cta,
  href,
  icon: Icon,
}: {
  sub: string
  headline: string | null
  cta: string
  href: string
  icon: (typeof NavIcons)[keyof typeof NavIcons]
}) {
  return (
    <Link
      href={href}
      className="rounded-[12px] border border-idn-border bg-idn-surface p-5 transition-colors hover:border-idn-green focus-visible:border-idn-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-idn-green/30"
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
        <Icon aria-hidden="true" className="size-3.5" />
        {sub}
      </div>
      <div className="mt-3 min-h-[24px] text-[18px] font-semibold leading-tight text-idn-ink">
        {headline ?? (
          <span className="inline-block h-5 w-40 animate-pulse rounded bg-idn-surface-2" />
        )}
      </div>
      <div className="mt-2 text-[13px] text-idn-green dark:text-idn-green-on-dark">
        {cta} →
      </div>
    </Link>
  )
}
