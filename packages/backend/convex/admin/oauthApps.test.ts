/// <reference types="vite/client" />
import { register as registerBetterAuth } from "@convex-dev/better-auth/test"
import { convexTest } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { api, components } from "../_generated/api"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")

vi.mock("../lib/auth", async () => {
  const { ConvexError } = await import("convex/values")
  return {
    requireAdmin: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
    }) => {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity?.subject.startsWith("admin_")) {
        throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé." })
      }
      return {
        userId: identity.subject,
        email: `${identity.subject}@example.ga`,
        emailVerified: true,
        roles: ["admin"],
      }
    },
  }
})

function makeTestClient() {
  const testClient = convexTest(schema, modules)
  registerBetterAuth(testClient)
  return testClient
}

async function seedEnvironment(
  testClient: ReturnType<typeof makeTestClient>,
  input: {
    clientId: string
    environment: "sandbox" | "production"
    linkedClientId: string
    productionStatus?: "pending" | "approved"
    disabled: boolean
  },
) {
  await testClient.run(async (ctx) => {
    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: "oauthApplication",
        data: {
          clientId: input.clientId,
          userId: "developer_1",
          name: "Administration.ga",
          redirectUrls: "https://administration.ga/auth/callback",
          disabled: input.disabled,
          metadata: JSON.stringify({
            env: input.environment,
            status: input.environment === "production" ? "pending" : undefined,
            linkedClientId: input.linkedClientId,
            productionStatus: input.productionStatus,
            loa: 2,
            scopes: ["openid", "profile"],
          }),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    })
  })
}

describe("applications OAuth unifiées dans la console admin", () => {
  test("la Sandbox et la Production liées occupent une seule ligne", async () => {
    const testClient = makeTestClient()
    await seedEnvironment(testClient, {
      clientId: "administration_sbx",
      environment: "sandbox",
      linkedClientId: "administration_prd",
      productionStatus: "pending",
      disabled: false,
    })
    await seedEnvironment(testClient, {
      clientId: "administration_prd",
      environment: "production",
      linkedClientId: "administration_sbx",
      disabled: true,
    })

    const asAdmin = testClient.withIdentity({ subject: "admin_1" })
    const applications = await asAdmin.query(api.admin.oauthApps.listApps, {
      limit: 200,
    })

    expect(applications).toHaveLength(1)
    expect(applications[0]).toMatchObject({
      clientId: "administration_sbx",
      sandboxClientId: "administration_sbx",
      productionClientId: "administration_prd",
      productionStatus: "pending",
      status: "pending",
    })
  })

  test("la fiche expose les deux environnements et approuve depuis la Sandbox", async () => {
    const testClient = makeTestClient()
    await seedEnvironment(testClient, {
      clientId: "administration_sbx",
      environment: "sandbox",
      linkedClientId: "administration_prd",
      productionStatus: "pending",
      disabled: false,
    })
    await seedEnvironment(testClient, {
      clientId: "administration_prd",
      environment: "production",
      linkedClientId: "administration_sbx",
      disabled: true,
    })

    const asAdmin = testClient.withIdentity({ subject: "admin_1" })
    const productionBefore = await asAdmin.query(api.admin.oauthApps.getApp, {
      clientId: "administration_prd",
    })
    expect(productionBefore).toMatchObject({
      environment: "production",
      sandboxClientId: "administration_sbx",
      productionClientId: "administration_prd",
      productionStatus: "pending",
    })

    await asAdmin.mutation(api.admin.oauthApps.approveProductionRequest, {
      clientId: "administration_sbx",
    })

    const applications = await asAdmin.query(api.admin.oauthApps.listApps, {
      limit: 200,
    })
    expect(applications).toHaveLength(1)
    expect(applications[0]).toMatchObject({
      status: "production",
      productionStatus: "approved",
      disabled: false,
    })
  })
})
