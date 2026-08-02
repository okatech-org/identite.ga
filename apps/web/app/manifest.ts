import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from "../lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    id: "/dashboard",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    background_color: "#ffffff",
    theme_color: "#009e60",
    lang: "fr-GA",
    orientation: "portrait",
    categories: ["government", "productivity", "utilities"],
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Mon espace", short_name: "Accueil", url: "/dashboard" },
      {
        name: "Mon rendez-vous Niveau 3",
        short_name: "Entretien",
        url: "/kyc?target=3",
      },
      {
        name: "Notifications",
        short_name: "Notifications",
        url: "/settings",
      },
    ],
  };
}
