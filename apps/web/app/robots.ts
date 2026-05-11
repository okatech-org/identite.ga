import type { MetadataRoute } from "next"

import { SITE_URL } from "../lib/seo"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
          "/dashboard",
          "/profile",
          "/kyc",
          "/settings",
          "/consents",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
