/// <reference types="vite/client" />
import { ConvexError } from "convex/values"
import { convexTest } from "convex-test"
import { beforeEach, describe, expect, test, vi } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

// Cf. kyc/mutations.test.ts pour l'explication du glob root-relative.
const modules = import.meta.glob("/convex/**/*.ts")

/**
 * `documents.sign` / `documents.verifySignature` s'authentifient (pour
 * `sign`) via `requireVerifiedAuth` (convex/lib/auth.ts), qui délègue en
 * prod à la session Better Auth. Reproduire une session Better Auth valide
 * dans convex-test demanderait de seeder les tables internes du composant
 * (hors de portée de ce test, cf. iboite/messages.test.ts) — on stub donc
 * `requireVerifiedAuth` pour dériver l'identité de `ctx.auth.getUserIdentity()`
 * (piloté par `t.withIdentity({ subject })`), ce qui est le seul levier dont
 * on a besoin pour vérifier l'invariant d'ownership de ce module.
 */
vi.mock("./lib/auth", async () => {
  const { ConvexError: CE } = await import("convex/values")
  return {
    requireVerifiedAuth: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string; email?: string } | null> }
    }) => {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) {
        throw new CE({
          code: "UNAUTHENTICATED",
          message: "Vous devez être connecté.",
        })
      }
      return {
        userId: identity.subject,
        email: identity.email ?? `${identity.subject}@idn.ga`,
        emailVerified: true,
        roles: [],
      }
    },
    getCurrentAuthUser: async () => null,
  }
})

function makeTestClient() {
  return convexTest(schema, modules)
}

/** Keypair RS256 dédié généré à la volée (WebCrypto pur) — cf. documentSigning.test.ts. */
async function seedSigningKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )
  const toB64 = (buf: ArrayBuffer) => {
    let bin = ""
    const bytes = new Uint8Array(buf)
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
    return btoa(bin)
  }
  process.env.DOCUMENT_SIGNING_PRIVATE_KEY = toB64(
    await crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  )
  process.env.DOCUMENT_SIGNING_PUBLIC_KEY = toB64(
    await crypto.subtle.exportKey("spki", keyPair.publicKey),
  )
}

beforeEach(async () => {
  await seedSigningKeyPair()
})

async function seedOwnedDocument(
  t: ReturnType<typeof convexTest>,
  userId: string,
  content = "contenu du document",
) {
  return await t.run(async (ctx) => {
    const contentRef = await ctx.storage.store(new Blob([content]))
    const now = Date.now()
    const itemId = await ctx.db.insert("documentItem", {
      userId,
      folderId: "identity",
      contentRef,
      name: "Attestation de résidence",
      mimeType: "application/pdf",
      fileType: "pdf",
      fileSize: content.length,
      status: "verified",
      createdAt: now,
      updatedAt: now,
    })
    return itemId
  })
}

async function seedProfile(t: ReturnType<typeof convexTest>, userId: string) {
  await t.run(async (ctx) => {
    await ctx.db.insert("userProfile", {
      userId,
      profileType: "citizen",
      loa: 2,
      idnId: "GA-1234-5678",
      pivot: {
        firstName: "Jean",
        lastName: "Ondo",
        dateOfBirth: "1990-01-01",
        gender: "M",
        birthPlace: "Libreville",
        nationality: "GA",
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any)
  })
}

describe("documents.sign / documents.verifySignature", () => {
  test("signer son document puis le vérifier renvoie valid=true avec la bonne identité (pas de PII superflue)", async () => {
    const t = makeTestClient()
    const userId = "user_owner"
    await seedProfile(t, userId)
    const itemId = await seedOwnedDocument(t, userId)

    const asOwner = t.withIdentity({ subject: userId })
    const signed = await asOwner.mutation(api.documents.sign, { itemId })
    expect(signed.signature).toEqual(expect.any(String))
    expect(signed.sha256).toEqual(expect.any(String))

    const result = await t.query(api.documents.verifySignature, {
      id: signed.signatureId,
    })
    expect(result.valid).toBe(true)
    expect(result.signerIdentity).toEqual({
      name: "Jean Ondo",
      idnId: "GA-1234-5678",
    })
    expect(result.signedAt).toBe(signed.signedAt)
    expect(result.documentHash).toBe(signed.sha256)
    // Pas de PII au-delà du nécessaire : ni email, ni date de naissance, ni NIP.
    expect(Object.keys(result)).toEqual(
      expect.arrayContaining(["valid", "signerIdentity", "signedAt", "documentHash", "documentName"]),
    )
    expect(JSON.stringify(result)).not.toMatch(/1990-01-01|@idn\.ga/)

    // La query de vérification est publique — aucune identité requise.
    const resultViaToken = await t.query(api.documents.verifySignature, {
      token: signed.signature,
    })
    expect(resultViaToken.valid).toBe(true)
  })

  test("document altéré après signature (contentRef remplacé) → valid=false", async () => {
    const t = makeTestClient()
    const userId = "user_owner_2"
    await seedProfile(t, userId)
    const itemId = await seedOwnedDocument(t, userId, "version originale")

    const asOwner = t.withIdentity({ subject: userId })
    const signed = await asOwner.mutation(api.documents.sign, { itemId })

    // Simule une altération du document : le blob référencé change après
    // la signature (le hash embarqué dans le JWT ne correspond plus au
    // contenu courant).
    await t.run(async (ctx) => {
      const newRef = await ctx.storage.store(new Blob(["version modifiée"]))
      await ctx.db.patch(itemId, { contentRef: newRef })
    })

    const result = await t.query(api.documents.verifySignature, {
      id: signed.signatureId,
    })
    expect(result.valid).toBe(false)
    expect(result.signerIdentity).toBeUndefined()
  })

  test("un user ne peut signer que ses propres documents (ownership)", async () => {
    const t = makeTestClient()
    const owner = "user_owner_3"
    const attacker = "user_attacker"
    await seedProfile(t, owner)
    const itemId = await seedOwnedDocument(t, owner)

    const asAttacker = t.withIdentity({ subject: attacker })
    await expect(
      asAttacker.mutation(api.documents.sign, { itemId }),
    ).rejects.toThrow(ConvexError)
  })

  test("vérification avec un id de signature inconnu → valid=false (pas de throw)", async () => {
    const t = makeTestClient()
    const userId = "user_owner_4"
    await seedProfile(t, userId)
    const itemId = await seedOwnedDocument(t, userId)
    const asOwner = t.withIdentity({ subject: userId })
    await asOwner.mutation(api.documents.sign, { itemId })

    const result = await t.query(api.documents.verifySignature, {
      token: "not-a-real-token",
    })
    expect(result.valid).toBe(false)
  })
})
