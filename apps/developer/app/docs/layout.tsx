import type { Metadata } from "next"
import type { ReactNode } from "react"

import {
  absoluteUrl,
  DEFAULT_DOCS_OG_IMAGE,
  DOCS_DESCRIPTION,
  DOCS_NAME,
  SITE_LOCALE,
} from "../../lib/seo"
import { DocsTopbar } from "./_components/topbar"

export const metadata: Metadata = {
  title: {
    default: DOCS_NAME,
    template: `%s · ${DOCS_NAME}`,
  },
  description: DOCS_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/docs"),
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/docs"),
    siteName: DOCS_NAME,
    title: DOCS_NAME,
    description: DOCS_DESCRIPTION,
    locale: SITE_LOCALE,
    images: [
      {
        url: DEFAULT_DOCS_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: DOCS_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DOCS_NAME,
    description: DOCS_DESCRIPTION,
    images: [DEFAULT_DOCS_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-idn-bg">
      <a
        href="#docs-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Aller au contenu principal
      </a>
      <DocsTopbar />
      <div id="docs-main" className="flex flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}
