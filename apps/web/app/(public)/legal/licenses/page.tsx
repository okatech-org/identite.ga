import { pageMetadata } from "../../../../lib/seo"
import { PageHero } from "../../_components/page-hero"
import { licenses } from "../../_content/fr"

export const metadata = pageMetadata({
  title: licenses.meta.title,
  description: licenses.meta.description,
  path: "/legal/licenses",
})

export default function LicensesPage() {
  return (
    <>
      <PageHero
        eyebrow={licenses.hero.eyebrow}
        title={licenses.hero.title}
        sub={licenses.hero.sub}
      />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-15 md:px-7">
        <div className="max-w-[820px] space-y-8">
          <p className="text-[13px] leading-relaxed text-foreground/80">
            {licenses.intro}
          </p>

          {licenses.groups.map((group) => (
            <div key={group.title} className="border-t border-border pt-6">
              <h2 className="text-[17px] font-semibold text-foreground">
                {group.title}
              </h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {group.items.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-baseline justify-between gap-3 text-[13px]"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-idn-green dark:hover:text-idn-green-on-dark"
                    >
                      {item.name}
                    </a>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {item.license}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
