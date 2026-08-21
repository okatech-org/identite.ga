"use client"

import { useEffect, useState } from "react"

import { authClient } from "@/lib/auth-client"

/**
 * Reprise de session générique pour une application partenaire.
 *
 * POURQUOI CETTE PAGE. Une app tierce (consulat.ga) exécute le parcours
 * d'inscription IDN depuis SON origine : la session qu'elle obtient est un
 * jeton bearer, pas un cookie sur identite.ga. Or `/oauth2/authorize` ne
 * regarde que le cookie. Sans cette page, le citoyen qui vient de choisir son
 * PIN se le voit redemander trois secondes plus tard sur l'écran de connexion.
 *
 * Elle échange donc un jeton à usage unique (plugin `oneTimeToken`) contre une
 * vraie session locale, puis poursuit vers l'autorisation OIDC.
 *
 * Distincte de `/session-handoff`, qui fait la même chose mais se termine
 * toujours dans le parcours KYC (`buildKycPath`).
 *
 * SÉCURITÉ. `return_to` est une redirection pilotée par l'appelant : il est
 * validé comme étant une URL `/api/auth/oauth2/authorize` du host IDN. Sans ce
 * contrôle, la page devient une redirection ouverte signée par identite.ga.
 * Les paramètres OAuth de l'app (client_id, redirect_uri, PKCE…) sont recopiés
 * depuis la query, jamais interprétés.
 */

function isAllowedAuthorizeUrl(raw: string): boolean {
  const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL
  if (!siteUrl) return false
  try {
    const target = new URL(raw)
    const allowed = new URL(siteUrl)
    return (
      target.origin === allowed.origin &&
      target.pathname === "/api/auth/oauth2/authorize"
    )
  } catch {
    return false
  }
}

export default function AuthContinuePage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    const returnTo = params.get("return_to")

    // Le jeton ne doit rester ni dans l'historique ni dans un referrer.
    window.history.replaceState({}, "", "/auth-continue")

    if (!token || !returnTo || !isAllowedAuthorizeUrl(returnTo)) {
      setError("Le lien de connexion est invalide ou a expiré.")
      return
    }

    let cancelled = false
    const resume = async () => {
      try {
        const result = await authClient.oneTimeToken.verify({ token })
        const session = result?.data?.session as { token?: string } | undefined
        if (!session?.token) throw new Error("invalid handoff")

        // Matérialise la session en cookie sur ce domaine : c'est la seule
        // chose que `/oauth2/authorize` sait lire.
        await authClient.getSession({
          fetchOptions: {
            headers: { Authorization: `Bearer ${session.token}` },
          },
        })
        authClient.updateSession()

        if (!cancelled) window.location.replace(returnTo)
      } catch {
        if (!cancelled) {
          setError(
            "La connexion automatique a échoué. Revenez à l'application et connectez-vous.",
          )
        }
      }
    }

    void resume()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      {error ? (
        <p role="alert" className="max-w-sm text-center text-sm text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Connexion en cours…</p>
      )}
    </main>
  )
}
