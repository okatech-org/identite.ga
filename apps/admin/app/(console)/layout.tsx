"use client"

import { useRouter } from "next/navigation"
import { useConvexAuth, useQuery } from "convex/react"
import { useEffect } from "react"

import { api } from "@repo/backend/convex/_generated/api"

import { OpShell } from "../_components/op-shell"

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const router = useRouter()

  const me = useQuery(
    api.profile.getCurrentUser,
    isAuthenticated ? {} : "skip",
  )

  useEffect(() => {
    if (isAuthLoading) return
    if (!isAuthenticated) {
      router.replace("/sign-in")
      return
    }
    if (me === undefined) return
    if (!me || !me.roles?.includes("admin")) {
      router.replace("/sign-in?error=forbidden")
    }
  }, [isAuthLoading, isAuthenticated, me, router])

  if (isAuthLoading || !isAuthenticated || me === undefined) {
    return <div className="min-h-svh bg-background" />
  }
  if (!me || !me.roles?.includes("admin")) {
    return <div className="min-h-svh bg-background" />
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Aller au contenu principal
      </a>
      <OpShell>{children}</OpShell>
    </>
  )
}
