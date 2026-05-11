import Link from "next/link"
import { ShieldCheckIcon } from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui/components/accordion"
import { Button } from "@repo/ui/components/button"

import { faqJsonLd, jsonLdScript } from "../../../lib/json-ld"
import { pageMetadata } from "../../../lib/seo"
import { PageHero } from "../_components/page-hero"
import { help } from "../_content/fr"

export const metadata = pageMetadata({
  title: help.meta.title,
  description: help.meta.description,
  path: "/help",
})

export default function HelpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(faqJsonLd([...help.faqs])),
        }}
      />
      <PageHero
        eyebrow={help.hero.eyebrow}
        title={help.hero.title}
        sub={help.hero.sub}
      />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-15 md:px-7">
        <div className="max-w-[760px]">
        <Accordion type="single" collapsible className="w-full">
          {help.faqs.map((faq, idx) => (
            <AccordionItem key={faq.q} value={`faq-${idx}`}>
              <AccordionTrigger className="text-[15px] font-semibold text-foreground">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <aside
          className="mt-8 flex flex-col items-start gap-4 rounded-[14px] bg-idn-blue-soft p-5 dark:bg-[#10243A] sm:flex-row sm:items-center"
          aria-label="Centre d'appel IDN"
        >
          <ShieldCheckIcon
            className="size-6 shrink-0 text-idn-blue dark:text-idn-blue-on-dark"
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {help.callCenter.title}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {help.callCenter.sub}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/contact">{help.callCenter.cta}</Link>
          </Button>
        </aside>
        </div>
      </section>
    </>
  )
}
