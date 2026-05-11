import type { MetadataRoute } from "next"

import { ARTICLES_FLAT } from "./docs/_articles/registry"
import { absoluteUrl } from "../lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const entries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/docs"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ]

  for (const article of ARTICLES_FLAT) {
    // Les articles "Bientôt" (stubs) sont signalés mais on les laisse dans le
    // sitemap pour annoncer leur existence ; priority plus basse.
    entries.push({
      url: absoluteUrl(`/docs/${article.slug}`),
      lastModified,
      changeFrequency: "monthly",
      priority: article.comingSoon ? 0.3 : 0.8,
    })
  }

  return entries
}
