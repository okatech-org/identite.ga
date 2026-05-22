import Link from "next/link"

import { pageMetadata } from "../../../lib/seo"
import { PageHero } from "../_components/page-hero"
import { legal } from "../_content/fr"

export const metadata = pageMetadata({
  title: legal.meta.title,
  description: legal.meta.description,
  path: "/legal",
})

export default function LegalIndexPage() {
  return (
    <>
      <PageHero
        eyebrow={legal.hero.eyebrow}
        title={legal.hero.title}
        sub={legal.hero.sub}
      />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-15 md:px-7">
        <ul className="grid max-w-[920px] grid-cols-1 gap-4 sm:grid-cols-2">
          {legal.items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block h-full rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/40 hover:bg-accent"
              >
                <h2 className="text-base font-semibold text-foreground">
                  {item.title}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
