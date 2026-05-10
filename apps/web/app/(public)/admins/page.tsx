import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@repo/ui/components/button"
import { Card } from "@repo/ui/components/card"

import { PageHero } from "../_components/page-hero"
import { administrations } from "../_content/fr"

export const metadata: Metadata = {
  title: administrations.meta.title,
  description: administrations.meta.description,
}

export default function AdministrationsPage() {
  return (
    <>
      <PageHero
        eyebrow={administrations.hero.eyebrow}
        title={administrations.hero.title}
        sub={administrations.hero.sub}
      />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-15 md:px-7">
        <ol className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {administrations.steps.map((step) => (
            <li key={step.n}>
              <Card className="h-full p-5">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Étape {step.n}
                </p>
                <h2 className="mt-2.5 text-base font-semibold text-foreground">
                  {step.title}
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-15 md:px-7">
        <Card className="p-7">
          <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {administrations.cta.title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                {administrations.cta.sub}
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 md:justify-end">
              <Button asChild variant="outline" size="lg">
                <Link href="/dev/documentation">
                  {administrations.cta.secondary}
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/dev">{administrations.cta.primary}</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </>
  )
}
