/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { register as registerAggregate } from "@convex-dev/aggregate/test"
import { describe, expect, test } from "vitest"

import { internal } from "../_generated/api"
import {
  CLAIM_MAX_ATTEMPTS,
  generateClaimCode,
  hashClaimCode,
  looksLikeClaimCode,
  normalizeClaimCode,
  timingSafeEqualHex,
} from "../lib/claimCode"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")

/**
 * Revendication d'une identité déléguée — barrière de preuve de possession.
 *
 * CONTEXTE : `/api/claim/complete` n'exigeait que le `delegatedIdentityId`,
 * lui-même obtenu de la route PUBLIQUE `/api/claim/lookup` avec pour seule
 * entrée un NIP (imprimé sur la carte d'identité) ou un nom + une date de
 * naissance. N'importe qui pouvait donc poser son mot de passe et son PIN sur
 * l'identité d'un citoyen — y compris une identité créée en LoA 2, donc déjà
 * vérifiée. Ces tests existent pour que cette porte ne puisse pas se rouvrir.
 *
 * Ce qu'ils verrouillent :
 *   • connaître le `delegatedIdentityId` ne suffit JAMAIS ;
 *   • le code est à usage unique et meurt avec la réclamation ;
 *   • les tentatives sont plafonnées (sinon 60 bits d'entropie ne servent à
 *     rien face à un brute-force en ligne) ;
 *   • aucun secret exploitable ne reste en base.
 */
function makeTestClient() {
  const t = convexTest(schema, modules)
  registerAggregate(t, "kycByStatus")
  registerAggregate(t, "usersByLoa")
  registerAggregate(t, "usersByProfile")
  return t
}

async function seedDelegation(
  t: ReturnType<typeof convexTest>,
  opts: {
    codeHash?: string
    expiresAt?: number
    status?: "created" | "claimed"
    attempts?: number
    lockedUntil?: number
  } = {},
) {
  const now = Date.now()
  return await t.run(async (ctx) => {
    const profileId = await ctx.db.insert("userProfile", {
      userId: "user_delegated",
      profileType: "citizen",
      loa: 2,
      idnId: "GA-0001-0001",
      pivot: {
        firstName: "Jean",
        lastName: "Ondo",
        dateOfBirth: "1991-07-05",
        gender: "M",
        birthPlace: "Libreville",
        nationality: "GAB",
        nip: "A1B2C3D4E5F6G7",
      },
      createdAt: now,
      updatedAt: now,
    } as any)
    const id = await ctx.db.insert("delegatedIdentity", {
      appClientId: "app_1",
      operatorUserId: "operator_1",
      targetUserId: "user_delegated",
      targetProfileId: profileId,
      assignedLoa: 2,
      claimCodeHash: opts.codeHash,
      claimCodeExpiresAt: opts.expiresAt ?? now + 60_000,
      claimAttempts: opts.attempts ?? 0,
      claimLockedUntil: opts.lockedUntil,
      status: opts.status ?? "created",
      createdAt: now,
      updatedAt: now,
    })
    return { delegatedIdentityId: id, profileId }
  })
}

describe("verifyClaimCode", () => {
  test("accepte le bon code", async () => {
    const t = makeTestClient()
    const { code, codeHash } = await generateClaimCode()
    const { delegatedIdentityId } = await seedDelegation(t, { codeHash })

    const ok = await t.mutation(internal.delegate.mutations.verifyClaimCode, {
      delegatedIdentityId,
      claimCode: code,
    })
    expect(ok).toBe(true)
  })

  /**
   * LE test de la faille : posséder l'identifiant ne donne aucun droit. C'est
   * exactement ce que faisait l'ancien flux.
   */
  test("connaître le delegatedIdentityId sans le code ne suffit pas", async () => {
    const t = makeTestClient()
    const { codeHash } = await generateClaimCode()
    const { delegatedIdentityId } = await seedDelegation(t, { codeHash })

    const ok = await t.mutation(internal.delegate.mutations.verifyClaimCode, {
      delegatedIdentityId,
      claimCode: "0000-0000-0000",
    })
    expect(ok).toBe(false)
  })

  test("une identité sans code enregistré n'est pas réclamable", async () => {
    const t = makeTestClient()
    const { delegatedIdentityId } = await seedDelegation(t, {
      codeHash: undefined,
    })

    const ok = await t.mutation(internal.delegate.mutations.verifyClaimCode, {
      delegatedIdentityId,
      claimCode: "0000-0000-0000",
    })
    expect(ok).toBe(false)
  })

  test("une identité déjà réclamée refuse même le bon code (usage unique)", async () => {
    const t = makeTestClient()
    const { code, codeHash } = await generateClaimCode()
    const { delegatedIdentityId } = await seedDelegation(t, {
      codeHash,
      status: "claimed",
    })

    const ok = await t.mutation(internal.delegate.mutations.verifyClaimCode, {
      delegatedIdentityId,
      claimCode: code,
    })
    expect(ok).toBe(false)
  })

  test("un code expiré est refusé", async () => {
    const t = makeTestClient()
    const { code, codeHash } = await generateClaimCode()
    const { delegatedIdentityId } = await seedDelegation(t, {
      codeHash,
      expiresAt: Date.now() - 1,
    })

    const ok = await t.mutation(internal.delegate.mutations.verifyClaimCode, {
      delegatedIdentityId,
      claimCode: code,
    })
    expect(ok).toBe(false)
  })

  test("le brute-force est plafonné puis verrouillé, même avec le bon code ensuite", async () => {
    const t = makeTestClient()
    const { code, codeHash } = await generateClaimCode()
    const { delegatedIdentityId } = await seedDelegation(t, { codeHash })

    for (let i = 0; i < CLAIM_MAX_ATTEMPTS; i++) {
      const ok = await t.mutation(internal.delegate.mutations.verifyClaimCode, {
        delegatedIdentityId,
        claimCode: "0000-0000-0000",
      })
      expect(ok).toBe(false)
    }

    // Le verrou doit tenir même face au code LÉGITIME : sinon un attaquant
    // pourrait continuer à essayer, et le plafond ne servirait à rien.
    const afterLock = await t.mutation(
      internal.delegate.mutations.verifyClaimCode,
      { delegatedIdentityId, claimCode: code },
    )
    expect(afterLock).toBe(false)

    const row = await t.run(async (ctx) => ctx.db.get(delegatedIdentityId))
    expect(row?.claimAttempts).toBeGreaterThanOrEqual(CLAIM_MAX_ATTEMPTS)
    expect(row?.claimLockedUntil).toBeGreaterThan(Date.now())
  })

  test("un essai réussi remet le compteur à zéro (le citoyen légitime n'est pas puni)", async () => {
    const t = makeTestClient()
    const { code, codeHash } = await generateClaimCode()
    const { delegatedIdentityId } = await seedDelegation(t, {
      codeHash,
      attempts: CLAIM_MAX_ATTEMPTS - 1,
    })

    const ok = await t.mutation(internal.delegate.mutations.verifyClaimCode, {
      delegatedIdentityId,
      claimCode: code,
    })
    expect(ok).toBe(true)

    const row = await t.run(async (ctx) => ctx.db.get(delegatedIdentityId))
    expect(row?.claimAttempts).toBe(0)
  })

  test("chaque échec est tracé dans l'audit (détection des tentatives de vol)", async () => {
    const t = makeTestClient()
    const { codeHash } = await generateClaimCode()
    const { delegatedIdentityId } = await seedDelegation(t, { codeHash })

    await t.mutation(internal.delegate.mutations.verifyClaimCode, {
      delegatedIdentityId,
      claimCode: "0000-0000-0000",
    })

    const audit = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_target", (q) =>
          q.eq("targetType", "user").eq("targetId", "user_delegated"),
        )
        .collect(),
    )
    expect(audit.some((e) => e.action === "delegated_claim_code_failed")).toBe(
      true,
    )
  })
})

describe("claimDelegatedIdentity", () => {
  test("la réclamation détruit le code : il ne peut pas être rejoué", async () => {
    const t = makeTestClient()
    const { code, codeHash } = await generateClaimCode()
    const { delegatedIdentityId } = await seedDelegation(t, { codeHash })

    await t.mutation(internal.delegate.mutations.claimDelegatedIdentity, {
      delegatedIdentityId,
      pinHash: "deadbeef",
    })

    const row = await t.run(async (ctx) => ctx.db.get(delegatedIdentityId))
    expect(row?.status).toBe("claimed")
    expect(row?.claimCodeHash).toBeUndefined()
    expect(row?.initialSecret).toBeUndefined()

    const replay = await t.mutation(
      internal.delegate.mutations.verifyClaimCode,
      { delegatedIdentityId, claimCode: code },
    )
    expect(replay).toBe(false)
  })
})

describe("getClaimInfo", () => {
  test("n'expose aucun secret de compte", async () => {
    const t = makeTestClient()
    const { codeHash } = await generateClaimCode()
    const { delegatedIdentityId } = await seedDelegation(t, { codeHash })

    const info = await t.query(internal.delegate.queries.getClaimInfo, {
      id: delegatedIdentityId,
    })

    // `initialSecret` contenait le mot de passe du compte en clair : le
    // renvoyer faisait de cette query un vecteur de compromission directe.
    expect(info).not.toBeNull()
    expect(Object.keys(info!)).toEqual(
      expect.arrayContaining(["targetUserId", "targetProfileId", "status"]),
    )
    expect("initialSecret" in info!).toBe(false)
    expect("claimCodeHash" in info!).toBe(false)
  })
})

describe("migration des identités héritées", () => {
  /**
   * Le correctif ne doit pas se payer en identités perdues : celles créées
   * avant l'introduction du code n'en ont aucun, donc plus rien ne les rend
   * réclamables tant qu'un code n'a pas été réémis.
   */
  test("les identités sans code sont listables pour réémission", async () => {
    const t = makeTestClient()
    const { delegatedIdentityId } = await seedDelegation(t, {
      codeHash: undefined,
    })
    const { codeHash } = await generateClaimCode()
    await seedDelegation(t, { codeHash })

    const pending = await t.query(
      internal.delegate.mutations.listWithoutClaimCode,
      {},
    )
    expect(pending.map((p) => p.delegatedIdentityId)).toEqual([
      delegatedIdentityId,
    ])
  })

  test("la réémission rend l'identité réclamable et remet le quota à zéro", async () => {
    const t = makeTestClient()
    const { delegatedIdentityId } = await seedDelegation(t, {
      codeHash: undefined,
      attempts: CLAIM_MAX_ATTEMPTS,
      lockedUntil: Date.now() + 60_000,
    })

    const { code, codeHash } = await generateClaimCode()
    await t.mutation(internal.delegate.mutations.setClaimCodeHash, {
      delegatedIdentityId,
      claimCodeHash: codeHash,
      claimCodeExpiresAt: Date.now() + 60_000,
    })

    const ok = await t.mutation(internal.delegate.mutations.verifyClaimCode, {
      delegatedIdentityId,
      claimCode: code,
    })
    expect(ok).toBe(true)

    const row = await t.run(async (ctx) => ctx.db.get(delegatedIdentityId))
    expect(row?.claimAttempts).toBe(0)
    expect(row?.claimLockedUntil).toBeUndefined()
  })

  test("on ne réémet pas de code sur une identité déjà réclamée", async () => {
    const t = makeTestClient()
    const { delegatedIdentityId } = await seedDelegation(t, {
      status: "claimed",
    })
    const { codeHash } = await generateClaimCode()

    await expect(
      t.mutation(internal.delegate.mutations.setClaimCodeHash, {
        delegatedIdentityId,
        claimCodeHash: codeHash,
        claimCodeExpiresAt: Date.now() + 60_000,
      }),
    ).rejects.toThrow()
  })

  test("le secret hérité reste lisible pour la réclamation, mais après le code seulement", async () => {
    const t = makeTestClient()
    const { code, codeHash } = await generateClaimCode()
    const { delegatedIdentityId } = await seedDelegation(t, { codeHash })
    await t.run(async (ctx) => {
      await ctx.db.patch(delegatedIdentityId, {
        initialSecret: "ancien-mot-de-passe-aleatoire",
      })
    })

    // Le repli existe (sinon les comptes hérités sont irrécupérables)…
    expect(
      await t.query(internal.delegate.queries.getLegacyInitialSecret, {
        id: delegatedIdentityId,
      }),
    ).toBe("ancien-mot-de-passe-aleatoire")

    // …mais le chemin public reste gardé par le code.
    expect(
      await t.mutation(internal.delegate.mutations.verifyClaimCode, {
        delegatedIdentityId,
        claimCode: "0000-0000-0000",
      }),
    ).toBe(false)
    expect(
      await t.mutation(internal.delegate.mutations.verifyClaimCode, {
        delegatedIdentityId,
        claimCode: code,
      }),
    ).toBe(true)
  })
})

describe("purgeInitialSecrets", () => {
  test("efface les mots de passe en clair héritées de l'ancien flux", async () => {
    const t = makeTestClient()
    const { delegatedIdentityId } = await seedDelegation(t, {
      codeHash: "abc",
    })
    await t.run(async (ctx) => {
      await ctx.db.patch(delegatedIdentityId, {
        initialSecret: "mot-de-passe-en-clair",
      })
    })

    const { purged } = await t.mutation(
      internal.delegate.mutations.purgeInitialSecrets,
      {},
    )
    expect(purged).toBe(1)

    const row = await t.run(async (ctx) => ctx.db.get(delegatedIdentityId))
    expect(row?.initialSecret).toBeUndefined()
  })
})

describe("primitives de code (lib/claimCode)", () => {
  test("le code généré a la forme attendue et passe sa propre validation", async () => {
    const { code } = await generateClaimCode()
    expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/)
    expect(looksLikeClaimCode(code)).toBe(true)
  })

  test("deux codes générés diffèrent (pas de constante figée)", async () => {
    const a = await generateClaimCode()
    const b = await generateClaimCode()
    expect(a.code).not.toBe(b.code)
  })

  test("l'alphabet exclut les caractères confondables I, L, O, U", async () => {
    // 40 tirages : suffisant pour attraper un alphabet qui les réintroduirait.
    for (let i = 0; i < 40; i++) {
      const { code } = await generateClaimCode()
      expect(code).not.toMatch(/[ILOU]/)
    }
  })

  test("la saisie humaine est tolérée : casse, espaces, tirets, O/0 et I/1", async () => {
    const { code, codeHash } = await generateClaimCode()
    const mangled = code.toLowerCase().replace(/-/g, " ")
    expect(await hashClaimCode(mangled)).toBe(codeHash)
    // Un citoyen qui lit "0" comme "O" sur un papier imprimé ne doit pas être
    // bloqué sur un caractère que l'œil ne distingue pas.
    expect(normalizeClaimCode("O1IL")).toBe("0111")
  })

  test("la comparaison de hash rejette longueurs et contenus différents", () => {
    expect(timingSafeEqualHex("abcd", "abcd")).toBe(true)
    expect(timingSafeEqualHex("abcd", "abce")).toBe(false)
    expect(timingSafeEqualHex("abcd", "abcde")).toBe(false)
  })
})
