import { beforeEach, describe, expect, test } from "vitest"

import {
  DOCUMENT_SIGNING_KEY_ID,
  getPublicJwk,
  signDocument,
  verifyDocumentToken,
} from "./documentSigning"

/**
 * `signDocument`/`verifyDocumentToken` sont les primitives WebCrypto pures
 * qui portent l'attestation « Signer un document » (RS256, PAS eIDAS
 * qualifiée — cf. documentSigning.ts pour le pourquoi de ce choix plutôt que
 * la JWKS better-auth `jwt`). Ces tests vérifient l'intention business : une
 * signature valide doit rester vérifiable, et TOUTE divergence du hash
 * embarqué (= le document a changé depuis la signature) doit invalider le
 * résultat — c'est la garantie d'intégrité que `documents.verifySignature`
 * s'appuie dessus pour détecter une altération.
 */

async function seedKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  )
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
  const spki = await crypto.subtle.exportKey("spki", keyPair.publicKey)
  const toB64 = (buf: ArrayBuffer) => {
    let bin = ""
    const bytes = new Uint8Array(buf)
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
    return btoa(bin)
  }
  process.env.DOCUMENT_SIGNING_PRIVATE_KEY = toB64(pkcs8)
  process.env.DOCUMENT_SIGNING_PUBLIC_KEY = toB64(spki)
}

beforeEach(async () => {
  await seedKeyPair()
})

describe("signDocument / verifyDocumentToken", () => {
  test("un JWT fraîchement signé se vérifie et restitue le payload exact", async () => {
    const token = await signDocument({
      sub: "user_1",
      name: "Jean Ondo",
      idnId: "GA-0001-0001",
      hash: "abc123",
      documentItemId: "doc_1",
      documentName: "Attestation de résidence",
      iat: 1_700_000_000_000,
    })

    const result = await verifyDocumentToken(token)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.payload).toMatchObject({
        sub: "user_1",
        name: "Jean Ondo",
        idnId: "GA-0001-0001",
        hash: "abc123",
      })
    }
  })

  test("un payload altéré (hash différent injecté après coup) casse la signature RS256", async () => {
    const token = await signDocument({
      sub: "user_1",
      name: "Jean Ondo",
      hash: "original-hash",
      iat: 1_700_000_000_000,
    })

    // Simule une falsification : on décode le payload, on change le hash, on
    // ré-encode SANS re-signer (ce qu'un attaquant sans la clé privée peut
    // faire) — la signature RS256 ne doit plus matcher.
    const [headerEncoded, payloadEncoded, sigEncoded] = token.split(".")
    const decode = (s: string) => JSON.parse(atob(s.replaceAll("-", "+").replaceAll("_", "/")))
    const encode = (obj: unknown) =>
      btoa(JSON.stringify(obj)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")
    const tamperedPayload = { ...decode(payloadEncoded!), hash: "tampered-hash" }
    const tamperedToken = `${headerEncoded}.${encode(tamperedPayload)}.${sigEncoded}`

    const result = await verifyDocumentToken(tamperedToken)
    expect(result.valid).toBe(false)
  })

  test("un token malformé (mauvais nombre de segments) est rejeté sans throw", async () => {
    await expect(verifyDocumentToken("not-a-jwt")).resolves.toEqual({ valid: false })
  })

  test("getPublicJwk expose le kid courant et l'algorithme RS256 (nécessaire pour qu'un tiers résolve la bonne clé)", async () => {
    const jwk = await getPublicJwk()
    expect(jwk.kid).toBe(DOCUMENT_SIGNING_KEY_ID)
    expect(jwk.alg).toBe("RS256")
    expect(jwk.kty).toBe("RSA")
  })
})
