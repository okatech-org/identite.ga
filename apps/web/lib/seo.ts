import type { Metadata } from "next"

/**
 * URL canonique du site public. Surchargeable par `NEXT_PUBLIC_SITE_URL`
 * pour les environnements de preview / staging.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://identite.ga"
).replace(/\/$/, "")

export const SITE_NAME = "Identité Numérique du Gabon"
export const SITE_SHORT_NAME = "Identité Numérique"
export const SITE_LOCALE = "fr_GA"
export const SITE_DESCRIPTION =
  "Plateforme d'identité numérique souveraine de la République Gabonaise. Un compte unique pour accéder à tous les services de l'État."

export function absoluteUrl(path = "/"): string {
  if (!path.startsWith("/")) return path
  return `${SITE_URL}${path}`
}

interface PageMetadataInput {
  title: string
  description: string
  path: string
  /** Surcharge optionnelle de l'image OG (chemin relatif au site) */
  image?: string
}

/** OG image par défaut (généré par `app/opengraph-image.tsx`). */
export const DEFAULT_OG_IMAGE = "/opengraph-image"

/**
 * Construit un objet Metadata complet (canonical + OpenGraph + Twitter)
 * à partir des infos minimales d'une page publique. Inclut systématiquement
 * une image OG par défaut — surchargeable via `image`.
 *
 * Note : Next ne fusionne pas les sous-clés de `openGraph` entre layout et
 * page. Si une page override `openGraph`, l'image file-based du layout est
 * perdue. On la ré-inscrit donc à chaque appel.
 */
export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path)
  const ogImage = absoluteUrl(image)

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}
