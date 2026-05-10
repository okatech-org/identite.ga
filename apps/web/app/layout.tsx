import type { Metadata } from "next"
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google"

import { Toaster } from "@repo/ui/components/sonner"

import "./globals.css"
import { Providers } from "./providers"

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
})

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Identité Numérique du Gabon",
    template: "%s · Identité Numérique du Gabon",
  },
  description:
    "Plateforme d'identité numérique souveraine de la République Gabonaise. Un compte unique pour accéder à tous les services de l'État.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
