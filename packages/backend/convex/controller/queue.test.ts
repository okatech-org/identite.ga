/// <reference types="vite/client" />
import { ConvexError } from "convex/values"
import { convexTest } from "convex-test"
import { register as registerAggregate } from "@convex-dev/aggregate/test"
import { describe, expect, test, vi } from "vitest"

import { api } from "../_generated/api"
import schema from "../schema"

// Cf. kyc/mutations.test.ts pour l'explication du glob root-relative.
const modules = import.meta.glob("/convex/**/*.ts")

/**
 * `approve` / `reject` / `requestComplement` / `claim` sont les 4 leviers
 * contrôleur sur une demande KYC. Sans garde d'état terminal, un contrôleur
 * (le même ou un AUTRE, cf. `NOT_CLAIMED`) pouvait écraser la décision déjà
 * prise par un pair — rupture du principe four-eyes / séparation des tâches
 * attendu d'un système d'identité national. Ces tests verrouillent :
 *   • aucune des 3 mutations de décision n'agit sur un dossier hors
 *     `under_review` (notamment déjà `approved`/`rejected`, terminal) ;
 *   • aucune n'agit sur un dossier réclamé (`reviewerId`) par un AUTRE
 *     contrôleur ;
 *   • le flux légitime (`under_review`, réclamé par l'appelant ou pas encore
 *     réclamé) reste vert.
 */
vi.mock("../lib/auth", async () => {
  const { ConvexError: CE } = await import("convex/values")
  return {
    requireController: async (ctx: {
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
        roles: ["identity_controller"],
      }
    },
  }
})

function makeTestClient() {
  const t = convexTest(schema, modules)
  registerAggregate(t, "kycByStatus")
  registerAggregate(t, "usersByLoa")
  registerAggregate(t, "usersByProfile")
  return t
}

async function seedKyc(
  t: ReturnType<typeof convexTest>,
  opts: {
    userId: string
    status: "pending" | "submitted" | "under_review" | "complement_required" | "approved" | "rejected"
    reviewerId?: string
  },
) {
  const now = Date.now()
  return await t.run(async (ctx) => {
    const kycRequestId = await ctx.db.insert("kycRequest", {
      userId: opts.userId,
      documentType: "cni_gabon",
      documentImages: {},
      status: opts.status,
      reviewerId: opts.reviewerId,
      createdAt: now,
      updatedAt: now,
    })
    await ctx.db.insert("userProfile", {
      userId: opts.userId,
      profileType: "citizen",
      loa: 1,
      createdAt: now,
      updatedAt: now,
    } as any)
    await ctx.db.insert("notificationPreference", {
      userId: opts.userId,
      email: { security: true, kyc: false, consent: true, comms: true },
      inApp: { security: true, kyc: true, consent: true, comms: true },
      updatedAt: now,
    } as any)
    return kycRequestId
  })
}

const CONTROLLER_A = "controller_a"
const CONTROLLER_B = "controller_b"

describe("approve", () => {
  test("chemin légitime : under_review + réclamé par l'appelant → approved + LoA 2", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_1",
      status: "under_review",
      reviewerId: CONTROLLER_A,
    })
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await asA.mutation(api.controller.queue.approve, { kycRequestId })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("approved")
    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", "citizen_1"))
        .unique(),
    )
    expect(profile?.loa).toBe(2)
  })

  test("refuse d'approuver une demande déjà approved (écrasement d'une décision terminale)", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_2",
      status: "approved",
      reviewerId: CONTROLLER_A,
    })
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await expect(
      asA.mutation(api.controller.queue.approve, { kycRequestId }),
    ).rejects.toThrow(ConvexError)
  })

  test("refuse d'approuver une demande déjà rejected", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_3",
      status: "rejected",
      reviewerId: CONTROLLER_A,
    })
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await expect(
      asA.mutation(api.controller.queue.approve, { kycRequestId }),
    ).rejects.toThrow(ConvexError)

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("rejected")
  })

  test("refuse d'approuver un dossier réclamé par un AUTRE contrôleur (four-eyes)", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_4",
      status: "under_review",
      reviewerId: CONTROLLER_A,
    })
    const asB = t.withIdentity({ subject: CONTROLLER_B })

    await expect(
      asB.mutation(api.controller.queue.approve, { kycRequestId }),
    ).rejects.toThrow(ConvexError)

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("under_review")
  })

  test("refuse d'approuver une demande pas encore en revue (pending)", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_5",
      status: "pending",
    })
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await expect(
      asA.mutation(api.controller.queue.approve, { kycRequestId }),
    ).rejects.toThrow(ConvexError)
  })
})

describe("reject", () => {
  test("chemin légitime : under_review + réclamé par l'appelant → rejected", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_6",
      status: "under_review",
      reviewerId: CONTROLLER_A,
    })
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await asA.mutation(api.controller.queue.reject, {
      kycRequestId,
      reason: "Document illisible",
    })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("rejected")
  })

  test("refuse de rejeter une demande déjà approved", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_7",
      status: "approved",
      reviewerId: CONTROLLER_A,
    })
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await expect(
      asA.mutation(api.controller.queue.reject, {
        kycRequestId,
        reason: "Rejeu tardif",
      }),
    ).rejects.toThrow(ConvexError)

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("approved")
  })

  test("refuse de rejeter une demande déjà rejected (idempotence sur le motif d'origine)", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_8",
      status: "rejected",
      reviewerId: CONTROLLER_A,
    })
    await t.run(async (ctx) =>
      ctx.db.patch(kycRequestId, { rejectionReason: "motif original" }),
    )
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await expect(
      asA.mutation(api.controller.queue.reject, {
        kycRequestId,
        reason: "autre motif — ne doit pas remplacer",
      }),
    ).rejects.toThrow(ConvexError)

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.rejectionReason).toBe("motif original")
  })

  test("refuse de rejeter un dossier réclamé par un AUTRE contrôleur", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_9",
      status: "under_review",
      reviewerId: CONTROLLER_A,
    })
    const asB = t.withIdentity({ subject: CONTROLLER_B })

    await expect(
      asB.mutation(api.controller.queue.reject, {
        kycRequestId,
        reason: "Tentative non autorisée",
      }),
    ).rejects.toThrow(ConvexError)
  })
})

describe("requestComplement", () => {
  test("chemin légitime : under_review → complement_required", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_10",
      status: "under_review",
      reviewerId: CONTROLLER_A,
    })
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await asA.mutation(api.controller.queue.requestComplement, {
      kycRequestId,
      message: "Merci de fournir un document plus lisible.",
    })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("complement_required")
  })

  test("refuse de rouvrir une demande déjà rejected (terminale)", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_11",
      status: "rejected",
      reviewerId: CONTROLLER_A,
    })
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await expect(
      asA.mutation(api.controller.queue.requestComplement, {
        kycRequestId,
        message: "Tentative de réouverture après rejet.",
      }),
    ).rejects.toThrow(ConvexError)

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("rejected")
  })

  test("refuse de rouvrir une demande déjà approved", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_12",
      status: "approved",
      reviewerId: CONTROLLER_A,
    })
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await expect(
      asA.mutation(api.controller.queue.requestComplement, {
        kycRequestId,
        message: "Tentative de réouverture après approbation.",
      }),
    ).rejects.toThrow(ConvexError)
  })

  test("refuse pour un dossier réclamé par un AUTRE contrôleur", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_13",
      status: "under_review",
      reviewerId: CONTROLLER_A,
    })
    const asB = t.withIdentity({ subject: CONTROLLER_B })

    await expect(
      asB.mutation(api.controller.queue.requestComplement, {
        kycRequestId,
        message: "Tentative non autorisée.",
      }),
    ).rejects.toThrow(ConvexError)
  })
})

describe("claim", () => {
  test("chemin légitime : under_review non réclamé → assigné à l'appelant", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_14",
      status: "under_review",
    })
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await asA.mutation(api.controller.queue.claim, { kycRequestId })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.reviewerId).toBe(CONTROLLER_A)
  })

  test("refuse de claim un dossier déjà tranché (approved)", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_15",
      status: "approved",
    })
    const asA = t.withIdentity({ subject: CONTROLLER_A })

    await expect(
      asA.mutation(api.controller.queue.claim, { kycRequestId }),
    ).rejects.toThrow(ConvexError)
  })

  test("refuse de claim un dossier déjà assigné à un AUTRE contrôleur", async () => {
    const t = makeTestClient()
    const kycRequestId = await seedKyc(t, {
      userId: "citizen_16",
      status: "under_review",
      reviewerId: CONTROLLER_A,
    })
    const asB = t.withIdentity({ subject: CONTROLLER_B })

    await expect(
      asB.mutation(api.controller.queue.claim, { kycRequestId }),
    ).rejects.toThrow(ConvexError)
  })
})
