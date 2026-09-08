/// <reference types="vite/client" />
// @vitest-environment edge-runtime
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { internal } from "../_generated/api"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")

async function seedAccount(
  t: ReturnType<typeof convexTest>,
  userId: string,
  suffix: string,
) {
  return await t.run((ctx) =>
    ctx.db.insert("iboiteAccount", {
      userId,
      type: "personal",
      label: `Citoyen ${suffix}`,
      emailAlias: `${suffix}@idn.ga`,
      street: "",
      city: "Libreville",
      postalCode: "",
      country: "GA",
      qrCode: `QR-${suffix}`,
      counters: {
        unreadLetters: 0,
        pendingLetters: 0,
        availablePackages: 0,
        unreadMessages: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  )
}

describe("façade OAuth iBoîte", () => {
  test("ne restitue jamais la ressource personnelle d'un autre sub", async () => {
    const t = convexTest(schema, modules)
    const accountA = await seedAccount(t, "user_a", "a")
    const accountB = await seedAccount(t, "user_b", "b")
    await t.run(async (ctx) => {
      await ctx.db.insert("iboiteLetter", {
        accountId: accountA,
        userId: "user_a",
        folder: "inbox",
        senderName: "Administration A",
        senderAddress: "Libreville",
        recipientName: "Citoyen A",
        recipientAddress: "Libreville",
        subject: "Privé A",
        body: "Contenu A",
        type: "informational",
        stampColor: "green",
        isRead: false,
        createdAt: Date.now(),
      })
      await ctx.db.insert("iboiteLetter", {
        accountId: accountB,
        userId: "user_b",
        folder: "inbox",
        senderName: "Administration B",
        senderAddress: "Libreville",
        recipientName: "Citoyen B",
        recipientAddress: "Libreville",
        subject: "Privé B",
        body: "Contenu B",
        type: "informational",
        stampColor: "green",
        isRead: false,
        createdAt: Date.now(),
      })
    })

    const raw = await t.query(internal.iboite.oauthApi.readResource, {
      userId: "user_a",
      resource: "letters",
      folder: "inbox",
    })
    const result = JSON.parse(raw) as { items: Array<{ subject: string }> }
    expect(result.items.map((item) => item.subject)).toEqual(["Privé A"])
  })

  test("dépose un courrier officiel de façon idempotente et n'émet que les compteurs", async () => {
    const t = convexTest(schema, modules)
    await seedAccount(t, "recipient", "recipient")
    const args = {
      appClientId: "partner_app",
      recipientSub: "recipient",
      idempotencyKey: "procedure_42",
      senderName: "Service public",
      senderAddress: "Libreville",
      subject: "Accusé de démarche",
      body: "Contenu confidentiel qui ne doit pas partir dans le webhook",
    }

    const first = await t.mutation(
      internal.iboite.oauthApi.depositOfficialLetter,
      args,
    )
    const replay = await t.mutation(
      internal.iboite.oauthApi.depositOfficialLetter,
      args,
    )
    expect(replay).toBe(first)

    const snapshot = await t.run(async (ctx) => ({
      account: await ctx.db
        .query("iboiteAccount")
        .withIndex("by_userId_type", (q) =>
          q.eq("userId", "recipient").eq("type", "personal"),
        )
        .unique(),
      letters: await ctx.db.query("iboiteLetter").collect(),
      events: await ctx.db.query("webhookEvents").collect(),
    }))
    expect(snapshot.letters).toHaveLength(1)
    expect(snapshot.account?.counters.unreadLetters).toBe(1)
    expect(snapshot.account?.syncVersion).toBe(1)
    expect(snapshot.events).toHaveLength(1)
    expect(JSON.parse(snapshot.events[0]!.payloadJson)).toMatchObject({
      type: "iboite.account.updated",
      subject: "recipient",
      data: {
        accountVersion: 1,
        counters: { unreadLetters: 1 },
      },
    })
    expect(snapshot.events[0]!.payloadJson).not.toContain(args.body)
  })
})
