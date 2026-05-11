import type { Metadata } from "next"
import Link from "next/link"
import { LogInIcon, UserPlusIcon } from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { Card } from "@repo/ui/components/card"
import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { IdnMark } from "@repo/ui/components/idn-mark"

import { navActions, welcome } from "./_content/fr"

export const metadata: Metadata = {
  title: welcome.meta.title,
  description: welcome.meta.description,
}

const LOA_COLORS = {
  1: "text-idn-muted",
  2: "text-idn-blue",
  3: "text-idn-green",
} as const

export default function HomePage() {
  return (
    <>
      {/* Mobile (< lg) — match maquette 01 : tout le bloc centré verticalement, texte aligné à gauche, CTAs full-width inclus dans le bloc centré */}
      <section className="flex flex-1 flex-col justify-center gap-8 px-6 py-8 lg:hidden">
        <div>
          <div className="mb-7 flex items-start gap-3">
            <IdnMark size={36} />
            <div className="flex flex-col">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {navActions.republic}
              </span>
              <span className="text-base font-semibold leading-tight text-foreground">
                {navActions.brand}
              </span>
            </div>
          </div>

          <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] text-foreground">
            {welcome.title.line1}
            <br />
            {welcome.title.line2}
            <br />
            <span className="text-idn-green dark:text-idn-green-on-dark">
              {welcome.title.line3}
            </span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            {welcome.sub}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="h-14 w-full text-base">
            <Link href="/sign-up/profile">{welcome.ctaPrimary}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 w-full text-base"
          >
            <Link href="/sign-in">{welcome.ctaSecondary}</Link>
          </Button>
        </div>
      </section>

      {/* Desktop (>= lg) — split hero + LoA card */}
      <section className="mx-auto hidden w-full max-w-[1180px] flex-1 flex-col justify-center px-6 py-10 sm:px-6 sm:py-12 md:px-7 md:py-15 lg:flex lg:py-20">
        <div className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <div className="mb-5 flex items-center gap-2.5 sm:mb-6">
              <IdnFlagBars width={36} height={3} />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {welcome.eyebrow}
              </span>
            </div>

            <h1 className="text-3xl font-semibold leading-[1.15] tracking-[-0.01em] text-foreground sm:text-4xl sm:leading-[1.1] sm:tracking-[-0.02em] md:text-5xl lg:text-[52px] lg:leading-[1.05] lg:tracking-[-0.025em]">
              {welcome.title.line1}
              <br />
              {welcome.title.line2}
              <br />
              <span className="text-idn-green dark:text-idn-green-on-dark">
                {welcome.title.line3}
              </span>
            </h1>

            <p className="mt-4 max-w-[460px] text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-base">
              {welcome.sub}
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/sign-up/profile">
                  <UserPlusIcon aria-hidden="true" />
                  {welcome.ctaPrimary}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Link href="/sign-in">
                  <LogInIcon aria-hidden="true" />
                  {welcome.ctaSecondary}
                </Link>
              </Button>
            </div>
          </div>

          <Card className="rounded-2xl p-5 sm:p-7">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {welcome.loa.eyebrow}
            </p>
            <ul className="mt-3 divide-y divide-idn-border-soft sm:mt-4">
              {welcome.loa.items.map((item) => (
                <li
                  key={item.level}
                  className="flex items-start gap-3.5 py-3 sm:py-3.5"
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-secondary text-sm font-semibold ${LOA_COLORS[item.level as 1 | 2 | 3]}`}
                    aria-hidden="true"
                  >
                    {item.level}
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-foreground">
                      Niveau {item.level} — {item.name}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </>
  )
}
