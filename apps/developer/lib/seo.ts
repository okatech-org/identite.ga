import type { Metadata } from "next"

/**
 * URL canonique du portail développeur. Surchargeable par
 * `NEXT_PUBLIC_SITE_URL` pour les environnements de preview / staging.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://developer.identite.ga"
).replace(/\/$/, "")

export const PUBLIC_SITE_URL = "https://identite.ga"

export const SITE_NAME = "Portail développeur · Identité Numérique"
export const DOCS_NAME = "Documentation Identité Numérique"
export const SITE_LOCALE = "fr_GA"

export const SITE_DESCRIPTION =
  "Enregistrez vos applications, gérez vos clés OAuth et consultez votre usage de l'API Identité Numérique du Gabon."

export const DOCS_DESCRIPTION =
  "Documentation du SDK Identité Numérique du Gabon : « Se connecter avec Identité Numérique » en moins de 10 lignes. OIDC standard, PKCE obligatoire, zéro vendor lock-in."

export function absoluteUrl(path = "/"): string {
  if (!path.startsWith("/")) return path
  return `${SITE_URL}${path}`
}

interface DocsMetadataInput {
  title: string
  description?: string
  path: string
  image?: string
}

/** OG image par défaut servie par `app/docs/opengraph-image.tsx`. */
export const DEFAULT_DOCS_OG_IMAGE = "/docs/opengraph-image"

/**
 * Métadonnées pour une page de documentation (indexable).
 * Construit canonical + OpenGraph + Twitter à partir du titre/description.
 * L'image OG par défaut est ré-inscrite à chaque appel (Next n'hérite pas
 * les sous-clés de `openGraph` du layout quand la page la surcharge).
 */
export function docsMetadata({
  title,
  description,
  path,
  image = DEFAULT_DOCS_OG_IMAGE,
}: DocsMetadataInput): Metadata {
  const url = absoluteUrl(path)
  const ogImage = absoluteUrl(image)
  const desc = description ?? DOCS_DESCRIPTION

  return {
    title,
    description: desc,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title,
      description: desc,
      siteName: DOCS_NAME,
      locale: SITE_LOCALE,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  }
}
