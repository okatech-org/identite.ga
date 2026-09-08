"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useConvexAuth, useQuery } from "convex/react"
import { Suspense, useEffect, useMemo } from "react"

import { api } from "@repo/backend/convex/_generated/api"

import { buildKycPath } from "@/lib/kyc-flow"
import { getCurrentUserLoa } from "@/lib/oauth-flow"

import { ConsentForm } from "./_components/consent-form"

const acrToLoa = (acr: string): number =>
  acr === "eidas3" ? 3 : acr === "eidas2" ? 2 : 1

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
 * Vit sur identite.ga, le domaine qui porte le cookie de session : c'est ce qui
 * permet à /oauth2/authorize de reconnaître un usager déjà connecté sans lui
 * réafficher d'écran de connexion.
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
  // Statut d'une éventuelle vérification en cours — sert à ne PAS reboucler en
  // step-up quand l'utilisateur a déjà soumis ses documents (revue manuelle).
  const latestKyc = useQuery(
    api.kyc.getMyLatest,
    isAuthenticated ? {} : "skip",
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

  if (
    isAuthLoading ||
    !isAuthenticated ||
    me === undefined ||
    app === undefined ||
    latestKyc === undefined
  ) {
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

  const userLoa = getCurrentUserLoa(me)

  // Niveau exigé = max entre le minimum statique de l'app et le `acr_values`
  // demandé sur cette requête. Si l'utilisateur ne l'atteint pas, on ne bloque
  // pas : on lui propose de vérifier son identité (step-up) puis de revenir
  // poursuivre la connexion (return_to vers cette même page authorize).
  const requestedLoa = acrValues
    .split(/\s+/)
    .filter(Boolean)
    .reduce((max, acr) => Math.max(max, acrToLoa(acr)), 0)
  const requiredLoa = Math.max(app.requiredLoA, requestedLoa)

  // Une vérification déjà soumise (en cours de revue ou complément demandé) :
  // l'utilisateur a fait sa part. On ne le renvoie PAS en step-up (sinon boucle
  // infinie loa=1 → step-up → soumission → loa=1…). On laisse le consentement
  // se faire ; le token portera loa=1 et l'app suivra l'avancement via
  // l'endpoint /oauth2/verification (polling).
  const verificationPending =
    latestKyc !== null &&
    ["submitted", "under_review", "complement_required"].includes(
      latestKyc.status,
    )

  if (userLoa < requiredLoa && !verificationPending) {
    const absoluteContinue = `${window.location.origin}${continueUrl}`
    return (
      <StepUpScreen
        appName={app.name}
        requiredLoa={requiredLoa}
        continueUrl={absoluteContinue}
      />
    )
  }

  return (
    <ConsentForm
      app={app}
      user={{
        fullName: (me as { name?: string } | null)?.name ?? "Utilisateur",
        email: (me as { email?: string } | null)?.email ?? "",
        loa: userLoa,
      }}
      requestedScopes={requestedScopes}
      acrValues={acrValues}
      oauthParams={oauthParams}
    />
  )
}

/**
 * Le KYC vit sur la même origine que cette page : une navigation interne suffit
 * pour y envoyer l'usager et le récupérer ensuite. Le transfert de session par
 * jeton à usage unique qu'exigeait connect.identite.ga n'a plus lieu d'être.
 */
function StepUpScreen({
  appName,
  requiredLoa,
  continueUrl,
}: {
  appName: string
  requiredLoa: number
  continueUrl: string
}) {
  const router = useRouter()

  return (
    <main className="flex min-h-svh items-center justify-center bg-idn-bg p-10">
      <div className="w-[480px] rounded-2xl border border-idn-border bg-idn-surface p-9 text-center">
        <h1 className="text-[20px] font-semibold tracking-[-0.014em] text-idn-ink">
          Vérification d&apos;identité requise
        </h1>
        <p className="mt-3 text-sm text-idn-muted">
          <span className="font-medium text-idn-ink">{appName}</span> requiert un
          niveau de garantie {requiredLoa}. Vérifiez votre identité pour
          continuer, puis revenez à la connexion.
        </p>
        <button
          type="button"
          onClick={() =>
            router.push(
              buildKycPath({
                returnTo: continueUrl,
                targetLoa: requiredLoa === 3 ? 3 : 2,
              }),
            )
          }
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-idn-green px-6 text-sm font-medium text-white hover:opacity-90"
        >
          Vérifier mon identité
        </button>
      </div>
    </main>
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
