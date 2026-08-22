"use client"

import Link from "next/link"
import { useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"

import { fr } from "../../_content/fr"
import { IdnIcons } from "../../_components/icons"
import { OpHeader } from "../../_components/op-header"

const initial = (s: string): string => (s.trim()[0] ?? "?").toUpperCase()

const envBadgeClass = (env: "production" | "sandbox") =>
  env === "production"
    ? "bg-idn-green-soft text-idn-green dark:bg-[#0F2A18]"
    : "bg-idn-surface-2 text-idn-muted"

const envLabel = (env: "production" | "sandbox") =>
  env === "production"
    ? fr.applications.card.env.production
    : fr.applications.card.env.sandbox

const prodStatusBadge = (
  status: "none" | "pending" | "approved" | "rejected",
): { label: string; className: string } | null => {
  if (status === "pending") {
    return {
      label: "PROD : EN ATTENTE",
      className:
        "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    }
  }
  if (status === "approved") {
    return {
      label: "PROD : APPROUVÉE",
      className: "bg-idn-green-soft text-idn-green dark:bg-[#0F2A18]",
    }
  }
  if (status === "rejected") {
    return {
      label: "PROD : REFUSÉE",
      className: "bg-destructive/10 text-destructive",
    }
  }
  return null
}

export default function ApplicationsPage() {
  const apps = useQuery(api.developer.apps.listMine, {}) ?? null

  const subText = fr.applications.sub.replace(
    "{count}",
    apps !== null ? String(apps.length) : "—",
  )

  return (
    <>
      <OpHeader
        sub={subText}
        title={fr.applications.title}
        right={
          <Button asChild size="sm" className="gap-1">
            <Link href="/applications/new">
              {IdnIcons.plus} {fr.applications.newApp}
            </Link>
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-7 py-6">
        {apps === null ? (
          <div className="rounded-xl border border-idn-border bg-idn-surface p-6 text-sm text-idn-muted">
            Chargement…
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-xl border border-idn-border bg-idn-surface p-8 text-center">
            <h2 className="text-lg font-semibold text-idn-ink">
              {fr.applications.empty.title}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-idn-muted">
              {fr.applications.empty.body}
            </p>
            <Button asChild size="sm" className="mt-5 gap-1">
              <Link href="/applications/new">
                {IdnIcons.plus} {fr.applications.empty.cta}
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {apps.map((app) => (
              <li key={app.id}>
                <Link
                  href={`/applications/${app.clientId}/keys`}
                  className="flex items-center gap-3.5 rounded-xl border border-idn-border bg-idn-surface p-4 outline-none transition-colors hover:bg-idn-surface-2 focus-visible:ring-2 focus-visible:ring-idn-green"
                >
                  <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-idn-surface-2 text-base font-semibold text-idn-ink">
                    {initial(app.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-idn-ink">
                      {app.name}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.06em] ${envBadgeClass(
                          app.env,
                        )}`}
                      >
                        {envLabel(app.env)}
                      </span>
                      {(() => {
                        const badge =
                          app.env === "sandbox"
                            ? prodStatusBadge(app.productionStatus)
                            : null
                        return badge ? (
                          <span
                            className={`rounded-full px-2 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.06em] ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        ) : null
                      })()}
                      <span className="rounded-full bg-idn-surface-2 px-2 py-px font-mono text-[10px] text-idn-muted">
                        Niveau {app.loa}
                      </span>
                      {app.scopes.slice(0, 4).map((scope) => (
                        <span
                          key={scope}
                          className="rounded-full bg-idn-surface-2 px-2 py-px font-mono text-[10px] text-idn-muted"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
                      {fr.applications.card.usage}
                    </div>
                    <div className="mt-0.5 font-mono text-base font-semibold text-idn-ink">
                      {app.services.length} {fr.nav.services.toLowerCase()}
                    </div>
                  </div>
                </Link>
                <div className="mt-1 flex justify-end">
                  <Link
                    href={`/applications/${app.clientId}/webhooks`}
                    className="rounded-md px-2 py-1 text-[11px] font-semibold text-idn-green hover:bg-idn-green-soft"
                  >
                    Webhooks →
                  </Link>
                  <Link
                    href={`/applications/${app.clientId}/services`}
                    className="rounded-md px-2 py-1 text-[11px] font-semibold text-idn-green hover:bg-idn-green-soft"
                  >
                    {fr.nav.services} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
