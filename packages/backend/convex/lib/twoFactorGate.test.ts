import { describe, expect, test, vi } from "vitest"

import {
  handleSignInTwoFactorGate,
  requiresTwoFactorChallenge,
  type SignInTwoFactorGateCtx,
} from "./twoFactorGate"

/**
 * `requiresTwoFactorChallenge` est la branche de décision qui protège
 * `/sign-in/pin` (lib/pinSignInPlugin.ts) et le hook `/sign-in/email-otp`
 * (auth.ts) contre un contournement du TOTP : c'est la garantie business
 * que le bug corrigé ici ne peut pas régresser silencieusement — un compte
 * `twoFactorEnabled` ne doit JAMAIS obtenir de session sans passer par le
 * challenge, quel que soit le facteur "faible" utilisé pour l'authentifier
 * (PIN, OTP email...).
 */
describe("requiresTwoFactorChallenge", () => {
  test("un compte avec twoFactorEnabled=true doit passer le challenge", () => {
    expect(requiresTwoFactorChallenge({ twoFactorEnabled: true })).toBe(true)
  })

  test("un compte sans 2FA (false) ne doit pas être gated", () => {
    expect(requiresTwoFactorChallenge({ twoFactorEnabled: false })).toBe(
      false,
    )
  })

  test("un compte sans le champ (undefined) ne doit pas être gated — comportement inchangé pour les comptes pré-2FA", () => {
    expect(requiresTwoFactorChallenge({})).toBe(false)
  })

  test("un compte avec twoFactorEnabled=null ne doit pas être gated", () => {
    expect(requiresTwoFactorChallenge({ twoFactorEnabled: null })).toBe(false)
  })
})

/**
 * Fabrique un ctx factice satisfaisant `SignInTwoFactorGateCtx`, avec des
 * espions sur chaque effet de bord, pour reproduire — sans monter tout
 * Better Auth — le comportement du hook `after` top-level de auth.ts.
 */
function createFakeCtx(overrides: {
  path?: string
  newSession?: SignInTwoFactorGateCtx["context"]["newSession"]
}) {
  const deleteSession = vi.fn().mockResolvedValue(undefined)
  const createVerificationValue = vi.fn().mockResolvedValue(undefined)
  const createAuthCookie = vi.fn().mockReturnValue({
    name: "two_factor",
    attributes: { httpOnly: true },
  })
  const setSignedCookie = vi.fn().mockResolvedValue(undefined)
  const json = vi.fn((body: Record<string, unknown>) => body)

  const ctx: SignInTwoFactorGateCtx = {
    path: overrides.path,
    context: {
      newSession: overrides.newSession ?? null,
      session: null,
      setNewSession(session) {
        ctx.context.newSession = session
      },
      internalAdapter: { deleteSession, createVerificationValue },
      createAuthCookie,
      secret: "test-secret",
    },
    setSignedCookie,
    json,
  }

  return {
    ctx,
    spies: {
      deleteSession,
      createVerificationValue,
      createAuthCookie,
      setSignedCookie,
      json,
    },
  }
}

/**
 * `handleSignInTwoFactorGate` porte le correctif du BLOQUANT authz trouvé en
 * revue : supprimer la session DB ne suffisait pas — le hook `after` du
 * plugin `convex` de @convex-dev/better-auth lit `ctx.context.session ??
 * ctx.context.newSession` pour émettre un cookie `convex_jwt` signé à partir
 * des objets EN MÉMOIRE, sans re-vérifier la base. Ces tests encodent
 * l'invariant business : après un appel gaté, plus AUCUNE trace de session
 * exploitable ne doit subsister dans `ctx.context` pour les hooks suivants —
 * pas seulement "la réponse JSON dit twoFactorRedirect".
 */
describe("handleSignInTwoFactorGate", () => {
  test("compte 2FA sur /sign-in/email : supprime la session, neutralise newSession/session, pose la vérification 2FA, et renvoie twoFactorRedirect", async () => {
    const { ctx, spies } = createFakeCtx({
      path: "/sign-in/email",
      newSession: {
        session: { token: "session-token-123" },
        user: { id: "user_1", twoFactorEnabled: true },
      },
    })

    const result = await handleSignInTwoFactorGate(ctx)

    expect(result).toEqual({ twoFactorRedirect: true })
    expect(spies.deleteSession).toHaveBeenCalledWith("session-token-123")
    expect(spies.createVerificationValue).toHaveBeenCalledWith(
      expect.objectContaining({ value: "user_1" }),
    )
    expect(spies.setSignedCookie).toHaveBeenCalledTimes(1)

    // L'invariant critique : plus rien d'exploitable ne doit rester dans le
    // ctx pour un hook `after` qui s'exécuterait ensuite (ex. le plugin
    // `convex`, qui lit exactement cette expression pour émettre le
    // `convex_jwt`).
    expect(ctx.context.newSession).toBeNull()
    expect(ctx.context.session).toBeNull()
    expect(ctx.context.session ?? ctx.context.newSession).toBeFalsy()
  })

  test("compte SANS 2FA : no-op total — aucune session supprimée, rien neutralisé, pas de redirection", async () => {
    const { ctx, spies } = createFakeCtx({
      path: "/sign-in/email",
      newSession: {
        session: { token: "session-token-456" },
        user: { id: "user_2", twoFactorEnabled: false },
      },
    })

    const result = await handleSignInTwoFactorGate(ctx)

    expect(result).toBeUndefined()
    expect(spies.deleteSession).not.toHaveBeenCalled()
    expect(spies.createVerificationValue).not.toHaveBeenCalled()
    expect(spies.setSignedCookie).not.toHaveBeenCalled()
    // La session doit rester intacte pour que le hook `convex` en aval
    // émette normalement le `convex_jwt` — c'est le comportement de login
    // standard, ne doit pas régresser.
    expect(ctx.context.newSession).not.toBeNull()
  })

  test("chemin hors /sign-in/* (ex. /two-factor/verify-totp) : no-op même pour un compte 2FA", async () => {
    const { ctx, spies } = createFakeCtx({
      path: "/two-factor/verify-totp",
      newSession: {
        session: { token: "session-token-789" },
        user: { id: "user_3", twoFactorEnabled: true },
      },
    })

    const result = await handleSignInTwoFactorGate(ctx)

    expect(result).toBeUndefined()
    expect(spies.deleteSession).not.toHaveBeenCalled()
    expect(ctx.context.newSession).not.toBeNull()
  })

  test("pas de session créée (ex. /sign-in/pin gaté en amont) : no-op, aucun effet de bord", async () => {
    const { ctx, spies } = createFakeCtx({
      path: "/sign-in/pin",
      newSession: null,
    })

    const result = await handleSignInTwoFactorGate(ctx)

    expect(result).toBeUndefined()
    expect(spies.deleteSession).not.toHaveBeenCalled()
    expect(spies.createVerificationValue).not.toHaveBeenCalled()
  })
})
