import { pageMetadata } from "../../../lib/seo"
import { PageHero } from "../_components/page-hero"
import { services } from "../_content/fr"
import { ServicesList } from "./_list"

export const metadata = pageMetadata({
  title: services.meta.title,
  description: services.meta.description,
  path: "/services",
})

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow={services.hero.eyebrow}
        title={services.hero.title}
        sub={services.hero.sub}
      />
      <section className="mx-auto w-full max-w-[1180px] px-4 pb-15 md:px-7">
        <ServicesList />
      </section>
    </>
  )
}
