import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@repo/ui/components/button"
import { Card } from "@repo/ui/components/card"

import { PageHero } from "../_components/page-hero"
import { contact } from "../_content/fr"
import { ContactForm } from "./_form"

export const metadata: Metadata = {
  title: contact.meta.title,
  description: contact.meta.description,
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow={contact.hero.eyebrow}
        title={contact.hero.title}
        sub={contact.hero.sub}
      />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-10 md:px-7">
        <ul className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {contact.channels.map((channel) => (
            <li key={channel.title}>
              <Card className="flex h-full flex-col p-6">
                <h2 className="text-base font-semibold text-foreground">
                  {channel.title}
                </h2>
                <p className="mt-2.5 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                  {channel.description}
                </p>
                <div className="mt-4 flex">
                  <Button asChild variant="outline" size="sm">
                    <Link href={channel.href}>{channel.cta}</Link>
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-15 md:px-7">
        <Card className="max-w-[760px] p-6 md:p-7">
          <header className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">
              {contact.form.title}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {contact.form.sub}
            </p>
          </header>
          <ContactForm />
        </Card>
      </section>
    </>
  )
}
