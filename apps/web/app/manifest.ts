import type { MetadataRoute } from "next"

import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from "../lib/seo"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#009e60",
    lang: "fr-GA",
    orientation: "portrait",
    categories: ["government", "productivity", "utilities"],
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/png",
      },
    ],
  }
}
