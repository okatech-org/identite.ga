"use client"

import { useConvexAuth, useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

import { DashboardPage } from "./_components/dashboard-page"
import { OpShell } from "./_components/op-shell"
import { SignInForm } from "./_components/sign-in-form"

/**
 * Page d'entrée de controleur.identite.ga.
 *
 * - Non authentifié                → formulaire de connexion.
 * - Authentifié sans rôle contrôleur → formulaire + notice.
 * - Authentifié + identity_controller → tableau de bord, dans `OpShell`.
 */
export default function ControllerHomePage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const me = useQuery(
    api.profile.getCurrentUser,
    isAuthenticated ? {} : "skip",
  )

  if (isAuthLoading) {
    return <div className="min-h-svh bg-background" />
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <SignInForm />
      </div>
    )
  }

  if (me === undefined) {
    return <div className="min-h-svh bg-background" />
  }

  if (!me || !me.roles?.includes("identity_controller")) {
    return (
      <div className="flex min-h-svh flex-col bg-background">
        <SignInForm
          notice="Votre compte n'a pas accès à l'espace contrôleur."
        />
      </div>
    )
  }

  return (
    <OpShell>
      <DashboardPage />
    </OpShell>
  )
}
