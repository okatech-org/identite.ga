import { httpRouter } from "convex/server"

import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"
import { createAuth } from "./auth"
import { resend } from "./email/provider"

const http = httpRouter()

const AUTH_PATH = "/api/auth"

// Routes Better Auth — /api/auth/* (sign-in/sign-up/sign-out, OTP, OIDC,
// JWKS, userinfo, etc.). Enregistrement manuel (au lieu de
// `authComponent.registerRoutes`) pour passer le header Origin de la
// requête à `createAuth`. Le plugin crossDomain peut alors renvoyer les
// callbacks vers l'origin de l'app appelante (web / admin / developer /
// controller).
//
// Le plugin `oidcProvider` de better-auth/plugins expose automatiquement
// ses routes sous `/api/auth/oauth2/*` (authorize, token, callback) et
// le discovery sous `/api/auth/.well-known/openid-configuration`. Pas
// besoin de monter des handlers custom — tout est servi par
// `auth.handler(request)`.
const authRequestHandler = httpAction(async (ctx, request) => {
  const origin = request.headers.get("origin")
  const auth = createAuth(ctx, origin)
  return await auth.handler(request)
})

// Override du discovery OIDC : @convex-dev/better-auth instancie en interne
// sa propre oidcProvider (sans useJWTPlugin: true ni notre metadata custom),
// donc le JSON servi sous /api/auth/convex/.well-known/openid-configuration
// annonce HS256 alors qu'on signe en RS256 via le plugin jwt. On intercepte
// la route exacte (prioritaire sur le pathPrefix) et on appelle l'instance
// oidcProvider qu'on configure dans auth.ts.
// Claims étendus IDN exposés sous scope "profile" en plus des claims
// standards Better Auth. Maintenus en un seul endroit (utilisés à la fois
// par le handler /userinfo pour les valeurs et par le discovery pour la
// liste `claims_supported`).
const IDN_EXTENDED_CLAIMS = [
  "given_name",
  "family_name",
  "birthdate",
  "nationality",
  "profile_type",
  "acr",
  "loa",
  "nip",
] as const

const loaToAcr = (loa: number): string =>
  loa === 3 ? "eidas3" : loa === 2 ? "eidas2" : "eidas1"

// Override du discovery OIDC : @convex-dev/better-auth instancie en interne
// sa propre oidcProvider (sans useJWTPlugin: true ni notre metadata custom),
// donc le JSON servi sous /api/auth/convex/.well-known/openid-configuration
// annonce HS256 alors qu'on signe en RS256 via le plugin jwt. On intercepte
// la route exacte (prioritaire sur le pathPrefix) et on appelle l'instance
// oidcProvider qu'on configure dans auth.ts. On en profite pour étendre
// `claims_supported` avec les claims IDN qu'on injecte dans /userinfo.
const oidcDiscoveryHandler = httpAction(async (ctx, request) => {
  const origin = request.headers.get("origin")
  const auth = createAuth(ctx, origin)
  const api = auth.api as unknown as {
    getOpenIdConfig: (input: {
      asResponse: false
    }) => Promise<Record<string, unknown>>
  }
  const metadata = await api.getOpenIdConfig({ asResponse: false })
  const baseClaims = Array.isArray(metadata.claims_supported)
    ? (metadata.claims_supported as string[])
    : []
  const patched = {
    ...metadata,
    id_token_signing_alg_values_supported: ["RS256"],
    claims_supported: Array.from(
      new Set([...baseClaims, ...IDN_EXTENDED_CLAIMS]),
    ),
    acr_values_supported: ["eidas1", "eidas2", "eidas3"],
  }
  return new Response(JSON.stringify(patched), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
})

// Enrichissement de /oauth2/userinfo : Better Auth n'expose que les champs
// de la table user de son composant (sub, email, name, picture, email_verified
// + un given_name/family_name fait via `name.split(" ")`, souvent faux pour
// les noms composés). Le NIP et l'identité pivot IDN sont dans la table
// `userProfile` côté Convex. On délègue la validation du token à Better Auth
// (call de l'endpoint original) puis on lookup `userProfile` par sub et on
// merge les claims étendus.
const userinfoHandler = httpAction(async (ctx, request) => {
  const origin = request.headers.get("origin")
  const auth = createAuth(ctx, origin)
  const api = auth.api as unknown as {
    oAuth2userInfo: (input: {
      headers: Headers
      request: Request
      asResponse: true
    }) => Promise<Response>
  }

  // Better Auth gère la validation du Bearer token (401/403 si invalide ou
  // expiré). Le handler upstream check `ctx.request` (pas juste headers) —
  // il faut lui passer le Request object complet.
  let baseRes: Response
  try {
    baseRes = await api.oAuth2userInfo({
      headers: request.headers,
      request,
      asResponse: true,
    })
  } catch (err) {
    if (err instanceof Response) return err
    throw err
  }

  if (!baseRes.ok) return baseRes

  const baseClaims = (await baseRes.json()) as Record<string, unknown> & {
    sub?: string
  }
  const sub = typeof baseClaims.sub === "string" ? baseClaims.sub : null
  if (!sub) {
    return new Response(JSON.stringify(baseClaims), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  const profile = await ctx.runQuery(internal.profile.getForUserinfo, {
    userId: sub,
  })

  if (!profile) {
    return new Response(JSON.stringify(baseClaims), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  const pivot = profile.pivot
  const enriched: Record<string, unknown> = {
    ...baseClaims,
    profile_type: profile.profileType,
    loa: profile.loa,
    acr: loaToAcr(profile.loa),
    ...(pivot
      ? {
          given_name: pivot.firstName,
          family_name: pivot.lastName,
          birthdate: pivot.dateOfBirth,
          nationality: pivot.nationality,
          ...(pivot.nip ? { nip: pivot.nip } : {}),
        }
      : {}),
  }

  return new Response(JSON.stringify(enriched), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
})

http.route({
  path: `${AUTH_PATH}/convex/.well-known/openid-configuration`,
  method: "GET",
  handler: oidcDiscoveryHandler,
})

http.route({
  path: `${AUTH_PATH}/oauth2/userinfo`,
  method: "GET",
  handler: userinfoHandler,
})

http.route({ pathPrefix: `${AUTH_PATH}/`, method: "GET", handler: authRequestHandler })
http.route({ pathPrefix: `${AUTH_PATH}/`, method: "POST", handler: authRequestHandler })

// Webhook Resend — Resend POST ici les événements (sent / delivered / bounce
// / complaint / opened / clicked) avec une signature HMAC. Le composant
// vérifie la signature et met à jour le statut des emails en BD.
//
// URL à déclarer côté Resend :
//   <NEXT_PUBLIC_CONVEX_SITE_URL>/resend-webhook
//   (en dev local : https://pleasant-platypus-379.eu-west-1.convex.site/resend-webhook)
http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req)
  }),
})

export default http
