/// <reference types="vite/client" />
import { register as registerBetterAuth } from "@convex-dev/better-auth/test"
import { makeFunctionReference } from "convex/server"
import { convexTest } from "convex-test"
import { describe, expect, it } from "vitest"

import { components } from "../_generated/api"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")

type Inspection = {
  email: string
  userId: string | null
  createdAt: number | null
  emailVerified: boolean | null
  eligible: boolean
  reasons: string[]
  sessionCount: number
  accountCount: number
}

const inspectOrphans = makeFunctionReference<
  "query",
  { emails: string[] },
  Inspection[]
>("_dev/repairEmbeddedSignupOrphans:inspect")
const repairOrphans = makeFunctionReference<
  "mutation",
  { emails: string[]; confirm: string },
  { deleted: string[] }
>("_dev/repairEmbeddedSignupOrphans:run")

async function seedAuthUser(
  t: ReturnType<typeof convexTest>,
  input: { email: string; verified?: boolean; withProfile?: boolean },
) {
  const now = Date.UTC(2026, 7, 24, 9, 45)
  return await t.run(async (ctx) => {
    const user = (await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: "user",
        data: {
          email: input.email,
          name: input.email,
          emailVerified: input.verified ?? false,
          createdAt: now,
          updatedAt: now,
        },
      },
    })) as { _id: string }
    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: "account",
        data: {
          accountId: user._id,
          providerId: "credential",
          userId: user._id,
          password: "discarded-secret",
          createdAt: now,
          updatedAt: now,
        },
      },
    })
    if (input.withProfile) {
      await ctx.db.insert("userProfile", {
        userId: user._id,
        profileType: "citizen",
        loa: 1,
        idnId: "GA-TEST-0001",
        createdAt: now,
        updatedAt: now,
      })
    }
    return user._id
  })
}

function makeTestClient() {
  const t = convexTest(schema, modules)
  registerBetterAuth(t)
  return t
}

describe("réparation des inscriptions IDN embarquées incomplètes", () => {
  it("identifie puis supprime une coquille sans profil", async () => {
    const t = makeTestClient()
    const email = "orphan@idn.ga"
    const userId = await seedAuthUser(t, { email })

    const inspection = await t.query(inspectOrphans, { emails: [email] })
    expect(inspection).toMatchObject([
      { email, userId, eligible: true, accountCount: 1 },
    ])

    await t.mutation(repairOrphans, {
      emails: [email],
      confirm: "SUPPRIMER LES INSCRIPTIONS IDN INCOMPLETES",
    })

    const user = await t.run((ctx) =>
      ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "user",
        where: [{ field: "email", value: email, operator: "eq" }],
      }),
    )
    expect(user).toBeNull()
  })

  it("refuse un compte déjà vérifié ou doté d'un profil", async () => {
    const t = makeTestClient()
    const email = "citizen@idn.ga"
    await seedAuthUser(t, { email, verified: true, withProfile: true })

    const [inspection] = await t.query(inspectOrphans, { emails: [email] })
    expect(inspection?.eligible).toBe(false)
    expect(inspection?.reasons).toContain("EMAIL_ALREADY_VERIFIED")
    expect(inspection?.reasons).toContain("PROFILE_EXISTS")

    await expect(
      t.mutation(repairOrphans, {
        emails: [email],
        confirm: "SUPPRIMER LES INSCRIPTIONS IDN INCOMPLETES",
      }),
    ).rejects.toThrow(/ne correspond plus/)
  })
})
