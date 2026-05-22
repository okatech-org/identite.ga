import { pageMetadata } from "../../../../lib/seo"
import { terms } from "../../_content/fr"
import { LegalSectionsPage } from "../_legal-sections"

export const metadata = pageMetadata({
  title: terms.meta.title,
  description: terms.meta.description,
  path: "/legal/terms",
})

export default function TermsPage() {
  return <LegalSectionsPage hero={terms.hero} sections={terms.sections} />
}
