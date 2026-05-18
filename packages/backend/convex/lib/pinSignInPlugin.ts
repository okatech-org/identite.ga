import { APIError, createAuthEndpoint } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { z } from "zod"

/**
 * Plugin Better Auth — sign-in par PIN à 6 chiffres.
 *
 * Endpoint POST /api/auth/sign-in/pin
 *   body : { email, pin }
 *   200  : { token, user } (idem signInEmail)
 *   401  : INVALID_PIN  (email inconnu, PIN absent ou incorrect)
 *
 * Pour éviter les attaques d'énumération d'email, on retourne **toujours**
 * la même erreur `INVALID_PIN` quand quelque chose cloche.
 *
 * `verifyPinForUserId(userId, pin)` est injecté par `auth.ts` — c'est la
 * fonction qui charge `userProfile.pinHash` depuis Convex, dérive le hash
 * candidat (PBKDF2-SHA256, 600k it. — §6.1) et compare.
 *
 * Une fois validé : `internalAdapter.createSession(userId)` + `setSessionCookie`.
 * Le plugin crossDomain (déjà enregistré) rewrite le `Set-Cookie` en
 * `Set-Better-Auth-Cookie` pour que le client web le stocke en localStorage.
 * Le plugin convex pose le `convex_jwt` (matcher `/sign-in/*`).
 */

const PIN_REGEX = /^\d{6}$/

const bodySchema = z.object({
  email: z.string().email(),
  pin: z.string().regex(PIN_REGEX),
})

export type VerifyPinForUserId = (
  userId: string,
  pin: string,
) => Promise<boolean>

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

          const ok = await verifyPinForUserId(user.user.id, pin)
          if (!ok) return unauthorized()

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
