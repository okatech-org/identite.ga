import { defineApp } from "convex/server"
import betterAuth from "@convex-dev/better-auth/convex.config"
import rateLimiter from "@convex-dev/rate-limiter/convex.config"
import aggregate from "@convex-dev/aggregate/convex.config"
import workflow from "@convex-dev/workflow/convex.config"
import workpool from "@convex-dev/workpool/convex.config"

const app = defineApp()

// Auth (Better Auth) — owns user/account/session/oauth/jwks tables in its
// component namespace.
app.use(betterAuth)

// Rate limiting — transactional, per IP / user / client.
app.use(rateLimiter)

// Aggregates — KPIs dashboard admin (O(log N) count/sum/min/max).
// Plusieurs instances, chacune indexée différemment selon l'usage métier.
app.use(aggregate, { name: "usersByLoa" })
app.use(aggregate, { name: "usersByProfile" })
app.use(aggregate, { name: "kycByStatus" })
app.use(aggregate, { name: "auditByCategory" })

// Workflow — durable execution pour pipelines KYC L2 multi-étapes.
app.use(workflow)

// Workpool — exécution à concurrence bornée des jobs IA iCV (lisse les pics
// d'appels provider, retry/backoff au niveau pool). Cf. cv/ai.ts.
app.use(workpool, { name: "aiWorkpool" })

export default app
