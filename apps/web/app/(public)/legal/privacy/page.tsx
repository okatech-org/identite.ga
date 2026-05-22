import { pageMetadata } from "../../../../lib/seo"
import { privacy } from "../../_content/fr"
import { LegalSectionsPage } from "../_legal-sections"

export const metadata = pageMetadata({
  title: privacy.meta.title,
  description: privacy.meta.description,
  path: "/legal/privacy",
})

export default function PrivacyPage() {
  return <LegalSectionsPage hero={privacy.hero} sections={privacy.sections} />
}
