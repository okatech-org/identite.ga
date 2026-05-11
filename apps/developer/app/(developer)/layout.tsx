"use client"

import { useRouter } from "next/navigation"
import { useConvexAuth, useQuery } from "convex/react"
import { useEffect } from "react"

import { api } from "@repo/backend/convex/_generated/api"

import { DeveloperBootstrap } from "../_components/developer-bootstrap"
import { OpShell } from "../_components/op-shell"

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const router = useRouter()

  // listMine peut throw FORBIDDEN tant que le rôle developer n'est pas
  // attribué — DeveloperBootstrap le pose après sign-in. On utilise donc
  // profile.getCurrentUser (safe) pour décider de gate, et on récupère le
  // count d'apps en best-effort via une autre query si besoin.
  const me = useQuery(
    api.profile.getCurrentUser,
    isAuthenticated ? {} : "skip",
  )
  const apps = useQuery(
    api.developer.apps.listMine,
    isAuthenticated && me?.roles?.includes("developer") ? {} : "skip",
  )

  useEffect(() => {
    if (isAuthLoading) return
    if (!isAuthenticated) {
      router.replace("/sign-in")
    }
  }, [isAuthLoading, isAuthenticated, router])

  if (isAuthLoading || !isAuthenticated) {
    return <div className="min-h-svh bg-background" />
  }

  const appCount = Array.isArray(apps) ? apps.length : 0

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
      >
        Aller au contenu principal
      </a>
      <DeveloperBootstrap />
      <OpShell appCount={appCount}>{children}</OpShell>
    </>
  )
}
