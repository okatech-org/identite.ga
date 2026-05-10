"use client"

import { type ReactNode } from "react"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ThemeProvider } from "next-themes"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL for the web Convex client")
}

const convex = new ConvexReactClient(convexUrl)

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    </ThemeProvider>
  )
}
