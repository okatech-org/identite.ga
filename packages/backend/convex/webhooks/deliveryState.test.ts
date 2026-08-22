/// <reference types="vite/client" />
// @vitest-environment edge-runtime
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { internal } from "../_generated/api"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")

function makeTestClient() {
  return convexTest(schema, modules)
}

async function seedDelivery(
  t: ReturnType<typeof makeTestClient>,
  consecutiveFailures = 0,
) {
  return await t.run(async (ctx) => {
    const now = Date.now()
    const endpointId = await ctx.db.insert("webhookEndpoints", {
      appClientId: "client_test",
      developerUserId: "developer_test",
      environment: "sandbox",
      name: "Test",
      url: "https://consumer.example/webhooks",
      status: "active",
      secretCiphertext: "ciphertext",
      secretIv: "iv",
      consecutiveFailures,
      createdAt: now,
      updatedAt: now,
    })
    const eventId = await ctx.db.insert("webhookEvents", {
      eventId: "evt_test",
      type: "iboite.account.updated",
      apiVersion: "1",
      authorization: "oauth_user",
      subject: "sub_test",
      requiredScope: "idn:iboite.read",
      payloadJson: "{}",
      fanoutStatus: "completed",
      createdAt: now,
      expiresAt: now + 1_000,
    })
    await ctx.db.insert("webhookSubscriptions", {
      endpointId,
      appClientId: "client_test",
      eventType: "iboite.account.updated",
      createdAt: now,
    })
    const deliveryId = await ctx.db.insert("webhookDeliveries", {
      eventId,
      endpointId,
      appClientId: "client_test",
      status: "delivering",
      attempts: 1,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    })
    return { deliveryId, endpointId }
  })
}

describe("état des livraisons webhook", () => {
  test("HTTP 410 retire définitivement l'endpoint", async () => {
    const t = makeTestClient()
    const ids = await seedDelivery(t)

    await t.mutation(internal.webhooks.deliveryState.finish, {
      deliveryId: ids.deliveryId,
      outcome: "failure",
      httpStatus: 410,
      errorCode: "HTTP_410",
    })

    const rows = await t.run(async (ctx) => ({
      endpoint: await ctx.db.get(ids.endpointId),
      delivery: await ctx.db.get(ids.deliveryId),
    }))
    expect(rows.endpoint?.status).toBe("disabled")
    expect(rows.delivery?.status).toBe("failed")
  })

  test("le vingtième échec consécutif met l'endpoint en pause", async () => {
    const t = makeTestClient()
    const ids = await seedDelivery(t, 19)

    await t.mutation(internal.webhooks.deliveryState.finish, {
      deliveryId: ids.deliveryId,
      outcome: "failure",
      errorCode: "TIMEOUT",
    })

    const endpoint = await t.run((ctx) => ctx.db.get(ids.endpointId))
    expect(endpoint?.status).toBe("paused")
    expect(endpoint?.consecutiveFailures).toBe(20)
  })

  test("un ancien challenge ne peut pas activer une URL modifiée", async () => {
    const t = makeTestClient()
    const endpointId = await t.run((ctx) =>
      ctx.db.insert("webhookEndpoints", {
        appClientId: "client_test",
        developerUserId: "developer_test",
        environment: "sandbox",
        name: "Test",
        url: "https://new.example/webhooks",
        status: "pending",
        secretCiphertext: "ciphertext",
        secretIv: "iv",
        challengeId: "new_challenge",
        consecutiveFailures: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    )

    await t.mutation(internal.webhooks.deliveryState.completeChallenge, {
      endpointId,
      challengeId: "old_challenge",
      success: true,
    })

    const endpoint = await t.run((ctx) => ctx.db.get(endpointId))
    expect(endpoint?.status).toBe("pending")
    expect(endpoint?.verifiedAt).toBeUndefined()
  })
})
