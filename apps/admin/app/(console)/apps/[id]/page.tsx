"use client"

/**
 * Détail d'une application — port de idn-desktop.jsx:1633-1822 (AdminAppDetail).
 * Câblé sur `admin.oauthApps.getApp` (clientId) + audit récent filtré sur l'app.
 */
import { notFound, useParams } from "next/navigation"
import { useQuery } from "convex/react"

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

export default function AppDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params.id

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

  const appEvents = (events ?? [])
    .filter((e) => e.targetType === "app" && e.targetId === id)
    .slice(0, 10)

  return (
    <>
      <OpHeader
        sub={`${app.name.toUpperCase()} · CLIENT_ID ${app.clientId} · ${STATUS_LABEL[app.status]}`}
        title={fr.appDetail.titleHead}
        right={
          <AppActions
            clientId={app.clientId}
            status={app.status}
            disabled={app.disabled}
          />
        }
      />
      <div className="grid flex-1 grid-cols-[1.4fr_1fr] gap-3.5 overflow-auto p-7">
        <div className="flex flex-col gap-3.5">
          <section className="rounded-xl border border-idn-border bg-idn-surface p-5">
            <h2 className="mb-3.5 text-[13px] font-semibold text-idn-ink">
              {fr.appDetail.oauthConfig}
            </h2>
            <CredRow
              label={fr.appDetail.cred.clientId}
              value={app.clientId}
            />
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
        </div>

        <aside className="rounded-xl border border-idn-border bg-idn-surface p-5">
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
