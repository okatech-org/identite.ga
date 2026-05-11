import type { MetadataRoute } from "next"

import { SITE_URL } from "../lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/docs", "/docs/"],
        disallow: [
          "/",
          "/api/",
          "/applications",
          "/applications/",
          "/keys",
          "/keys/",
          "/usage",
          "/usage/",
          "/settings",
          "/settings/",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
