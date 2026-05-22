import { PageHero } from "../_components/page-hero"

type Section = { readonly title: string; readonly body: string }

type LegalSectionsPageProps = {
  hero: {
    readonly eyebrow: string
    readonly title: string
    readonly sub: string
  }
  sections: readonly Section[]
}

/**
 * Mise en page partagée par les pages légales structurées en sections
 * (privacy, terms, mentions, accessibilité). Reprend le visuel de
 * l'ancien `/legal` mais isolé pour réutilisation propre.
 */
export function LegalSectionsPage({ hero, sections }: LegalSectionsPageProps) {
  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        sub={hero.sub}
      />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-15 md:px-7">
        <ol className="max-w-[760px] space-y-6">
          {sections.map((section, idx) => (
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
