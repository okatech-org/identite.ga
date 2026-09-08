"use client"

/**
 * Applications — port de idn-desktop.jsx:922-1093 (AdminApps).
 * Câblé sur `admin.oauthApps.listApps`.
 */
import Link from "next/link"
import { useQuery } from "convex/react"

import { cn } from "@repo/ui/lib/utils"
import { LoABadge } from "@repo/ui/components/loa-badge"
import { api } from "@repo/backend/convex/_generated/api"

import { fr } from "../../_content/fr"
import { CreateAppDialog } from "../../_components/create-app-dialog"
import { EmptyState } from "../../_components/empty-state"
import { IdnIcons } from "../../_components/icons"
import { OpHeader } from "../../_components/op-header"

type AppRow = {
  id: string
  clientId: string
  name: string
  scopeCount: number
  loa: 1 | 2 | 3
  status: "production" | "pending" | "sandbox" | "disabled"
  disabled: boolean
}

const STATUS_DOT: Record<AppRow["status"], string> = {
  production: "bg-idn-green",
  pending: "bg-idn-yellow",
  sandbox: "bg-idn-muted",
  disabled: "bg-destructive",
}

export default function AppsPage() {
  const data = useQuery(api.admin.oauthApps.listApps, { limit: 200 }) as
    | AppRow[]
    | undefined
  const apps = data ?? []

  const totalLabel = `OAUTH · ${apps.length} APPLICATION${apps.length > 1 ? "S" : ""}`

  return (
    <>
      <OpHeader
        sub={totalLabel}
        title={fr.apps.title}
        right={
          <>
            <button
              type="button"
              className="inline-flex h-8 w-[200px] items-center justify-start gap-2 rounded-lg border border-idn-border bg-transparent px-3 text-[13px] text-idn-muted outline-none hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
            >
              <span aria-hidden>{IdnIcons.search}</span>
              {fr.apps.search}
            </button>
            <CreateAppDialog />
          </>
        }
      />
      <div className="portal-canvas flex-1 overflow-auto">
        <div className="portal-limit">
          {apps.length === 0 ? (
            <EmptyState
              title="Aucune application OAuth"
              description="Aucune application n'est encore enregistrée. Cliquez sur « Nouvelle app » pour en créer une."
            />
          ) : (
            <div className="portal-table">
              <div className="grid grid-cols-[1.6fr_1.4fr_1fr_0.8fr_0.8fr_40px] border-b border-idn-border bg-idn-surface-2 px-[18px] py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
                <div>{fr.apps.cols.name}</div>
                <div>{fr.apps.cols.clientId}</div>
                <div>{fr.apps.cols.loaMin}</div>
                <div>{fr.apps.cols.scopes}</div>
                <div>{fr.apps.cols.status}</div>
                <div></div>
              </div>
              {apps.map((a, i) => (
                <Link
                  key={a.id}
                  href={`/apps/${a.clientId}`}
                  className={cn(
                    "grid grid-cols-[1.6fr_1.4fr_1fr_0.8fr_0.8fr_40px] items-center px-[18px] py-3.5 text-[13px] text-idn-ink outline-none transition-colors hover:bg-idn-surface-2 focus-visible:bg-idn-surface-2",
                    i < apps.length - 1 && "border-b border-idn-border-soft",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-idn-surface-2 text-xs font-semibold text-idn-ink">
                      {(a.name[0] ?? "?").toUpperCase()}
                    </div>
                    <span className="font-medium">{a.name}</span>
                  </div>
                  <div className="font-mono text-[11px] text-idn-muted">
                    {a.clientId}
                  </div>
                  <div>
                    <LoABadge level={a.loa} compact />
                  </div>
                  <div className="text-idn-muted">{a.scopeCount}</div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        STATUS_DOT[a.status],
                      )}
                      aria-hidden
                    />
                    <span className="text-xs text-idn-ink-2">{a.status}</span>
                  </div>
                  <div className="text-idn-muted" aria-hidden>
                    {IdnIcons.more}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
