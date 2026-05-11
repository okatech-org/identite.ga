import type { Metadata } from "next"
import type { ReactNode } from "react"

import { DocsTopbar } from "./_components/topbar"

export const metadata: Metadata = {
  title: {
    default: "Documentation IDN",
    template: "%s · Documentation IDN",
  },
  description:
    "Documentation du SDK Identité Numérique du Gabon : « Se connecter avec IDN » en moins de 10 lignes. OIDC standard, PKCE obligatoire, zéro vendor lock-in.",
  robots: { index: true, follow: true },
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
