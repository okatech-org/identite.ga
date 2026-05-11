import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@better-auth/oauth-provider"
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
const authRequestHandler = httpAction(async (ctx, request) => {
  const origin = request.headers.get("origin")
  const auth = createAuth(ctx, origin)
  return await auth.handler(request)
})

http.route({ pathPrefix: `${AUTH_PATH}/`, method: "GET", handler: authRequestHandler })
http.route({ pathPrefix: `${AUTH_PATH}/`, method: "POST", handler: authRequestHandler })

// Métadonnées OAuth Authorization Server (RFC 8414) et OpenID Connect
// Discovery (OpenID Connect Discovery 1.0).
//
// Le plugin @better-auth/oauth-provider expose ces handlers exportables ;
// sans ces routes, on a un warning à chaque requête /api/auth/* :
//   "[Better Auth]: Please ensure '/.well-known/oauth-authorization-server/api/auth' exists"
//
// Convention RFC 8414 §3.1 : pour un issuer dont le basePath n'est pas
// la racine, le metadata se trouve à `/.well-known/oauth-authorization-server{basePath}`
// (et idem pour openid-configuration). Notre basePath est `/api/auth`.
// `betterAuth/minimal` ne typage pas les méthodes ajoutées dynamiquement
// par les plugins (getOAuthServerConfig / getOpenIdConfig viennent du plugin
// oauthProvider). On caste pour les helpers metadata qui les requièrent.
type AuthWithOAuthApi = {
  api: {
    getOAuthServerConfig: (...args: unknown[]) => unknown
    getOpenIdConfig: (...args: unknown[]) => unknown
  }
}

http.route({
  path: "/.well-known/oauth-authorization-server/api/auth",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const auth = createAuth(ctx, req.headers.get("origin")) as unknown as AuthWithOAuthApi
    return await oauthProviderAuthServerMetadata(auth)(req)
  }),
})

http.route({
  path: "/.well-known/openid-configuration/api/auth",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const auth = createAuth(ctx, req.headers.get("origin")) as unknown as AuthWithOAuthApi
    return await oauthProviderOpenIdConfigMetadata(auth)(req)
  }),
})

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
