import { Card, CardContent } from "@repo/ui/components/card"

import { pageMetadata } from "../../../lib/seo"
import { PageHero } from "../_components/page-hero"
import { about } from "../_content/fr"

export const metadata = pageMetadata({
  title: about.meta.title,
  description: about.meta.description,
  path: "/about",
})

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow={about.hero.eyebrow}
        title={about.hero.title}
        sub={about.hero.sub}
      />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-13 md:px-7">
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {about.stats.map((stat) => (
            <li key={stat.label}>
              <Card className="h-full">
                <CardContent className="px-5 py-4">
                  <p className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.06em] text-foreground/70">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-xs italic leading-relaxed text-muted-foreground">
                    {stat.hint}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-13 md:px-7">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {about.principles.eyebrow}
          </p>
          <ul className="mt-6 grid max-w-[920px] grid-cols-1 gap-x-9 gap-y-8 sm:grid-cols-2">
            {about.principles.items.map((principle) => (
              <li key={principle.title}>
                <h2 className="text-base font-semibold text-foreground">
                  {principle.title}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {principle.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 py-13 md:px-7">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {about.governance.eyebrow}
        </p>
        <p className="mt-4 max-w-[820px] text-sm leading-relaxed text-foreground/80">
          {about.governance.body}
        </p>
      </section>
    </>
  )
}
