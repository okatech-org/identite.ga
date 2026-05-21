"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { IdentityStep } from "../_components/sign-up/identity-step"
import { IdnStep } from "../_components/sign-up/idn-step"
import { PinStep } from "../_components/sign-up/pin-step"
import { ProfileStep } from "../_components/sign-up/profile-step"

const STEPS = ["profile", "identity", "idn", "pin"] as const
type Step = (typeof STEPS)[number]

function isStep(v: string | null): v is Step {
  return v !== null && (STEPS as readonly string[]).includes(v)
}

/**
 * Tunnel d'inscription en une seule route. L'étape est portée par le
 * search param `?step=profile|identity|idn|pin` plutôt que par des
 * sous-segments d'URL — c'est un wizard linéaire, pas une arborescence.
 *
 * Si `step` est absent ou invalide, on normalise vers `?step=profile`
 * pour que l'URL reste partageable et le bouton retour navigateur cohérent.
 */
export default function SignUpPage() {
  return (
    <React.Suspense fallback={null}>
      <SignUpDispatcher />
    </React.Suspense>
  )
}

function SignUpDispatcher() {
  const router = useRouter()
  const params = useSearchParams()
  const raw = params.get("step")

  React.useEffect(() => {
    if (!isStep(raw)) {
      router.replace("/sign-up?step=profile")
    }
  }, [raw, router])

  if (!isStep(raw)) return null

  switch (raw) {
    case "profile":
      return <ProfileStep />
    case "identity":
      return <IdentityStep />
    case "idn":
      return <IdnStep />
    case "pin":
      return <PinStep />
  }
}
