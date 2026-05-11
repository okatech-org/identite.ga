import { pageMetadata } from "../../../lib/seo"
import { PageHero } from "../_components/page-hero"
import { legal } from "../_content/fr"

export const metadata = pageMetadata({
  title: legal.meta.title,
  description: legal.meta.description,
  path: "/legal",
})

export default function LegalPage() {
  return (
    <>
      <PageHero
        eyebrow={legal.hero.eyebrow}
        title={legal.hero.title}
        sub={legal.hero.sub}
      />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-15 md:px-7">
        <ol className="max-w-[760px] space-y-6">
          {legal.sections.map((section, idx) => (
            <li key={section.title} className="border-t border-border pt-6">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-idn-green dark:text-idn-green-on-dark">
                § {idx + 1}
              </p>
              <h2 className="mt-1.5 text-[17px] font-semibold text-foreground">
                {section.title}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">
                {section.body}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
