"use client"

import { useRouter } from "next/navigation"
import { useConvexAuth } from "convex/react"
import { useEffect } from "react"

import { CitizenHeader } from "./_components/citizen-header"
import { CitizenMobileHeader } from "./_components/citizen-mobile-header"

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/sign-in?redirect_to=/dashboard")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-svh bg-background" />
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Aller au contenu principal
      </a>
      <CitizenMobileHeader className="md:hidden" />
      <CitizenHeader className="hidden md:flex" />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  )
}
