"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useConvexAuth, useQuery } from "convex/react"
import { Suspense, useEffect, useMemo } from "react"

import { api } from "@repo/backend/convex/_generated/api"

import { ConsentForm } from "./_components/consent-form"

const PARAM_KEYS = [
  "client_id",
  "redirect_uri",
  "scope",
  "state",
  "nonce",
  "response_type",
  "code_challenge",
  "code_challenge_method",
  "acr_values",
  // consent_code est ajouté par oidcProvider quand il redirige vers cette
  // page — on le forward au POST /oauth2/consent qui suit.
  "consent_code",
] as const

/**
 * Écran de consentement OAuth/OIDC — port maquette idn-desktop.jsx:100-309.
 *
 * Affiché aux citoyens qui se connectent à une app tierce via IDN.
 * Liste les claims qui seront partagés + boutons Refuser / Autoriser.
 *
 * Vit sur connect.identite.ga — point d'authentification fédéré isolé
 * du site principal identite.ga.
 */
export default function OAuthAuthorizePage() {
  return (
    <Suspense fallback={null}>
      <OAuthAuthorizePageInner />
    </Suspense>
  )
}

function OAuthAuthorizePageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()

  const clientId = searchParams.get("client_id") ?? ""
  const redirectUri = searchParams.get("redirect_uri") ?? ""
  const requestedScope = searchParams.get("scope") ?? ""
  const acrValues = searchParams.get("acr_values") ?? ""
  // `consent_code` est posé par oidcProvider quand il redirige ici depuis
  // /oauth2/authorize. Il sert de clé pour le POST /oauth2/consent qui suit.
  // Sa présence indique aussi qu'on est dans un flow consent légitime, même
  // sans redirect_uri en query (l'oidcProvider garde l'URI côté serveur dans
  // le cookie oidc_consent_prompt).
  const consentCode = searchParams.get("consent_code") ?? ""

  const oauthParams = useMemo(() => {
    const out: Record<string, string> = {}
    for (const key of PARAM_KEYS) {
      const v = searchParams.get(key)
      if (v !== null) out[key] = v
    }
    return out
  }, [searchParams])

  const continueUrl = useMemo(() => {
    const qs = new URLSearchParams(oauthParams).toString()
    return `/oauth/authorize?${qs}`
  }, [oauthParams])

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(`/sign-in?redirect_to=${encodeURIComponent(continueUrl)}`)
    }
  }, [isAuthLoading, isAuthenticated, continueUrl, router])

  const me = useQuery(
    api.profile.getCurrentUser,
    isAuthenticated ? {} : "skip",
  )
  const app = useQuery(
    api.oauthAuthorize.getAppForConsent,
    isAuthenticated && clientId ? { clientId } : "skip",
  )

  // Deux entrées légitimes côté browser :
  //   A. Flow initial direct : client_id + redirect_uri en query (cas tests
  //      manuels, ou apps qui ne passent pas par /oauth2/authorize d'abord).
  //   B. Redirect depuis oidcProvider : client_id + consent_code en query
  //      (le redirect_uri est récupéré côté serveur via cookie).
  // On rejette uniquement quand client_id manque ET qu'on n'a ni redirect_uri
  // ni consent_code à présenter.
  if (!clientId || (!redirectUri && !consentCode)) {
    return (
      <ErrorScreen
        title="Requête OAuth invalide"
        description="Le paramètre client_id, redirect_uri ou consent_code est manquant."
      />
    )
  }

  if (isAuthLoading || !isAuthenticated || me === undefined || app === undefined) {
    return <main className="min-h-svh bg-idn-bg" />
  }

  if (!app) {
    return (
      <ErrorScreen
        title="Application inconnue"
        description={`Aucune application enregistrée avec le client_id « ${clientId} ».`}
      />
    )
  }

  // Quand on vient d'oidcProvider via consent_code, redirect_uri n'est pas
  // en query (oidcProvider l'a validé côté serveur). On ne vérifie donc que
  // si l'URI est explicitement fournie.
  if (redirectUri && app.redirectUris.length > 0 && !app.redirectUris.includes(redirectUri)) {
    return (
      <ErrorScreen
        title="Redirect URI non autorisée"
        description="L'URI de retour ne correspond pas à celles enregistrées par cette application."
      />
    )
  }

  // En sandbox, seuls les comptes IDN ajoutés à la whitelist par le dev
  // peuvent consentir. On bloque ici visuellement ; un filet défensif
  // additionnel existe côté hook claims OIDC (cf. backend auth.ts).
  if (app.env === "sandbox" && !app.userAllowed) {
    return (
      <ErrorScreen
        title="Accès sandbox refusé"
        description="Cette application est en mode test. Demandez au développeur d'ajouter votre adresse à la liste des comptes de test autorisés."
      />
    )
  }

  const requestedScopes = (requestedScope || app.requestedScopes.join(" "))
    .split(/\s+/)
    .filter(Boolean)

  return (
    <ConsentForm
      app={app}
      user={{
        fullName: (me as { name?: string } | null)?.name ?? "Utilisateur",
        email: (me as { email?: string } | null)?.email ?? "",
        loa: ((me as { loa?: 1 | 2 | 3 } | null)?.loa ?? 1) as 1 | 2 | 3,
      }}
      requestedScopes={requestedScopes}
      acrValues={acrValues}
      oauthParams={oauthParams}
    />
  )
}

function ErrorScreen({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-idn-bg p-10">
      <div className="w-[480px] rounded-2xl border border-idn-border bg-idn-surface p-9 text-center">
        <h1 className="text-[20px] font-semibold tracking-[-0.014em] text-idn-ink">
          {title}
        </h1>
        <p className="mt-3 text-sm text-idn-muted">{description}</p>
      </div>
    </main>
  )
}
