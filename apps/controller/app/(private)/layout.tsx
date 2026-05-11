"use client"

import { useRouter } from "next/navigation"
import { useConvexAuth, useQuery } from "convex/react"
import { useEffect } from "react"

import { api } from "@repo/backend/convex/_generated/api"

import { OpShell } from "../_components/op-shell"

/**
 * Layout des pages internes du contrôleur (queue/scan/verify/history).
 *
 * Garde double :
 *   1. session active (sinon retour à `/`),
 *   2. rôle `identity_controller` — sinon redirige aussi sur `/`.
 */
export default function PrivateLayout({
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
      router.replace("/")
      return
    }
    if (me === undefined) return
    if (!me || !me.roles?.includes("identity_controller")) {
      router.replace("/")
    }
  }, [isAuthLoading, isAuthenticated, me, router])

  if (
    isAuthLoading ||
    !isAuthenticated ||
    me === undefined ||
    !me?.roles?.includes("identity_controller")
  ) {
    return <div className="min-h-svh bg-background" />
  }

  return <OpShell>{children}</OpShell>
}
