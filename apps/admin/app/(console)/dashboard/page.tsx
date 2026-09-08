"use client"

/**
 * Tableau de bord — port de idn-desktop.jsx:615-920 (AdminDashboard).
 * Câblé sur les queries `admin.dashboard.*` + `admin.users.totalAccounts`.
 */
import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../_content/fr"
import { ActivityFeed } from "../../_components/activity-feed"
import { LoaPie } from "../../_components/loa-pie"
import { OpHeader } from "../../_components/op-header"
import { SparklineBars } from "../../_components/sparkline-bars"
import { StatCard } from "../../_components/stat-card"
import type { ActivityRow, LoaSlice } from "../../_mocks/dashboard"

type Kpis = {
  users: {
    total: number
    byLoa: { loa1: number; loa2: number; loa3: number }
    byProfile: {
      citizen: number
      resident: number
      visitor: number
      developer: number
    }
  }
  kyc: {
    pending: number
    submitted: number
    underReview: number
    approved: number
    rejected: number
  }
}

type DailyLogin = { day: number; count: number }
type RecentRow = {
  _id: string
  action: string
  targetType: string
  targetId: string
  actorId?: string
  metadata?: Record<string, unknown>
  createdAt: number
}
type RawApp = { status: string; disabled: boolean }

const ACTION_LABEL: Record<string, string> = {
  oauth_app_created: "Application enregistrée",
  oauth_app_modified: "Application modifiée",
  oauth_app_disabled: "Application désactivée",
  role_assigned: "Rôle assigné",
  role_revoked: "Rôle révoqué",
  kyc_approved: "KYC approuvé",
  kyc_rejected: "KYC rejeté",
  kyc_submitted: "KYC soumis",
  otp_expired: "OTP expiré",
  login_success: "Connexion réussie",
  login_failure: "Échec de connexion",
  password_changed: "Mot de passe modifié",
  admin_action: "Action administrateur",
}

const ACTION_TAG: Record<string, string> = {
  oauth_app_created: "apps",
  oauth_app_modified: "apps",
  oauth_app_disabled: "apps",
  role_assigned: "rbac",
  role_revoked: "rbac",
  kyc_approved: "kyc",
  kyc_rejected: "kyc",
  kyc_submitted: "kyc",
  otp_expired: "security",
  login_success: "auth",
  login_failure: "security",
  password_changed: "security",
  admin_action: "config",
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function activityRow(r: RecentRow): ActivityRow {
  return {
    t: formatTime(r.createdAt),
    e: ACTION_LABEL[r.action] ?? r.action,
    d: r.targetId,
    tag: ACTION_TAG[r.action] ?? r.targetType,
  }
}

function loaSlices(kpis: Kpis | null | undefined): LoaSlice[] {
  if (!kpis || kpis.users.total === 0) {
    return [
      { label: "Niveau 1", value: 0, color: "muted" },
      { label: "Niveau 2", value: 0, color: "blue" },
      { label: "Niveau 3", value: 0, color: "green" },
    ]
  }
  const t = kpis.users.total
  const pct = (n: number) => Math.round((n / t) * 100)
  return [
    { label: "Niveau 1", value: pct(kpis.users.byLoa.loa1), color: "muted" },
    { label: "Niveau 2", value: pct(kpis.users.byLoa.loa2), color: "blue" },
    { label: "Niveau 3", value: pct(kpis.users.byLoa.loa3), color: "green" },
  ]
}

function normalizeSparkline(buckets: DailyLogin[]): number[] {
  if (buckets.length === 0) return new Array(15).fill(0)
  const max = Math.max(...buckets.map((b) => b.count), 1)
  return buckets.map((b) => Math.round((b.count / max) * 100))
}

function pickAxis(buckets: DailyLogin[]) {
  if (buckets.length < 3) return { left: "", mid: "", right: "" }
  const fmt = (ms: number) =>
    new Date(ms)
      .toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
      .toUpperCase()
      .replace(".", "")
  return {
    left: fmt(buckets[0]!.day),
    mid: fmt(buckets[Math.floor(buckets.length / 2)]!.day),
    right: fmt(buckets[buckets.length - 1]!.day),
  }
}

export default function DashboardPage() {
  const kpis = useQuery(api.admin.dashboard.getDashboardKpis, {}) as
    | Kpis
    | undefined
  const totalAccounts = useQuery(api.admin.users.totalAccounts, {}) as
    | number
    | undefined
  const daily = useQuery(api.admin.dashboard.getDailyLogins, { days: 15 }) as
    | DailyLogin[]
    | undefined
  const recent = useQuery(api.admin.dashboard.getRecentActivity, {
    limit: 4,
  }) as RecentRow[] | undefined
  const apps = useQuery(api.admin.oauthApps.listApps, { limit: 200 }) as
    | RawApp[]
    | undefined

  const accounts = totalAccounts ?? 0
  const sparkline = normalizeSparkline(daily ?? [])
  const axis = pickAxis(daily ?? [])
  const activeApps = (apps ?? []).filter((a) => !a.disabled).length
  const pendingApps = (apps ?? []).filter(
    (a) => a.status === "pending" && !a.disabled,
  ).length
  const todayLogins = daily?.length ? daily[daily.length - 1]!.count : 0

  // Hints dynamiques — pas de pic à 14h32 hardcodé : on remplace par des
  // valeurs réelles tirées des queries.
  const weeklyTotal = (daily ?? []).slice(-7).reduce((s, b) => s + b.count, 0)
  const previousWeekTotal = (daily ?? [])
    .slice(-14, -7)
    .reduce((s, b) => s + b.count, 0)
  const accountsHint =
    weeklyTotal === 0 && previousWeekTotal === 0
      ? "Aucune connexion 7 jours"
      : previousWeekTotal === 0
        ? `+${weeklyTotal} connexions 7 j`
        : (() => {
            const pct = Math.round(
              ((weeklyTotal - previousWeekTotal) / previousWeekTotal) * 100,
            )
            const sign = pct >= 0 ? "+" : ""
            return `${sign}${pct}% vs sem. dernière`
          })()

  const peakLabel = (() => {
    if (!daily || daily.length === 0) return ""
    const peak = daily.reduce((best, b) => (b.count > best.count ? b : best))
    if (peak.count === 0) return "Aucune connexion 15 j"
    const d = new Date(peak.day)
    return `pic ${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} (${peak.count})`
  })()

  return (
    <>
      <OpHeader
        sub={fr.dashboard.sub}
        title={fr.dashboard.title}
        right={
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-lg border border-idn-border bg-transparent px-3 text-[13px] font-medium text-idn-ink outline-none transition-colors hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
          >
            {fr.dashboard.exportCsv}
          </button>
        }
      />
      <div className="portal-canvas flex-1 overflow-auto">
        <div className="portal-limit">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={fr.dashboard.stats.accounts.label}
              value={accounts.toLocaleString("fr-FR")}
              hint={accountsHint}
            />
            <StatCard
              label={fr.dashboard.stats.logins.label}
              value={todayLogins.toLocaleString("fr-FR")}
              hint={peakLabel}
            />
            <StatCard
              label={fr.dashboard.stats.apps.label}
              value={String(activeApps)}
              hint={
                pendingApps > 0
                  ? `${pendingApps} en attente de revue`
                  : "Aucune app en attente"
              }
            />
            <StatCard
              label={fr.dashboard.stats.otpFail.label}
              value="—"
              hint={fr.dashboard.stats.otpFail.hint}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
            <section className="portal-panel p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold text-idn-ink">
                    {fr.dashboard.chart.title}
                  </div>
                  <div className="mt-0.5 text-[11px] text-idn-muted">
                    {fr.dashboard.chart.subtitle}
                  </div>
                </div>
                <div className="flex gap-3 text-[11px] text-idn-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-[2px] bg-idn-green" />
                    {fr.dashboard.chart.legendSuccess}
                  </span>
                </div>
              </div>
              <SparklineBars values={sparkline} className="mt-[18px] h-40" />
              <div className="mt-2 flex justify-between font-mono text-[10px] text-idn-muted">
                <span>{axis.left}</span>
                <span>{axis.mid}</span>
                <span>{axis.right}</span>
              </div>
            </section>

            <section className="portal-panel p-5">
              <div className="text-[13px] font-semibold text-idn-ink">
                {fr.dashboard.pie.title}
              </div>
              <div className="mt-0.5 text-[11px] text-idn-muted">
                {fr.dashboard.pie.subtitle}
              </div>
              <LoaPie slices={loaSlices(kpis)} />
            </section>
          </div>

          <ActivityFeed rows={(recent ?? []).map(activityRow)} />
        </div>
      </div>
    </>
  )
}
