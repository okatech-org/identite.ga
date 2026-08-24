import { APIError, createAuthEndpoint } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { z } from "zod"

import {
  requiresTwoFactorChallenge,
  TWO_FACTOR_COOKIE_NAME,
  TWO_FACTOR_VERIFICATION_MAX_AGE_SECONDS,
} from "./twoFactorGate"

/**
 * Plugin Better Auth — sign-in par PIN à 6 chiffres.
 *
 * Endpoint POST /api/auth/sign-in/pin
 *   body : { email, pin }
 *   200  : { token, user } (idem signInEmail) — ou `{ twoFactorRedirect: true }`
 *          si le compte a `twoFactorEnabled` (cf. plus bas)
 *   401  : INVALID_PIN  (email inconnu ou PIN incorrect)
 *   403  : PIN_SETUP_REQUIRED (profil historique sans PIN)
 *
 * Un email inconnu et un PIN incorrect gardent la même erreur et un coût CPU
 * comparable. Le cas sans PIN est volontairement distingué : l'interface doit
 * conduire le titulaire vers la vérification SMS au lieu de lui faire répéter
 * un code qui n'existe pas.
 *
 * `verifyPinForUserId(userId, pin)` est injecté par `auth.ts` — c'est la
 * fonction qui charge `userProfile.pinHash` depuis Convex, dérive le hash
 * candidat (PBKDF2-SHA256, 600k it. — §6.1) et compare.
 *
 * 2FA (ADR sécurité) : le plugin `twoFactor` de better-auth pose un hook
 * `after` qui n'intercepte QUE `/sign-in/email|username|phone-number` — pas
 * cet endpoint custom. Un compte `twoFactorEnabled` qui se connecte par PIN
 * ne doit donc PAS obtenir de session tant que le TOTP/backup-code n'est pas
 * vérifié : on pose ici le même état de vérification 2FA en attente que le
 * plugin `twoFactor` (cf. lib/twoFactorGate.ts) et on renvoie
 * `{ twoFactorRedirect: true }` au lieu de créer la session. Le client
 * finalise ensuite via `authClient.twoFactor.verifyTotp` /
 * `verifyBackupCode`, qui créeront la vraie session à partir de cet état.
 *
 * Une fois le PIN validé (et si pas de 2FA) :
 * `internalAdapter.createSession(userId)` + `setSessionCookie`.
 * Le plugin crossDomain (déjà enregistré) rewrite le `Set-Cookie` en
 * `Set-Better-Auth-Cookie` pour que le client web le stocke en localStorage.
 * Le plugin convex pose le `convex_jwt` (matcher `/sign-in/*`).
 */

const PIN_REGEX = /^\d{6}$/

const bodySchema = z.object({
  email: z.string().email(),
  pin: z.string().regex(PIN_REGEX),
})

export type PinVerificationResult = "valid" | "invalid" | "setup_required"

export type VerifyPinForUserId = (
  userId: string,
  pin: string,
) => Promise<PinVerificationResult>

export const pinSignIn = (verifyPinForUserId: VerifyPinForUserId) => {
  return {
    id: "pin-sign-in",
    endpoints: {
      signInPin: createAuthEndpoint(
        "/sign-in/pin",
        {
          method: "POST",
          body: bodySchema,
          metadata: {
            openapi: {
              operationId: "signInWithPin",
              description: "Sign in with email and 6-digit PIN",
            },
          },
        },
        async (ctx) => {
          const email = ctx.body.email.toLowerCase().trim()
          const pin = ctx.body.pin

          const unauthorized = () => {
            throw new APIError("UNAUTHORIZED", {
              code: "INVALID_PIN",
              message: "Email ou PIN incorrect.",
            })
          }

          const user = await ctx.context.internalAdapter.findUserByEmail(email)
          if (!user) {
            // Anti-énumération : on fait un travail comparable côté CPU
            // avant de répondre, pour ne pas donner d'indice de timing.
            await verifyPinForUserId("__unknown__", pin).catch(() => false)
            return unauthorized()
          }

          if (!user.user.emailVerified) {
            throw new APIError("FORBIDDEN", {
              code: "EMAIL_NOT_VERIFIED",
              message:
                "Veuillez vérifier votre adresse email avant de vous connecter.",
            })
          }

          const verification = await verifyPinForUserId(user.user.id, pin)
          if (verification === "setup_required") {
            throw new APIError("FORBIDDEN", {
              code: "PIN_SETUP_REQUIRED",
              message: "Ce compte doit configurer son PIN.",
            })
          }
          if (verification !== "valid") return unauthorized()

          if (
            requiresTwoFactorChallenge(
              user.user as { twoFactorEnabled?: boolean | null },
            )
          ) {
            // Ne PAS créer de session : on pose l'état de vérification 2FA
            // en attente (verification DB record + cookie signé
            // `two_factor`), exactement ce que
            // `authClient.twoFactor.verifyTotp` / `verifyBackupCode`
            // s'attendent à retrouver pour créer la session finale (cf.
            // better-auth/dist/plugins/two-factor/verify-two-factor.mjs).
            const identifier = `2fa-${crypto.randomUUID()}`
            await ctx.context.internalAdapter.createVerificationValue({
              value: user.user.id,
              identifier,
              expiresAt: new Date(
                Date.now() + TWO_FACTOR_VERIFICATION_MAX_AGE_SECONDS * 1000,
              ),
            })
            const twoFactorCookie = ctx.context.createAuthCookie(
              TWO_FACTOR_COOKIE_NAME,
              { maxAge: TWO_FACTOR_VERIFICATION_MAX_AGE_SECONDS },
            )
            await ctx.setSignedCookie(
              twoFactorCookie.name,
              identifier,
              ctx.context.secret,
              twoFactorCookie.attributes,
            )
            return ctx.json({ twoFactorRedirect: true })
          }

          const session = await ctx.context.internalAdapter.createSession(
            user.user.id,
          )
          if (!session) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              code: "FAILED_TO_CREATE_SESSION",
              message: "Impossible de créer la session.",
            })
          }

          await setSessionCookie(ctx, { session, user: user.user })

          return ctx.json({ token: session.token, user: user.user })
        },
      ),
    },
    rateLimit: [
      {
        pathMatcher(path: string): boolean {
          return path === "/sign-in/pin"
        },
        window: 60,
        max: 5,
      },
    ],
  }
}
