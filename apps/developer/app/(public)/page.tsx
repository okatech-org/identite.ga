"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useConvexAuth } from "convex/react"
import { useEffect } from "react"

import { Button } from "@repo/ui/components/button"

import { fr } from "../_content/fr"

export default function WelcomePage() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/applications")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || isAuthenticated) {
    return <div className="min-h-svh bg-background" />
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-64px)] w-full max-w-[1180px] flex-col items-center justify-center px-6 py-16">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-idn-muted">
        {fr.welcome.eyebrow}
      </p>
      <h1 className="mt-4 max-w-[760px] text-center text-4xl font-semibold tracking-[-0.018em] text-idn-ink sm:text-5xl">
        {fr.welcome.title}
      </h1>
      <p className="mt-5 max-w-[620px] text-center text-base leading-relaxed text-idn-muted">
        {fr.welcome.subtitle}
      </p>
      <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Button asChild size="lg" className="h-12 px-6 text-base">
          <Link href="/sign-up">{fr.welcome.signUp}</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
          <Link href="/sign-in">{fr.welcome.signIn}</Link>
        </Button>
      </div>
    </main>
  )
}
