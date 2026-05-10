import { httpRouter } from "convex/server"

import { httpAction } from "./_generated/server"
import { authComponent, createAuth } from "./auth"
import { resend } from "./email/provider"

const http = httpRouter()

// Routes Better Auth — /api/auth/* (sign-in/sign-up/sign-out, OTP, OIDC,
// JWKS, userinfo, etc.). Le composant les enregistre toutes en une fois.
authComponent.registerRoutes(http, createAuth)

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
