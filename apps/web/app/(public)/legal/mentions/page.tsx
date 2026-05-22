import { pageMetadata } from "../../../../lib/seo"
import { mentions } from "../../_content/fr"
import { LegalSectionsPage } from "../_legal-sections"

export const metadata = pageMetadata({
  title: mentions.meta.title,
  description: mentions.meta.description,
  path: "/legal/mentions",
})

export default function MentionsPage() {
  return <LegalSectionsPage hero={mentions.hero} sections={mentions.sections} />
}
