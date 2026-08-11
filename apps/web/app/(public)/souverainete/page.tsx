import { Card, CardContent } from "@repo/ui/components/card"

import { pageMetadata } from "../../../lib/seo"
import { PageHero } from "../_components/page-hero"
import { sovereignty } from "../_content/fr"

export const metadata = pageMetadata({
  title: sovereignty.meta.title,
  description: sovereignty.meta.description,
  path: "/souverainete",
})

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </h2>
  )
}

export default function SouverainetePage() {
  return (
    <>
      <PageHero
        eyebrow={sovereignty.hero.eyebrow}
        title={sovereignty.hero.title}
        sub={sovereignty.hero.sub}
      />

      {/* Le principe */}
      <section className="mx-auto w-full max-w-[1180px] px-4 pb-13 md:px-7">
        <div className="max-w-[920px]">
          <SectionLabel>{sovereignty.thesis.eyebrow}</SectionLabel>
          <blockquote className="mt-4 border-l-2 border-idn-green pl-5">
            <p className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
              {sovereignty.thesis.quote}
            </p>
          </blockquote>
          <p className="mt-4 max-w-[760px] text-sm leading-relaxed text-foreground/80">
            {sovereignty.thesis.body}
          </p>
        </div>
      </section>

      {/* Ce que l'infrastructure protège */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-13 md:px-7">
          <SectionLabel>{sovereignty.protections.eyebrow}</SectionLabel>
          <ul className="mt-6 grid grid-cols-1 gap-x-9 gap-y-8 sm:grid-cols-2">
            {sovereignty.protections.items.map((item) => (
              <li key={item.title}>
                <h3 className="text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>

          <Card className="mt-9 max-w-[920px] border-l-2 border-l-idn-green">
            <CardContent className="px-5 py-4">
              <p className="text-sm font-semibold text-foreground">
                {sovereignty.bothWays.title}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {sovereignty.bothWays.body}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Ce que la plateforme ne fait pas */}
      <section className="mx-auto w-full max-w-[1180px] px-4 py-13 md:px-7">
        <div className="max-w-[920px]">
          <SectionLabel>{sovereignty.limits.eyebrow}</SectionLabel>
          <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-foreground/80">
            {sovereignty.limits.intro}
          </p>
          <Card className="mt-5 overflow-hidden p-0">
            <ul className="divide-y divide-idn-border-soft">
              {sovereignty.limits.items.map((item) => (
                <li key={item.capability} className="p-5">
                  <p className="text-sm font-semibold text-foreground">
                    {item.capability}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {item.position}
                  </p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Continuité et non-dépendance */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-13 md:px-7">
          <div className="max-w-[920px]">
            <SectionLabel>{sovereignty.continuity.eyebrow}</SectionLabel>
            <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-foreground/80">
              {sovereignty.continuity.intro}
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-x-9 gap-y-7 sm:grid-cols-2">
              {sovereignty.continuity.items.map((item) => (
                <li key={item.guarantee}>
                  <h3 className="text-sm font-semibold text-foreground">
                    {item.guarantee}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {item.implementation}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Ce que nous n'affirmons pas */}
      <section className="mx-auto w-full max-w-[1180px] px-4 py-13 md:px-7">
        <div className="max-w-[920px]">
          <SectionLabel>{sovereignty.reserves.eyebrow}</SectionLabel>
          <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-foreground/80">
            {sovereignty.reserves.intro}
          </p>
          <ul className="mt-5 space-y-3">
            {sovereignty.reserves.items.map((item) => (
              <li key={item.title}>
                <Card className="border-l-2 border-l-idn-yellow">
                  <CardContent className="px-5 py-4">
                    <p className="text-sm font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <div className="mt-11 border-l-2 border-idn-green pl-5">
            <p className="text-base font-semibold italic leading-snug text-foreground">
              {sovereignty.proof.title}
            </p>
            <p className="mt-2 max-w-[760px] text-sm leading-relaxed text-foreground/80">
              {sovereignty.proof.body}
            </p>
          </div>
        </div>
      </section>

      {/* Fondements juridiques */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-13 md:px-7">
          <div className="max-w-[920px]">
            <SectionLabel>{sovereignty.legal.eyebrow}</SectionLabel>
            <p className="mt-3 max-w-[760px] text-sm leading-relaxed text-foreground/80">
              {sovereignty.legal.intro}
            </p>
            <dl className="mt-6 space-y-5">
              {sovereignty.legal.items.map((item) => (
                <div key={item.reference}>
                  <dt className="text-sm font-semibold text-foreground">
                    {item.reference}
                  </dt>
                  <dd className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {item.scope}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </>
  )
}
