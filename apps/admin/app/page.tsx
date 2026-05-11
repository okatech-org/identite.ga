"use client"

import { useRouter } from "next/navigation"
import { useConvexAuth } from "convex/react"
import { useEffect } from "react"

export default function RootPage() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    router.replace(isAuthenticated ? "/dashboard" : "/sign-in")
  }, [isAuthenticated, isLoading, router])

  return <div className="min-h-svh bg-background" />
}
