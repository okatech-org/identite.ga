import { httpRouter } from "convex/server"

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
const oidcDiscoveryHandler = httpAction(async (ctx, request) => {
  const origin = request.headers.get("origin")
  const auth = createAuth(ctx, origin)
  // `@convex-dev/better-auth` instancie en interne sa propre oidcProvider
  // (sans useJWTPlugin: true) qui sert ce path et annonce HS256 — alors
  // qu'on signe RS256 via le plugin jwt. On récupère le JSON, on patch
  // les claims qui dépendent de l'algorithme réel, on re-sert.
  const api = auth.api as unknown as {
    getOpenIdConfig: (input: {
      asResponse: false
    }) => Promise<Record<string, unknown>>
  }
  const metadata = await api.getOpenIdConfig({ asResponse: false })
  const patched = {
    ...metadata,
    id_token_signing_alg_values_supported: ["RS256"],
  }
  return new Response(JSON.stringify(patched), {
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
