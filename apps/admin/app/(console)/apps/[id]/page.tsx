"use client"

/**
 * Détail d'une application — port de idn-desktop.jsx:1633-1822 (AdminAppDetail).
 * Câblé sur `admin.oauthApps.getApp` (clientId) + audit récent filtré sur l'app.
 */
import { useState } from "react"
import { notFound, useParams, useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../../_content/fr"
import { AppActions } from "../../../_components/app-actions"
import { CredRow } from "../../../_components/cred-row"
import { EmptyState } from "../../../_components/empty-state"
import { OpHeader } from "../../../_components/op-header"

type AppDetail = {
  id: string
  clientId: string
  name: string
  redirectUrls: string
  scopes: string
  scopeCount: number
  loa: 1 | 2 | 3
  status: "production" | "pending" | "sandbox" | "disabled"
  disabled: boolean
  createdAt: number
  environment: "sandbox" | "production"
  sandboxClientId: string | null
  productionClientId: string | null
  linkedClientId: string | null
  productionStatus: "none" | "pending" | "approved" | "rejected"
  delegation: {
    enabled: boolean
    maxLoa: 1 | 2
    grantedAt?: number
  } | null
}

type AuditRow = {
  _id: string
  action: string
  targetType: string
  targetId: string
  actorId?: string
  metadata?: Record<string, unknown>
  createdAt: number
}

const ACTION_LABEL: Record<string, string> = {
  oauth_app_created: "App créée",
  oauth_app_modified: "Configuration modifiée",
  oauth_app_disabled: "App désactivée",
  delegation_enabled: "Délégation activée",
  delegation_disabled: "Délégation désactivée",
  delegated_identity_created: "Identité déléguée créée",
}

function fmtTs(ts: number) {
  const d = new Date(ts)
  const dayMs = 24 * 60 * 60 * 1000
  const isToday = Date.now() - ts < dayMs
  if (isToday) {
    return `Aujourd'hui ${d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`
  }
  return d
    .toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", " ·")
    .replace(".", "")
}

const LOA_LABEL: Record<1 | 2 | 3, string> = {
  1: "1 — Faible",
  2: "2 — Substantiel",
  3: "3 — Élevé",
}

const STATUS_LABEL: Record<AppDetail["status"], string> = {
  production: "production",
  pending: "pending",
  sandbox: "sandbox",
  disabled: "désactivée",
}

type DelegatedRow = {
  _id: string
  idnId?: string
  firstName?: string
  lastName?: string
  assignedLoa: 1 | 2
  status: "created" | "claimed"
  createdAt: number
  claimedAt?: number
}

function DelegationSection({
  clientId,
  delegation,
}: {
  clientId: string
  delegation: AppDetail["delegation"]
}) {
  const t = fr.appDetail.delegation
  const setDelegation = useMutation(api.admin.oauthApps.setDelegation)
  const [maxLoa, setMaxLoa] = useState<1 | 2>(delegation?.maxLoa ?? 1)
  const [busy, setBusy] = useState(false)

  const identities = useQuery(
    api.admin.oauthApps.listDelegatedIdentities,
    delegation?.enabled ? { clientId } : "skip",
  ) as DelegatedRow[] | undefined

  const toggle = async () => {
    setBusy(true)
    try {
      await setDelegation({
        clientId,
        enabled: !delegation?.enabled,
        maxLoa,
      })
    } finally {
      setBusy(false)
    }
  }

  const updateMaxLoa = async (loa: 1 | 2) => {
    setMaxLoa(loa)
    if (delegation?.enabled) {
      await setDelegation({ clientId, enabled: true, maxLoa: loa })
    }
  }

  return (
    <section className="portal-panel p-5">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-idn-ink">{t.title}</h2>
        <span
          className={
            "rounded-full px-2 py-0.5 text-[11px] font-medium " +
            (delegation?.enabled
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400")
          }
        >
          {delegation?.enabled ? t.enabled : t.disabled}
        </span>
      </div>
      <p className="mb-4 text-xs text-idn-muted">{t.description}</p>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-xs text-idn-muted">{t.maxLoa}</label>
        <select
          value={maxLoa}
          onChange={(e) => updateMaxLoa(Number(e.target.value) as 1 | 2)}
          className="rounded-md border border-idn-border bg-background px-2 py-1 text-xs text-idn-ink"
        >
          <option value={1}>{t.loa1}</option>
          <option value={2}>{t.loa2}</option>
        </select>
      </div>

      <button
        onClick={toggle}
        disabled={busy}
        className={
          "rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors " +
          (delegation?.enabled
            ? "border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
            : "bg-idn-green text-white hover:bg-idn-green/90")
        }
      >
        {delegation?.enabled ? t.disable : t.enable}
      </button>

      {delegation?.enabled && identities !== undefined && (
        <div className="mt-5 border-t border-idn-border-soft pt-4">
          <h3 className="mb-2 text-xs font-semibold text-idn-ink">
            {t.historyTitle}
          </h3>
          {identities.length === 0 ? (
            <p className="text-xs text-idn-muted">{t.emptyHistory}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-idn-border-soft text-idn-muted">
                    <th className="pb-1.5 pr-3 font-medium">{t.cols.idnId}</th>
                    <th className="pb-1.5 pr-3 font-medium">{t.cols.name}</th>
                    <th className="pb-1.5 pr-3 font-medium">{t.cols.loa}</th>
                    <th className="pb-1.5 pr-3 font-medium">{t.cols.status}</th>
                    <th className="pb-1.5 font-medium">{t.cols.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {identities.map((row) => (
                    <tr
                      key={row._id}
                      className="border-b border-idn-border-soft last:border-0"
                    >
                      <td className="py-1.5 pr-3 font-mono text-idn-ink">
                        {row.idnId ?? "—"}
                      </td>
                      <td className="py-1.5 pr-3 text-idn-ink">
                        {row.firstName && row.lastName
                          ? `${row.firstName} ${row.lastName}`
                          : "—"}
                      </td>
                      <td className="py-1.5 pr-3 text-idn-ink">
                        {row.assignedLoa}
                      </td>
                      <td className="py-1.5 pr-3">
                        <span
                          className={
                            "rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
                            (row.status === "claimed"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400")
                          }
                        >
                          {row.status === "claimed"
                            ? t.statusClaimed
                            : t.statusCreated}
                        </span>
                      </td>
                      <td className="py-1.5 text-idn-muted">
                        {fmtTs(row.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default function AppDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const router = useRouter()

  const app = useQuery(
    api.admin.oauthApps.getApp,
    id ? { clientId: id } : "skip",
  ) as AppDetail | null | undefined
  const events = useQuery(api.admin.auditLogs.list, { limit: 50 }) as
    | AuditRow[]
    | undefined

  if (app === undefined || events === undefined) {
    return <div className="min-h-svh bg-background" />
  }
  if (app === null) {
    notFound()
  }

  const appClientIds = new Set(
    [app.sandboxClientId, app.productionClientId, app.clientId].filter(
      (clientId): clientId is string => Boolean(clientId),
    ),
  )
  const appEvents = (events ?? [])
    .filter((e) => e.targetType === "app" && appClientIds.has(e.targetId))
    .slice(0, 10)

  const switchEnvironment = (environment: string) => {
    const target =
      environment === "production"
        ? app.productionClientId
        : app.sandboxClientId
    if (target && target !== app.clientId) router.push(`/apps/${target}`)
  }

  return (
    <>
      <OpHeader
        sub={`${app.name.toUpperCase()} · CLIENT_ID ${app.clientId} · ${STATUS_LABEL[app.status]}`}
        title={fr.appDetail.titleHead}
        right={
          <>
            <label className="flex items-center gap-2 text-xs text-idn-muted">
              Environnement
              <select
                value={app.environment}
                onChange={(event) => switchEnvironment(event.target.value)}
                className="h-8 rounded-lg border border-idn-border bg-idn-surface px-2.5 text-[13px] font-medium text-idn-ink outline-none focus-visible:ring-2 focus-visible:ring-idn-green"
                aria-label="Environnement de l'application"
              >
                <option value="sandbox" disabled={!app.sandboxClientId}>
                  Sandbox
                </option>
                <option value="production" disabled={!app.productionClientId}>
                  Production
                </option>
              </select>
            </label>
            <AppActions
              clientId={app.clientId}
              status={app.status}
              disabled={app.disabled}
              sandboxClientId={app.sandboxClientId}
              productionStatus={app.productionStatus}
            />
          </>
        }
      />
      <div className="portal-canvas grid flex-1 grid-cols-1 gap-4 overflow-auto xl:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-3.5">
          {app.productionStatus === "pending" && app.productionClientId ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-amber-950/30">
              <div className="font-semibold text-idn-ink">
                Demande de passage en production
              </div>
              <p className="mt-1 text-xs text-idn-muted">
                L&apos;environnement Production attend votre validation. Il
                reste désactivé sur l&apos;émetteur OIDC jusqu&apos;à son
                approbation.
              </p>
            </div>
          ) : null}
          <section className="portal-panel p-5">
            <h2 className="mb-3.5 text-[13px] font-semibold text-idn-ink">
              {fr.appDetail.oauthConfig}
            </h2>
            <CredRow label={fr.appDetail.cred.clientId} value={app.clientId} />
            <CredRow
              label={fr.appDetail.cred.redirectUris}
              value={app.redirectUrls || "—"}
            />
            <CredRow
              label={fr.appDetail.cred.scopes}
              value={app.scopes || "—"}
            />
            <CredRow
              label={fr.appDetail.cred.loaMin}
              value={LOA_LABEL[app.loa]}
            />
            <CredRow
              label={fr.appDetail.cred.consent}
              value={
                app.loa >= 2
                  ? "non-trusted (écran de consentement requis)"
                  : "trusted"
              }
            />
          </section>
          <DelegationSection
            clientId={app.clientId}
            delegation={app.delegation}
          />
        </div>

        <aside className="portal-panel p-5">
          <h2 className="mb-3.5 text-[13px] font-semibold text-idn-ink">
            {fr.appDetail.eventHistory}
          </h2>
          {appEvents.length === 0 ? (
            <EmptyState
              title="Aucun événement"
              description="Les modifications de configuration apparaîtront ici."
              className="border-0 px-0 py-6"
            />
          ) : (
            <ol role="list">
              {appEvents.map((x, i, arr) => (
                <li
                  key={x._id}
                  className={
                    "flex gap-3 py-2.5 " +
                    (i === arr.length - 1
                      ? ""
                      : "border-b border-idn-border-soft")
                  }
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-idn-green"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-idn-ink">
                      {ACTION_LABEL[x.action] ?? x.action}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-idn-muted">
                      {fmtTs(x.createdAt)} · {x.actorId ?? "—"}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </>
  )
}
