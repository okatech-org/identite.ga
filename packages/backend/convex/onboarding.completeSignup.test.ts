/// <reference types="vite/client" />
import { register as registerAggregate } from "@convex-dev/aggregate/test"
import { register as registerBetterAuth } from "@convex-dev/better-auth/test"
import { ConvexError } from "convex/values"
import { convexTest } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { api } from "./_generated/api"
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
      email: `${identity.subject}@idn.ga`,
      emailVerified: true,
      roles: [],
    }
  }
  return {
    requireAuth: authUser,
    requireVerifiedAuth: authUser,
    getCurrentAuthUser: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string } | null> }
    }) => {
      try {
        return await authUser(ctx)
      } catch {
        return null
      }
    },
  }
})

function makeTestClient() {
  const t = convexTest(schema, modules)
  registerAggregate(t, "kycByStatus")
  registerAggregate(t, "usersByLoa")
  registerAggregate(t, "usersByProfile")
  registerBetterAuth(t)
  return t
}

const pivot = {
  firstName: "Ariane",
  lastName: "Nziengui",
  dateOfBirth: "1990-01-02",
  gender: "F" as const,
  birthPlace: "Libreville",
  nationality: "GA",
}

describe("finalisation atomique de l'inscription", () => {
  test("neutralise l'ancien endpoint qui créait un profil avant le PIN", async () => {
    // POURQUOI : des versions déjà installées de l'application peuvent encore
    // appeler ce point d'entrée. La correction du nouveau tunnel ne suffit pas
    // si l'ancien reste capable d'insérer la même donnée incomplète.
    const t = makeTestClient()
    const legacyClient = t.withIdentity({ subject: "ancien.client" })

    await expect(
      legacyClient.mutation(api.onboarding.selectProfile, {
        profileType: "citizen",
      }),
    ).rejects.toThrow(ConvexError)

    expect(
      await t.run((ctx) => ctx.db.query("userProfile").collect()),
    ).toHaveLength(0)
  })

  test("crée le profil et son pinHash dans la même mutation", async () => {
    // POURQUOI : un profil inséré avant le hash reste visible comme un compte
    // valide, mais aucun PIN ne pourra jamais l'authentifier si le tunnel est
    // abandonné entre les deux écritures.
    const t = makeTestClient()
    const asAriane = t.withIdentity({ subject: "ariane.nziengui" })

    const result = await asAriane.mutation(api.onboarding.completeSignup, {
      profileType: "citizen",
      pivot,
      handle: "ariane.nziengui",
      pin: "246813",
    })
    const rows = await t.run((ctx) => ctx.db.query("userProfile").collect())

    expect(rows).toHaveLength(1)
    expect(rows[0]?._id).toBe(result.profileId)
    expect(rows[0]?.pinHash).toMatch(/^[a-f0-9]{64}$/)
  })

  test("refuse une ancienne session avant toute création de profil", async () => {
    // POURQUOI : le bug de production venait d'une simple session truthy. Une
    // session du compte précédent ne doit jamais recevoir le profil du nouveau.
    const t = makeTestClient()
    const oldSession = t.withIdentity({ subject: "ancien.compte" })

    await expect(
      oldSession.mutation(api.onboarding.completeSignup, {
        profileType: "citizen",
        pivot,
        handle: "nouveau.compte",
        pin: "246813",
      }),
    ).rejects.toThrow(ConvexError)

    expect(
      await t.run((ctx) => ctx.db.query("userProfile").collect()),
    ).toHaveLength(0)
  })

  test("refuse un PIN invalide sans laisser de profil partiel", async () => {
    // POURQUOI : la validation doit précéder la première écriture ; compter
    // sur l'écran client permettrait à un client ancien ou modifié de recréer
    // exactement les profils sans PIN que cette correction élimine.
    const t = makeTestClient()
    const asAriane = t.withIdentity({ subject: "ariane.nziengui" })

    await expect(
      asAriane.mutation(api.onboarding.completeSignup, {
        profileType: "citizen",
        pivot,
        handle: "ariane.nziengui",
        pin: "12345",
      }),
    ).rejects.toThrow(ConvexError)

    expect(
      await t.run((ctx) => ctx.db.query("userProfile").collect()),
    ).toHaveLength(0)
  })

  test("rejoue sans doublon une finalisation dont la réponse a été perdue", async () => {
    // POURQUOI : le réseau peut couper après le commit. Le même compte et le
    // même PIN doivent alors reprendre le résultat, pas créer des préférences
    // ou des ressources d'onboarding en double.
    const t = makeTestClient()
    const asAriane = t.withIdentity({ subject: "ariane.nziengui" })
    const args = {
      profileType: "citizen" as const,
      pivot,
      handle: "ariane.nziengui",
      pin: "246813",
    }

    const first = await asAriane.mutation(api.onboarding.completeSignup, args)
    const second = await asAriane.mutation(api.onboarding.completeSignup, args)
    const counts = await t.run(async (ctx) => ({
      profiles: (await ctx.db.query("userProfile").collect()).length,
      preferences: (await ctx.db.query("userPreference").collect()).length,
      notificationPreferences: (
        await ctx.db.query("notificationPreference").collect()
      ).length,
      inboxes: (await ctx.db.query("iboiteAccount").collect()).length,
      cvs: (await ctx.db.query("citizenCv").collect()).length,
    }))

    expect(second).toEqual(first)
    expect(counts).toEqual({
      profiles: 1,
      preferences: 1,
      notificationPreferences: 1,
      inboxes: 1,
      cvs: 1,
    })
  })

  test("exige le PIN actuel dans la même mutation que le changement", async () => {
    // POURQUOI : vérifier l'ancien PIN dans un appel client séparé permettait
    // d'appeler directement l'écriture du nouveau PIN et de contourner le
    // contrôle. Les deux opérations doivent rester atomiques côté serveur.
    const t = makeTestClient()
    const asAriane = t.withIdentity({ subject: "ariane.nziengui" })
    await asAriane.mutation(api.onboarding.completeSignup, {
      profileType: "citizen",
      pivot,
      handle: "ariane.nziengui",
      pin: "246813",
    })

    await expect(
      asAriane.mutation(api.onboarding.changePin, {
        currentPin: "000000",
        newPin: "135790",
      }),
    ).rejects.toThrow(ConvexError)
    await expect(
      asAriane.mutation(api.onboarding.createPin, { pin: "135790" }),
    ).rejects.toThrow(ConvexError)

    await asAriane.mutation(api.onboarding.changePin, {
      currentPin: "246813",
      newPin: "135790",
    })
    await expect(
      asAriane.mutation(api.onboarding.verifyPin, { pin: "246813" }),
    ).resolves.toEqual({ valid: false })
    await expect(
      asAriane.mutation(api.onboarding.verifyPin, { pin: "135790" }),
    ).resolves.toEqual({ valid: true })
  })
})
