/// <reference types="vite/client" />
import { register as registerAggregate } from "@convex-dev/aggregate/test"
import { register as registerBetterAuth } from "@convex-dev/better-auth/test"
import { ConvexError } from "convex/values"
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { api, components } from "./_generated/api"
import { derivePinHash, hashOpaqueSecret } from "./lib/pin"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.ts")

function makeTestClient() {
  const t = convexTest(schema, modules)
  registerAggregate(t, "kycByStatus")
  registerAggregate(t, "usersByLoa")
  registerAggregate(t, "usersByProfile")
  registerBetterAuth(t)
  return t
}

describe("réinitialisation du PIN après vérification SMS", () => {
  test("consomme le jeton, remplace le hash et interdit le rejeu", async () => {
    const t = makeTestClient()
    const now = Date.now()
    const resetToken = "reset-token-secret"
    const resetTokenHash = await hashOpaqueSecret(resetToken)

    const seeded = await t.run(async (ctx) => {
      const user = (await ctx.runMutation(
        components.betterAuth.adapter.create,
        {
          input: {
            model: "user",
            data: {
              email: "ariane.nziengui@idn.ga",
              name: "Ariane Nziengui",
              emailVerified: true,
              createdAt: now,
              updatedAt: now,
            },
          },
        },
      )) as { _id: string }
      const pinHash = await derivePinHash("123456", user._id)
      const profileId = await ctx.db.insert("userProfile", {
        userId: user._id,
        profileType: "citizen",
        loa: 1,
        pivot: {
          firstName: "Ariane",
          lastName: "Nziengui",
          dateOfBirth: "1990-01-02",
          gender: "F",
          birthPlace: "Libreville",
          nationality: "GA",
          phone: "+241 06 22 14 89",
        },
        pinHash,
        createdAt: now,
        updatedAt: now,
      })
      await ctx.db.insert("pinRecoveryChallenge", {
        requestId: "request-reset-test-1234",
        userId: user._id,
        phone: "+24106221489",
        status: "verified",
        attempts: 1,
        resetTokenHash,
        resetTokenExpiresAt: now + 60_000,
        expiresAt: now + 60_000,
        createdAt: now,
        updatedAt: now,
      })
      return { userId: user._id, profileId }
    })

    await t.mutation(api.pinRecovery.resetPin, {
      requestId: "request-reset-test-1234",
      resetToken,
      newPin: "654321",
    })

    const state = await t.run(async (ctx) => ({
      profile: await ctx.db.get(seeded.profileId),
      challenges: await ctx.db.query("pinRecoveryChallenge").collect(),
    }))
    expect(state.profile?.pinHash).toBe(
      await derivePinHash("654321", seeded.userId),
    )
    expect(state.challenges).toHaveLength(0)

    await expect(
      t.mutation(api.pinRecovery.resetPin, {
        requestId: "request-reset-test-1234",
        resetToken,
        newPin: "246813",
      }),
    ).rejects.toThrow(ConvexError)
  })
})
