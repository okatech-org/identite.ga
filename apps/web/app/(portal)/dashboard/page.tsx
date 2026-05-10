"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { LogOutIcon } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { Card } from "@repo/ui/components/card"
import { LoABadge, type LoALevel } from "@repo/ui/components/loa-badge"

import { authClient } from "@/lib/auth-client"

const PROFILE_LABELS: Record<string, string> = {
  citizen: "Citoyen Gabonais",
  resident: "Résident",
  visitor: "Visiteur Temporaire",
  developer: "Développeur",
}

export default function DashboardPage() {
  const me = useQuery(api.profile.getCurrentUser)

  const handleSignOut = async () => {
    await authClient.signOut()
    window.location.href = "/"
  }

  if (me === undefined) {
    return (
      <section className="mx-auto w-full max-w-[1180px] px-6 py-10 md:py-15">
        <div className="h-32 animate-pulse rounded-xl bg-secondary" />
      </section>
    )
  }

  if (me === null) {
    return null // redirected by layout
  }

  const profile = me.profile
  const greeting = profile?.pivot
    ? `Bonjour, ${profile.pivot.firstName}`
    : "Bienvenue"

  return (
    <section className="mx-auto w-full max-w-[1180px] px-6 py-10 md:py-15">
      <Card className="p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Mon compte IDN
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {greeting}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Votre compte IDN est actif. D&apos;autres fonctionnalités
              (consentements, KYC, paramètres) arrivent bientôt.
            </p>

            {profile && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <LoABadge level={profile.loa as LoALevel} />
                <span className="text-xs text-muted-foreground">
                  · {PROFILE_LABELS[profile.profileType] ?? profile.profileType}
                </span>
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOutIcon aria-hidden="true" />
            Se déconnecter
          </Button>
        </div>

        {profile?.pivot && (
          <div className="mt-7 grid grid-cols-1 gap-x-7 gap-y-3 border-t border-idn-border-soft pt-6 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Identité pivot
              </p>
              <p className="mt-1 font-medium text-foreground">
                {profile.pivot.firstName} {profile.pivot.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                Né·e le {profile.pivot.dateOfBirth} à {profile.pivot.birthPlace}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Email
              </p>
              <p className="mt-1 font-medium text-foreground">{me.email}</p>
              <p className="text-xs text-muted-foreground">
                {me.emailVerified ? "Vérifié" : "Non vérifié"}
              </p>
            </div>
          </div>
        )}
      </Card>
    </section>
  )
}
