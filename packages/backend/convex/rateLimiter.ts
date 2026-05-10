import { MINUTE, HOUR, RateLimiter } from "@convex-dev/rate-limiter"

import { components } from "./_generated/api"

/**
 * Rate limiter applicatif IDN (§6.6 du cahier).
 * Transactionnel : si la mutation appelante échoue, le quota n'est pas consommé.
 *
 * Granularités :
 *   • Par IP   → signIn, signUp
 *   • Par user → otpSend, otpVerify, kycSubmit
 *   • Par email → passwordReset, contactSubmit
 *   • Par client OAuth → oauthToken (sharded ×4 pour scalabilité)
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  signIn: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 10 },
  signUp: { kind: "fixed window", rate: 5, period: HOUR },
  otpSend: { kind: "fixed window", rate: 3, period: HOUR },
  otpVerify: { kind: "token bucket", rate: 10, period: HOUR, capacity: 10 },
  passwordReset: { kind: "fixed window", rate: 3, period: HOUR },
  oauthToken: {
    kind: "token bucket",
    rate: 60,
    period: MINUTE,
    capacity: 60,
    shards: 4,
  },
  kycSubmit: { kind: "fixed window", rate: 3, period: HOUR },
  contactSubmit: { kind: "fixed window", rate: 5, period: HOUR },
})
