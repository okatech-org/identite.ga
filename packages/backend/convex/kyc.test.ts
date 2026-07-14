/// <reference types="vite/client" />
import { ConvexError } from "convex/values"
import { convexTest } from "convex-test"
import { register as registerAggregate } from "@convex-dev/aggregate/test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { register as registerWorkflow } from "@convex-dev/workflow/test"
import { describe, expect, test, vi } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

// Cf. kyc/mutations.test.ts pour l'explication du glob root-relative.
const modules = import.meta.glob("/convex/**/*.ts")

/**
 * `submit` doit refuser de re-rentrer dans le pipeline KYC une demande déjà
 * `rejected` (rejet humain, ex. `controller.queue.reject` pour fraude) — cf.
 * la garde symétrique sur `setDocumentImage`/`setSelfie`. Sans cette garde,
 * un citoyen pouvait rappeler `submit` sur le même `kycRequestId` après un
 * rejet dur, relancer le workflow, et — combiné à l'absence de garde
 * terminale sur `approveAuto` (corrigée séparément, cf.
 * kyc/mutations.test.ts) — faire remonter `approved` + LoA 2 sur de bons
 * scores auto, écrasant silencieusement la décision humaine sans nouvelle
 * revue. Ce test verrouille la moitié « point d'entrée » de la chaîne.
 */
vi.mock("./lib/auth", async () => {
  const { ConvexError: CE } = await import("convex/values")
  return {
    requireVerifiedAuth: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
    }) => {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) {
        throw new CE({
          code: "UNAUTHENTICATED",
          message: "Vous devez être connecté.",
        })
      }
      return {
        userId: identity.subject,
        email: "",
        emailVerified: true,
        roles: [],
      }
    },
    getCurrentAuthUser: async () => null,
  }
})

function makeTestClient() {
  const t = convexTest(schema, modules)
  registerAggregate(t, "kycByStatus")
  registerRateLimiter(t) // `submit` ne rate-limite pas directement, mais `initialize` en amont le fait dans les flux réels — pas nécessaire ici, gardé pour cohérence si le mock évolue.
  registerWorkflow(t) // `submit` appelle `workflow.start(...)` — composant durable execution requis.
  return t
}

async function seedKyc(
  t: ReturnType<typeof convexTest>,
  userId: string,
  status: "pending" | "submitted" | "under_review" | "approved" | "rejected",
) {
  const now = Date.now()
  return await t.run(async (ctx) => {
    const front = await ctx.storage.store(new Blob(["front"]))
    const selfie = await ctx.storage.store(new Blob(["selfie"]))
    return await ctx.db.insert("kycRequest", {
      userId,
      documentType: "cni_gabon",
      documentImages: { front },
      selfieImage: selfie,
      status,
      createdAt: now,
      updatedAt: now,
    })
  })
}

describe("kyc.submit — garde de statut", () => {
  test("rejected → ALREADY_SUBMITTED, pas de nouveau workflow, statut inchangé", async () => {
    const t = makeTestClient()
    const userId = "user_1"
    const kycRequestId = await seedKyc(t, userId, "rejected")

    const asUser = t.withIdentity({ subject: userId })
    await expect(
      asUser.mutation(api.kyc.submit, { kycRequestId }),
    ).rejects.toThrow(ConvexError)

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("rejected")
    expect(kyc?.submittedAt).toBeUndefined()
  })

  test("approved → ALREADY_SUBMITTED également (déjà terminal, pas seulement rejected)", async () => {
    const t = makeTestClient()
    const userId = "user_2"
    const kycRequestId = await seedKyc(t, userId, "approved")

    const asUser = t.withIdentity({ subject: userId })
    await expect(
      asUser.mutation(api.kyc.submit, { kycRequestId }),
    ).rejects.toThrow(ConvexError)
  })

  test("pending → toujours autorisé (la garde ne casse pas le flux légitime)", async () => {
    const t = makeTestClient()
    const userId = "user_3"
    const kycRequestId = await seedKyc(t, userId, "pending")

    const asUser = t.withIdentity({ subject: userId })
    await asUser.mutation(api.kyc.submit, { kycRequestId })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("submitted")
    expect(kyc?.submittedAt).toBeDefined()
  })
})
