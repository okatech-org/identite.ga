"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import {
  ActivityIcon,
  ArrowUpRightIcon,
  BoxesIcon,
  CircleDotDashedIcon,
  RocketIcon,
} from "lucide-react"

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
      <div className="portal-canvas flex-1 overflow-auto">
        <div className="portal-limit space-y-6">
          {applicationGroups === null ? (
            <div className="portal-panel p-6 text-sm text-idn-muted">
              Chargement…
            </div>
          ) : applicationGroups.length === 0 ? (
            <div className="portal-panel p-10 text-center">
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
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <div className="portal-section-kicker">Portefeuille</div>
                  <h2 className="mt-1 text-lg font-semibold text-idn-ink">
                    Applications et environnements
                  </h2>
                </div>
                <span className="text-xs text-idn-muted">
                  {applicationGroups.length} espace
                  {applicationGroups.length > 1 ? "s" : ""} de travail
                </span>
              </div>
              <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                {applicationGroups.map((group) => {
                  const primary = group.sandbox ?? group.production
                  if (!primary) return null
                  const productionStatus =
                    group.sandbox?.productionStatus ?? "none"
                  const productionBadge = group.production
                    ? prodStatusBadge(
                        productionStatus === "none"
                          ? "approved"
                          : productionStatus,
                      )
                    : prodStatusBadge(productionStatus)
                  const remainingScopes = Math.max(primary.scopes.length - 4, 0)
                  const serviceCount = primary.services.length

                  return (
                    <li key={group.id} className="h-full">
                      <Link
                        href={`/applications/${primary.clientId}/keys`}
                        className="portal-panel portal-panel-interactive group flex h-full min-h-[314px] flex-col overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-idn-green"
                      >
                        <div className="flex items-center justify-between border-b border-idn-border-soft bg-idn-surface-2/70 px-5 py-3">
                          <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
                            <CircleDotDashedIcon className="size-3.5 text-idn-green" />
                            Atelier OAuth
                          </span>
                          <ArrowUpRightIcon className="size-4 text-idn-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-idn-green" />
                        </div>

                        <div className="flex flex-1 flex-col p-5">
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
                            <h2 className="text-lg font-semibold tracking-[-0.01em] text-idn-ink">
                              {group.name}
                            </h2>
                            <code className="mt-1.5 block max-w-full truncate text-[11px] text-idn-muted">
                              {primary.clientId}
                            </code>
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

                          <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-idn-border-soft pt-5">
                            <div>
                              <dt className="flex items-center gap-1 text-[10px] text-idn-muted">
                                <ActivityIcon className="size-3" /> LoA
                              </dt>
                              <dd className="mt-1 text-sm font-semibold text-idn-ink">
                                Niveau {primary.loa}
                              </dd>
                            </div>
                            <div>
                              <dt className="flex items-center gap-1 text-[10px] text-idn-muted">
                                <BoxesIcon className="size-3" /> Services
                              </dt>
                              <dd className="mt-1 text-sm font-semibold text-idn-ink">
                                {serviceCount}
                              </dd>
                            </div>
                            <div>
                              <dt className="flex items-center gap-1 text-[10px] text-idn-muted">
                                <RocketIcon className="size-3" /> Accès
                              </dt>
                              <dd className="mt-1 text-sm font-semibold text-idn-ink">
                                {primary.scopes.length}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
