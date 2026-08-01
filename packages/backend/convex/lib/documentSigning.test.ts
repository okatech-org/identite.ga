import { beforeEach, describe, expect, test } from "vitest"

import {
  currentKeyId,
  getPublicJwks,
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
  const keys = { privateKey: toB64(pkcs8), publicKey: toB64(spki) }
  process.env.DOCUMENT_SIGNING_PRIVATE_KEY = keys.privateKey
  process.env.DOCUMENT_SIGNING_PUBLIC_KEY = keys.publicKey
  return keys
}

beforeEach(async () => {
  // Env repartie de zéro : `currentKeyId()` et les clés retirées sont lus
  // dans process.env à chaque appel, une fuite entre tests masquerait un bug
  // de résolution de kid.
  delete process.env.DOCUMENT_SIGNING_KEY_ID
  delete process.env.DOCUMENT_SIGNING_RETIRED_KEYS
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

  test("la JWKS expose le kid courant et l'algorithme RS256 (nécessaire pour qu'un tiers résolve la bonne clé)", async () => {
    const [jwk] = await getPublicJwks()
    expect(jwk!.kid).toBe(currentKeyId())
    expect(jwk!.alg).toBe("RS256")
    expect(jwk!.kty).toBe("RSA")
  })
})

/**
 * Une attestation de signature ne vaut que si elle reste vérifiable dans la
 * durée. Une rotation de keypair ne doit donc JAMAIS invalider les documents
 * déjà signés : c'est l'intention métier que ces tests protègent. Sans la
 * résolution par `kid` + la liste des clés retirées, la rotation détruisait
 * silencieusement la valeur juridique de tout l'historique.
 */
describe("rotation de clé", () => {
  async function rotate() {
    const oldPublicKey = process.env.DOCUMENT_SIGNING_PUBLIC_KEY!
    const oldKid = currentKeyId()
    await seedKeyPair() // nouveau keypair courant
    process.env.DOCUMENT_SIGNING_KEY_ID = "doc-sign-2"
    process.env.DOCUMENT_SIGNING_RETIRED_KEYS = JSON.stringify([
      { kid: oldKid, publicKey: oldPublicKey },
    ])
    return { oldKid }
  }

  test("un document signé AVANT la rotation reste vérifiable APRÈS", async () => {
    const token = await signDocument({
      sub: "user_1",
      name: "Jean Ondo",
      hash: "hash-avant-rotation",
      iat: 1_700_000_000_000,
    })

    await rotate()

    const result = await verifyDocumentToken(token)
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.payload.hash).toBe("hash-avant-rotation")
  })

  test("après rotation, les nouvelles signatures portent le nouveau kid et se vérifient", async () => {
    await rotate()
    const token = await signDocument({
      sub: "user_2",
      name: "Awa Nzé",
      hash: "hash-apres-rotation",
      iat: 1_700_000_001_000,
    })

    const header = JSON.parse(
      atob(token.split(".")[0]!.replaceAll("-", "+").replaceAll("_", "/")),
    )
    expect(header.kid).toBe("doc-sign-2")
    await expect(verifyDocumentToken(token)).resolves.toMatchObject({
      valid: true,
    })
  })

  test("la JWKS sert la clé courante ET les clés retirées (sinon l'historique devient invérifiable côté tiers)", async () => {
    const { oldKid } = await rotate()
    const jwks = await getPublicJwks()
    expect(jwks.map((k) => k.kid)).toEqual(["doc-sign-2", oldKid])
    // Deux modules RSA distincts : on n'expose pas deux fois la même clé sous
    // deux kid différents.
    expect(jwks[0]!.n).not.toBe(jwks[1]!.n)
  })

  test("un kid inconnu est rejeté sans repli sur la clé courante", async () => {
    const token = await signDocument({
      sub: "user_3",
      name: "Paul Mba",
      hash: "hash",
      iat: 1_700_000_002_000,
    })
    // Réécrit le header avec un kid jamais émis, en gardant la signature :
    // un vérificateur qui se replierait sur la clé courante l'accepterait.
    const [, payloadEncoded, sigEncoded] = token.split(".")
    const encode = (obj: unknown) =>
      btoa(JSON.stringify(obj))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replace(/=+$/, "")
    const forged = `${encode({ alg: "RS256", typ: "JWT", kid: "doc-sign-99" })}.${payloadEncoded}.${sigEncoded}`

    await expect(verifyDocumentToken(forged)).resolves.toEqual({ valid: false })
  })

  test("DOCUMENT_SIGNING_RETIRED_KEYS malformée échoue fort plutôt que de perdre silencieusement l'historique", async () => {
    process.env.DOCUMENT_SIGNING_RETIRED_KEYS = "{pas-du-json"
    // Le kid courant n'a pas besoin de la liste : ce chemin reste OK.
    const token = await signDocument({
      sub: "user_4",
      name: "Awa Nzé",
      hash: "hash",
      iat: 1_700_000_003_000,
    })
    await expect(verifyDocumentToken(token)).resolves.toMatchObject({
      valid: true,
    })
    // Mais dès qu'il faut résoudre un kid retiré, la config casse bruyamment.
    await expect(getPublicJwks()).rejects.toThrow(/RETIRED_KEYS/)
  })
})
