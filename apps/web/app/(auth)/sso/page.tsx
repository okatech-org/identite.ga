"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import {
  buildConnectSessionHandoffUrl,
  getAllowedConnectUrl,
  resolveConnectOrigin,
} from "@/lib/sso"

const CONFIGURED_CONNECT_ORIGIN = process.env.NEXT_PUBLIC_IDN_CONNECT_URL

export default function SsoPage() {
  return (
    <Suspense fallback={<SsoStatus />}>
      <SsoPageInner />
    </Suspense>
  )
}

function SsoPageInner() {
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const connectOrigin = resolveConnectOrigin(
      CONFIGURED_CONNECT_ORIGIN,
      window.location.origin,
    )
    const returnTo = getAllowedConnectUrl(
      params.get("return_to"),
      connectOrigin,
      "return",
    )
    const fallbackTo = getAllowedConnectUrl(
      params.get("fallback_to"),
      connectOrigin,
      "fallback",
    )

    if (!returnTo || !fallbackTo) {
      setError("La demande de connexion est invalide.")
      return
    }

    let cancelled = false
    const transferExistingSession = async () => {
      try {
        const result = await authClient.oneTimeToken.generate()
        const token = result?.data?.token as string | undefined
        if (!token) throw new Error("no portal session")

        if (!cancelled) {
          window.location.replace(
            buildConnectSessionHandoffUrl({
              connectOrigin,
              returnTo: returnTo.toString(),
              token,
            }),
          )
        }
      } catch {
        // L'absence de session n'est pas une erreur utilisateur : connect.ga
        // affiche simplement son formulaire après cet unique contrôle.
        if (!cancelled) window.location.replace(fallbackTo.toString())
      }
    }

    void transferExistingSession()
    return () => {
      cancelled = true
    }
  }, [params])

  return <SsoStatus error={error} />
}

function SsoStatus({ error }: { error?: string | null }) {
  return (
    <section className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Connexion à votre identité
        </h1>
        <p
          className="mt-2 text-sm text-muted-foreground"
          role={error ? "alert" : undefined}
        >
          {error ?? "Vérification de votre session en cours…"}
        </p>
      </div>
    </section>
  )
}
