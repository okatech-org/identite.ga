"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { ArrowUpRightIcon } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"

import { fr } from "../../_content/fr"
import { groupApplications } from "../../_components/application-groups"
import { IdnIcons } from "../../_components/icons"
import { OpHeader } from "../../_components/op-header"

const initial = (s: string): string => (s.trim()[0] ?? "?").toUpperCase()

const prodStatusBadge = (
  status: "none" | "pending" | "approved" | "rejected",
): { label: string; className: string } | null => {
  if (status === "pending") {
    return {
      label: "Production en attente",
      className:
        "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    }
  }
  if (status === "approved") {
    return {
      label: "Production",
      className: "bg-idn-green-soft text-idn-green dark:bg-[#0F2A18]",
    }
  }
  if (status === "rejected") {
    return {
      label: "Production refusée",
      className: "bg-destructive/10 text-destructive",
    }
  }
  return null
}

export default function ApplicationsPage() {
  const apps = useQuery(api.developer.apps.listMine, {}) ?? null
  const applicationGroups = apps === null ? null : groupApplications(apps)

  const subText = fr.applications.sub.replace(
    "{count}",
    applicationGroups !== null ? String(applicationGroups.length) : "—",
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
        {applicationGroups === null ? (
          <div className="rounded-xl border border-idn-border bg-idn-surface p-6 text-sm text-idn-muted">
            Chargement…
          </div>
        ) : applicationGroups.length === 0 ? (
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
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {applicationGroups.map((group) => {
              const primary = group.sandbox ?? group.production
              if (!primary) return null
              const productionStatus = group.sandbox?.productionStatus ?? "none"
              const productionBadge = group.production
                ? prodStatusBadge(
                    productionStatus === "none" ? "approved" : productionStatus,
                  )
                : prodStatusBadge(productionStatus)
              const remainingScopes = Math.max(primary.scopes.length - 4, 0)
              const serviceCount = primary.services.length

              return (
                <li key={group.id} className="h-full">
                  <Link
                    href={`/applications/${primary.clientId}/keys`}
                    className="group flex min-h-[250px] h-full flex-col rounded-2xl border border-idn-border bg-idn-surface p-5 outline-none transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-idn-green/35 hover:shadow-[0_14px_36px_rgba(24,52,32,0.08)] focus-visible:ring-2 focus-visible:ring-idn-green"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-idn-surface-2 text-lg font-semibold text-idn-ink transition-colors group-hover:bg-idn-green-soft group-hover:text-idn-green">
                        {initial(group.name)}
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {group.sandbox ? (
                          <span className="rounded-full bg-idn-surface-2 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-idn-muted">
                            {fr.applications.card.env.sandbox}
                          </span>
                        ) : null}
                        {productionBadge ? (
                          <span
                            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] ${productionBadge.className}`}
                          >
                            {productionBadge.label}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
                        OAuth · Niveau {primary.loa}
                      </div>
                      <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.01em] text-idn-ink">
                        {group.name}
                      </h2>
                    </div>

                    <div className="mt-5 flex min-h-7 flex-wrap content-start gap-1.5">
                      {primary.scopes.slice(0, 4).map((scope) => (
                        <span
                          key={scope}
                          className="rounded-md bg-idn-surface-2 px-2 py-1 font-mono text-[10px] text-idn-muted"
                        >
                          {scope}
                        </span>
                      ))}
                      {remainingScopes > 0 ? (
                        <span className="rounded-md bg-idn-surface-2 px-2 py-1 font-mono text-[10px] text-idn-muted">
                          +{remainingScopes}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-4 pt-7">
                      <span className="text-xs text-idn-muted">
                        {serviceCount} service{serviceCount === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-idn-green">
                        Ouvrir
                        <ArrowUpRightIcon
                          className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden
                        />
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </>
  )
}
