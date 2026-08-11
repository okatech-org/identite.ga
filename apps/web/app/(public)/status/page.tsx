import { Card, CardContent } from "@repo/ui/components/card"

import { pageMetadata } from "../../../lib/seo"
import { PageHero } from "../_components/page-hero"
import { status as statusContent } from "../_content/fr"
import { PLATFORM_COMPONENTS } from "./_data"

export const metadata = pageMetadata({
  title: statusContent.meta.title,
  description: statusContent.meta.description,
  path: "/status",
})

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
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {statusContent.componentsLabel}
          </h2>
          <p className="mt-3 max-w-[720px] text-[13px] leading-relaxed text-foreground/80">
            {statusContent.componentsIntro}
          </p>

          <Card className="mt-5 overflow-hidden p-0">
            <ul className="divide-y divide-idn-border-soft">
              {PLATFORM_COMPONENTS.map((component) => (
                <li key={component.name} className="p-5">
                  <p className="text-sm font-semibold text-foreground">
                    {component.name}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {component.role}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <h2 className="mt-13 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {statusContent.indicatorsLabel}
          </h2>
          <p className="mt-3 max-w-[720px] text-[13px] leading-relaxed text-foreground/80">
            {statusContent.indicatorsIntro}
          </p>

          <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {statusContent.indicators.map((indicator) => (
              <li key={indicator.metric}>
                <Card className="h-full">
                  <CardContent className="px-5 py-4">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      {indicator.domain}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold text-foreground">
                      {indicator.metric}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {indicator.shows}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <p className="mt-9 border-l-2 border-idn-green pl-4 text-sm italic leading-relaxed text-foreground/80">
            {statusContent.closing}
          </p>
        </div>
      </section>
    </>
  )
}
