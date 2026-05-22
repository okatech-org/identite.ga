import { pageMetadata } from "../../../../lib/seo"
import { accessibility } from "../../_content/fr"
import { LegalSectionsPage } from "../_legal-sections"

export const metadata = pageMetadata({
  title: accessibility.meta.title,
  description: accessibility.meta.description,
  path: "/legal/accessibilite",
})

export default function AccessibilityPage() {
  return (
    <LegalSectionsPage
      hero={accessibility.hero}
      sections={accessibility.sections}
    />
  )
}
