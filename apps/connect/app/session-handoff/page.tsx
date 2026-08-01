"use client"

import { useEffect, useState } from "react"

import { authClient } from "@/lib/auth-client"
import { syncCrossDomainCookiesForProxy } from "@/lib/auth-cookie"

const ALLOWED_RETURN_PATHS = new Set([
  "/api/auth/oauth2/authorize",
  "/oauth/authorize",
])

function getAllowedReturnTo(raw: string | null): URL | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.origin !== window.location.origin) return null
    return ALLOWED_RETURN_PATHS.has(url.pathname) ? url : null
  } catch {
    return null
  }
}

/** Importe sur connect.identite.ga la session déjà ouverte sur identite.ga. */
export default function SessionHandoffPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("handoff_token")
    const returnTo = getAllowedReturnTo(params.get("return_to"))

    // Le jeton à usage unique ne doit rester ni dans l'historique ni dans un
    // éventuel referrer après sa consommation.
    window.history.replaceState({}, "", "/session-handoff")

    if (!token || !returnTo) {
      setError("Le transfert de session est invalide ou incomplet.")
      return
    }

    let cancelled = false
    const transfer = async () => {
      try {
        // Le jeton est émis par le plugin Better Auth oneTimeToken(), dont
        // la route est /one-time-token/verify. Le namespace crossDomain
        // pointerait vers /cross-domain/one-time-token/verify, absent du
        // déploiement actuel.
        const result = await authClient.oneTimeToken.verify({ token })
        const session = result?.data?.session as { token?: string } | undefined
        if (!session?.token) throw new Error("invalid handoff")

        await authClient.getSession({
          fetchOptions: {
            headers: { Authorization: `Bearer ${session.token}` },
          },
        })
        authClient.updateSession()
        syncCrossDomainCookiesForProxy(authClient)

        if (!cancelled) window.location.replace(returnTo.toString())
      } catch {
        if (!cancelled) {
          setError(
            "Votre session n’a pas pu être reprise. Revenez à l’application et réessayez.",
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
    <main className="flex min-h-svh items-center justify-center bg-idn-bg p-6">
      <div className="w-full max-w-md rounded-2xl border border-idn-border bg-idn-surface p-7 text-center">
        <h1 className="text-xl font-semibold text-idn-ink">
          Connexion sécurisée
        </h1>
        <p
          className="mt-2 text-sm text-idn-muted"
          role={error ? "alert" : undefined}
        >
          {error ?? "Reprise de votre session Identité Numérique…"}
        </p>
      </div>
    </main>
  )
}
