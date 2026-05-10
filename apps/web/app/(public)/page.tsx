import type { Metadata } from "next"
import Link from "next/link"
import { LogInIcon, UserPlusIcon } from "lucide-react"

import { Button } from "@repo/ui/components/button"
import { Card } from "@repo/ui/components/card"
import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"

import { welcome } from "./_content/fr"

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
    <section className="mx-auto w-full max-w-[1180px] px-4 py-12 md:px-7 md:py-15 lg:py-20">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div>
          <div className="mb-6 flex items-center gap-2.5">
            <IdnFlagBars width={36} height={3} />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {welcome.eyebrow}
            </span>
          </div>

          <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-foreground sm:text-5xl lg:text-[52px]">
            {welcome.title.line1}
            <br />
            {welcome.title.line2}
            <br />
            <span className="text-idn-green">{welcome.title.line3}</span>
          </h1>

          <p className="mt-5 max-w-[460px] text-base leading-relaxed text-muted-foreground">
            {welcome.sub}
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <Button asChild size="lg" className="h-12 px-5 text-[15px] has-[>svg]:px-5">
              <Link href="/inscription">
                <UserPlusIcon className="size-[18px]" aria-hidden="true" />
                {welcome.ctaPrimary}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 px-5 text-[15px] has-[>svg]:px-5"
            >
              <Link href="/connexion">
                <LogInIcon className="size-[18px]" aria-hidden="true" />
                {welcome.ctaSecondary}
              </Link>
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl p-7">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {welcome.loa.eyebrow}
          </p>
          <ul className="mt-4 divide-y divide-idn-border-soft">
            {welcome.loa.items.map((item) => (
              <li key={item.level} className="flex items-start gap-3.5 py-3.5">
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
  )
}
