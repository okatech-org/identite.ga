import { Card } from "@repo/ui/components/card"
import { cn } from "@repo/ui/lib/utils"

import { pageMetadata } from "../../../lib/seo"
import { PageHero } from "../_components/page-hero"
import { status as statusContent } from "../_content/fr"
import {
  RECENT_INCIDENTS,
  STATUS_COMPONENTS,
  type ServiceStatus,
  type StatusComponent,
} from "./_data"

export const metadata = pageMetadata({
  title: statusContent.meta.title,
  description: statusContent.meta.description,
  path: "/status",
})

const SPARKLINE_BARS = 60

const dotClass: Record<ServiceStatus, string> = {
  operational: "bg-idn-green",
  degraded: "bg-idn-yellow",
  outage: "bg-destructive",
}

const labelClass: Record<ServiceStatus, string> = {
  operational: "text-idn-green dark:text-idn-green-on-dark",
  degraded: "text-idn-yellow",
  outage: "text-destructive",
}

function Sparkline({ component }: { component: StatusComponent }) {
  const incidents = new Set(component.incidentDays ?? [])
  return (
    <div
      className="hidden gap-[2px] sm:flex"
      role="img"
      aria-label={`Disponibilité 90 jours : ${component.uptime}%`}
    >
      {Array.from({ length: SPARKLINE_BARS }).map((_, i) => {
        const fail = incidents.has(i)
        return (
          <span
            key={i}
            className={cn(
              "block h-[22px] w-[4px] rounded-[1px]",
              fail
                ? component.status === "degraded"
                  ? "bg-idn-yellow"
                  : "bg-destructive"
                : "bg-idn-green",
            )}
          />
        )
      })}
    </div>
  )
}

export default function StatusPage() {
  return (
    <>
      <PageHero
        eyebrow={statusContent.hero.eyebrow}
        title={statusContent.hero.title}
        sub={statusContent.hero.sub}
      />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-15 md:px-7">
        <div className="max-w-[920px]">
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-idn-border-soft">
            {STATUS_COMPONENTS.map((component) => (
              <li
                key={component.name}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-4"
              >
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full",
                    dotClass[component.status],
                  )}
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {component.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    uptime 90 j · {component.uptime.toFixed(2).replace(".", ",")} %
                  </p>
                </div>
                <Sparkline component={component} />
                <span
                  className={cn(
                    "text-xs font-semibold sm:w-32 sm:text-right",
                    labelClass[component.status],
                  )}
                >
                  {component.statusLabel}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {statusContent.incidentsLabel}
        </p>
        <ul className="mt-3 space-y-3">
          {RECENT_INCIDENTS.map((incident) => (
            <li key={incident.id}>
              <Card className="p-4.5">
                <div className="flex gap-3">
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      dotClass[incident.severity],
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {incident.title}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {incident.startedAt} ·{" "}
                      {incident.status === "ongoing" ? "en cours" : "résolu"}
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">
                      {incident.body}
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
        </div>
      </section>
    </>
  )
}
