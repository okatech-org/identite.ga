/// <reference types="vite/client" />

import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { internal } from "./_generated/api"
import { hashToken } from "./lib/secureToken"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.ts")

describe("dev:createDirectoryApiKey", () => {
  test("émet une clé dédiée au seul scope citizens:resolve", async () => {
    const t = convexTest(schema, modules)
    const created = await t.mutation(internal.dev.createDirectoryApiKey, {
      ownerLabel: "gabon-gouv",
    })

    expect(created.token).toMatch(/^idn_pat_/)
    expect(created.scopes).toEqual(["citizens:resolve"])

    const row = await t.run(async (ctx) => ctx.db.get(created.id))
    expect(row).toMatchObject({
      userId: "dev-script:gabon-gouv",
      name: "Annuaire – gabon-gouv",
      scopes: ["citizens:resolve"],
      tokenHash: await hashToken(created.token),
    })
    expect(JSON.stringify(row)).not.toContain(created.token)
  })
})
