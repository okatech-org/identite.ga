"use client"

import { useEffect, useState } from "react"

import { authClient } from "@/lib/auth-client"
import {
  buildKycPath,
  isAllowedReturnTo,
  type KycTargetLoa,
} from "@/lib/kyc-flow"

/**
 * Consomme un jeton de session à usage unique émis par connect.identite.ga,
 * remplace la session locale du portail puis ouvre le KYC avec le même
 * utilisateur. Cela évite qu'une ancienne session identite.ga (déjà L2, par
 * exemple) boucle avec une session connect.identite.ga encore L1.
 */
export default function SessionHandoffPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("handoff_token")
    const returnTo = params.get("return_to")
    const targetLoa: KycTargetLoa = params.get("target") === "3" ? 3 : 2

    // Le jeton ne doit pas rester dans l'historique ni fuiter via un referrer.
    window.history.replaceState({}, "", "/session-handoff")

    if (!token || !returnTo || !isAllowedReturnTo(returnTo)) {
      setError("Le lien de transfert de session est invalide ou incomplet.")
      return
    }

    let cancelled = false
    const transfer = async () => {
      try {
        const result = await authClient.oneTimeToken.verify({ token })
        const session = result?.data?.session as { token?: string } | undefined
        if (!session?.token) throw new Error("invalid handoff")

        await authClient.getSession({
          fetchOptions: {
            headers: { Authorization: `Bearer ${session.token}` },
          },
        })
        authClient.updateSession()

        if (!cancelled) {
          window.location.replace(buildKycPath({ returnTo, targetLoa }))
        }
      } catch {
        if (!cancelled) {
          setError(
            "Le transfert de session a expiré. Revenez à l’application et réessayez.",
          )
        }
      }
    }

    void transfer()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Synchronisation de votre identité
        </h1>
        <p
          className="mt-2 text-sm text-muted-foreground"
          role={error ? "alert" : undefined}
        >
          {error ?? "Ouverture sécurisée de la vérification en cours…"}
        </p>
      </div>
    </section>
  )
}
