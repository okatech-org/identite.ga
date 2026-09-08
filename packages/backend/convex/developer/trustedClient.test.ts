import { describe, expect, it, vi } from "vitest"
import { bootstrapTrustedClient } from "./apps"

vi.mock("../lib/auth", () => ({
  getCurrentAuthUser: vi.fn(), requireAuth: vi.fn(), requireDeveloper: vi.fn(),
}))

// Le composant Better Auth est simulé ; le handler interne et sa validation
// sont ceux de production. Aucune clé de déploiement ni requête réseau.
const invoke = bootstrapTrustedClient as unknown as {
  isInternal: boolean
  _handler: (ctx: { runQuery: ReturnType<typeof vi.fn>; runMutation: ReturnType<typeof vi.fn> },
    args: { name: string; redirectUris: string[]; scopes: string[]; loa: 1 }) =>
      Promise<{ id: string; clientId: string; clientSecret: string }>
}
const input = {
  name: "NDJOBI", redirectUris: ["https://ndjobi.app/api/auth/oauth2/callback/idn"],
  scopes: ["openid", "profile", "email"], loa: 1 as const,
}
const context = () => ({
  runQuery: vi.fn().mockResolvedValue({ page: [] }),
  runMutation: vi.fn().mockResolvedValue({ _id: "client-test" }),
})

describe("amorçage du client de confiance Ndjobi", () => {
  it("reste interne et persiste uniquement un hash compatible Better Auth", async () => {
    const ctx = context()
    const result = await invoke._handler(ctx, input)
    expect(invoke.isInternal).toBe(true)
    expect(result.clientSecret).toMatch(/^idn_sk_live_/)
    const stored = ctx.runMutation.mock.calls[0][1].input.data
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(result.clientSecret))
    const expectedHash = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    expect(stored.clientSecret).toBe(expectedHash)
    expect(JSON.stringify(stored)).not.toContain(result.clientSecret)
    expect(stored.redirectUrls).toBe(input.redirectUris[0])
    expect(JSON.parse(stored.metadata).scopes).toEqual(input.scopes)
  })

  it("refuse de recréer un client existant sans en changer le secret", async () => {
    const ctx = context()
    ctx.runQuery.mockResolvedValue({ page: [{ clientId: "existant" }] })
    await expect(invoke._handler(ctx, input)).rejects.toThrow(/existe déjà/)
    expect(ctx.runMutation).not.toHaveBeenCalled()
  })

  it.each([
    "http://ndjobi.app/callback", "https://ndjobi.app/callback#fragment",
    "https://user:password@ndjobi.app/callback", "https://ndjobi.app/callback,https://evil.example",
    "https://ndjobi.app/call back",
  ])("refuse un callback ambigu ou non sécurisé : %s", async (uri) => {
    const ctx = context()
    await expect(invoke._handler(ctx, { ...input, redirectUris: [uri] })).rejects.toThrow()
    expect(ctx.runMutation).not.toHaveBeenCalled()
  })

  it.each([["profile"], ["openid", "admin:all"]])("refuse des scopes non prévus : %s", async (...scopes) => {
    const ctx = context()
    await expect(invoke._handler(ctx, { ...input, scopes })).rejects.toThrow()
    expect(ctx.runQuery).not.toHaveBeenCalled()
  })
})
