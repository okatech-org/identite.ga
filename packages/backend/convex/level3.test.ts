/// <reference types="vite/client" />
import { register as registerAggregate } from "@convex-dev/aggregate/test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { ConvexError } from "convex/values"
import { convexTest } from "convex-test"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { api, internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.ts")

vi.mock("./lib/auth", async () => {
  const { ConvexError: CE } = await import("convex/values")
  const authUser = async (ctx: {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
  }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new CE({ code: "UNAUTHENTICATED", message: "Connexion requise." })
    }
    return {
      userId: identity.subject,
      email: `${identity.subject}@example.ga`,
      emailVerified: true,
      roles: identity.subject.startsWith("controller_") ? ["identity_controller"] : [],
    }
  }
  return {
    requireAuth: authUser,
    requireVerifiedAuth: authUser,
    requireController: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
    }) => {
      const user = await authUser(ctx)
      if (!user.roles.includes("identity_controller")) {
        throw new CE({ code: "FORBIDDEN", message: "Accès refusé." })
      }
      return user
    },
  }
})

function makeTestClient() {
  const t = convexTest(schema, modules)
  registerAggregate(t, "kycByStatus")
  registerAggregate(t, "usersByLoa")
  registerAggregate(t, "usersByProfile")
  // Depuis la fusion des parcours, `level3.start` peut ouvrir une piste
  // documentaire, qui passe par le rate limiter comme `kyc.initialize`.
  registerRateLimiter(t)
  return t
}

async function seedCitizen(t: ReturnType<typeof convexTest>, userId: string, loa: 1 | 2 | 3) {
  const now = Date.now()
  await t.run(async (ctx) => {
    await ctx.db.insert("userProfile", {
      userId,
      profileType: "citizen",
      loa,
      pivot: {
        firstName: "Ariane",
        lastName: "Nziengui",
        dateOfBirth: "1990-01-01",
        gender: "F",
        birthPlace: "Libreville",
        nationality: "GA",
      },
      createdAt: now,
      updatedAt: now,
    } as any)
    await ctx.db.insert("notificationPreference", {
      userId,
      email: { security: true, kyc: false, consent: true, comms: true },
      inApp: { security: true, kyc: true, consent: true, comms: true },
      updatedAt: now,
    } as any)
  })
}

beforeEach(() => {
  process.env.LIVEKIT_URL = "wss://video.identite.ga"
  process.env.LIVEKIT_API_KEY = "test-api-key"
  process.env.LIVEKIT_API_SECRET = "test-api-secret-at-least-32-characters"
  process.env.LIVEKIT_AUTOSUSPEND_ENABLED = "false"
})

describe("parcours Niveau 3", () => {
  test("mémorise l'activité LiveKit dans une entrée système unique", async () => {
    const t = makeTestClient()
    const first = await t.mutation(internal.level3.infrastructureState.recordActivity, {
      source: "token_request",
    })
    const second = await t.mutation(internal.level3.infrastructureState.recordActivity, {
      source: "active_rooms",
    })
    const activity = await t.query(internal.level3.infrastructureState.getActivity, {})
    const rows = await t.run(async (ctx) =>
      ctx.db
        .query("systemConfig")
        .withIndex("by_key", (q) => q.eq("key", "runtime.livekit.activity"))
        .take(2),
    )

    expect(second).toBeGreaterThanOrEqual(first)
    expect(activity).toMatchObject({
      lastActivityAt: second,
      source: "active_rooms",
    })
    expect(rows).toHaveLength(1)
  })

  test("n'exige plus le Niveau 2, mais exige une pièce à instruire", async () => {
    // Le prérequis Niveau 2 a été retiré (parcours fusionné). Ce qui reste
    // exigé, c'est la PREUVE DOCUMENTAIRE : sans type de pièce, on ne peut pas
    // ouvrir la piste qui l'apportera, donc la demande est refusée. Un Niveau 3
    // accordé sans pièce instruite trahirait le mapping LoA→ACR eidas3.
    const t = makeTestClient()
    await seedCitizen(t, "citizen_l1", 1)
    const citizen = t.withIdentity({ subject: "citizen_l1" })

    await expect(citizen.mutation(api.level3.start, {})).rejects.toThrow(ConvexError)

    const { verificationId } = await citizen.mutation(api.level3.start, {
      documentType: "cni_gabon",
    })
    const verification = await t.run(async (ctx) =>
      ctx.db.get(verificationId as Id<"level3Verification">),
    )
    expect(verification?.status).toBe("waiting_controller")
    expect(verification?.entryLoa).toBe(1)
    expect(verification?.kycRequestId).toBeDefined()
  })

  test("crée une seule demande active et la reprend de façon idempotente", async () => {
    const t = makeTestClient()
    await seedCitizen(t, "citizen_l2", 2)
    const citizen = t.withIdentity({ subject: "citizen_l2" })

    const first = await citizen.mutation(api.level3.start, {})
    const second = await citizen.mutation(api.level3.start, {})

    expect(second.verificationId).toBe(first.verificationId)
    const verification = await t.run(async (ctx) =>
      ctx.db.get(first.verificationId as Id<"level3Verification">),
    )
    expect(verification?.status).toBe("waiting_controller")
    expect(verification?.roomName).toBe(`idn-l3-${first.verificationId}`)
  })

  test("émet des jetons uniquement après la prise en charge", async () => {
    const t = makeTestClient()
    await seedCitizen(t, "citizen_token", 2)
    const citizen = t.withIdentity({ subject: "citizen_token" })
    const controller = t.withIdentity({ subject: "controller_a" })
    const { verificationId } = await citizen.mutation(api.level3.start, {})

    await expect(
      citizen.action(api.level3.livekit.issueJoinToken, { verificationId }),
    ).rejects.toThrow(ConvexError)

    await controller.mutation(api.level3.claim, { verificationId })
    const credentials = await citizen.action(api.level3.livekit.issueJoinToken, { verificationId })
    expect(credentials.serverUrl).toBe("wss://video.identite.ga")
    expect(credentials.roomName).toBe(`idn-l3-${verificationId}`)
    expect(credentials.token.split(".")).toHaveLength(3)
  })

  test("le contrôleur doit démarrer l'entretien avant d'accorder le Niveau 3", async () => {
    const t = makeTestClient()
    await seedCitizen(t, "citizen_approve", 2)
    const citizen = t.withIdentity({ subject: "citizen_approve" })
    const controller = t.withIdentity({ subject: "controller_a" })
    const { verificationId } = await citizen.mutation(api.level3.start, {})
    await controller.mutation(api.level3.claim, { verificationId })

    await expect(controller.mutation(api.level3.approve, { verificationId })).rejects.toThrow(
      ConvexError,
    )

    await controller.mutation(api.level3.beginInterview, { verificationId })
    await controller.mutation(api.level3.approve, { verificationId })

    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", "citizen_approve"))
        .unique(),
    )
    const verification = await t.run(async (ctx) =>
      ctx.db.get(verificationId as Id<"level3Verification">),
    )
    expect(profile?.loa).toBe(3)
    expect(verification?.status).toBe("approved")
  })

  test("un autre contrôleur ne peut pas prendre la décision", async () => {
    const t = makeTestClient()
    await seedCitizen(t, "citizen_four_eyes", 2)
    const citizen = t.withIdentity({ subject: "citizen_four_eyes" })
    const controllerA = t.withIdentity({ subject: "controller_a" })
    const controllerB = t.withIdentity({ subject: "controller_b" })
    const { verificationId } = await citizen.mutation(api.level3.start, {})
    await controllerA.mutation(api.level3.claim, { verificationId })
    await controllerA.mutation(api.level3.beginInterview, { verificationId })

    await expect(controllerB.mutation(api.level3.approve, { verificationId })).rejects.toThrow(
      ConvexError,
    )
  })

  test("un refus après entretien conserve le Niveau 2", async () => {
    const t = makeTestClient()
    await seedCitizen(t, "citizen_reject", 2)
    const citizen = t.withIdentity({ subject: "citizen_reject" })
    const controller = t.withIdentity({ subject: "controller_a" })
    const { verificationId } = await citizen.mutation(api.level3.start, {})
    await controller.mutation(api.level3.claim, { verificationId })
    await controller.mutation(api.level3.beginInterview, { verificationId })
    await controller.mutation(api.level3.reject, {
      verificationId,
      reason: "Document non présenté pendant l'entretien",
    })

    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", "citizen_reject"))
        .unique(),
    )
    const verification = await t.run(async (ctx) =>
      ctx.db.get(verificationId as Id<"level3Verification">),
    )
    expect(profile?.loa).toBe(2)
    expect(verification?.status).toBe("rejected")
  })
})
