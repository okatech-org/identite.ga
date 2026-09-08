/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { internal } from "../_generated/api"
import schema from "../schema"

// Glob root-relative — cf. kyc/mutations.test.ts pour l'explication.
const modules = import.meta.glob("/convex/**/*.ts")

const INFERENCE_URL = "https://kyc-inference.internal"
const INFERENCE_SECRET = "test_secret_only_for_tests"
const FAKE_SA_KEY = JSON.stringify({
  client_email: "kyc-invoker@test-project.iam.gserviceaccount.com",
  private_key: "fake-key-not-a-real-credential",
})

// Mock `google-auth-library` — jamais de vrai réseau vers Google dans les
// tests. `getRequestHeaders` mime le header `Authorization: Bearer <idToken>`
// que la lib construit normalement à partir d'un ID token OIDC minté.
const getRequestHeadersMock = vi.fn(
  async () => new Headers({ Authorization: "Bearer fake-id-token" }),
)
const getIdTokenClientMock = vi.fn(async () => ({
  getRequestHeaders: getRequestHeadersMock,
}))
const googleAuthConstructorMock = vi.fn()
vi.mock("google-auth-library", () => ({
  GoogleAuth: vi.fn().mockImplementation((opts: unknown) => {
    googleAuthConstructorMock(opts)
    return { getIdTokenClient: getIdTokenClientMock }
  }),
}))

/**
 * `runOcr` / `runBiometric` appellent NOTRE microservice d'inférence
 * biométrique auto-hébergé (contrat documenté en tête de `kyc/actions.ts`).
 * Ces tests encodent le contrat exact (routes, body, mapping de la réponse,
 * signature sortante) — un service miroir mal implémenté doit faire échouer
 * ces tests, pas seulement une vérif manuelle.
 */

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  )
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function seedKyc(
  t: ReturnType<typeof convexTest>,
  opts: { front?: boolean; back?: boolean; selfie?: boolean } = {},
) {
  const { front = true, back = false, selfie = true } = opts
  return await t.run(async (ctx) => {
    const frontId = front
      ? await ctx.storage.store(new Blob(["front"]))
      : undefined
    const backId = back ? await ctx.storage.store(new Blob(["back"])) : undefined
    const selfieId = selfie
      ? await ctx.storage.store(new Blob(["selfie"]))
      : undefined
    const now = Date.now()
    return await ctx.db.insert("kycRequest", {
      userId: "user_1",
      documentType: "cni_gabon",
      documentImages: { front: frontId, back: backId },
      selfieImage: selfieId,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
    })
  })
}

describe("runOcr / runBiometric", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.KYC_INFERENCE_URL = INFERENCE_URL
    process.env.KYC_INFERENCE_SECRET = INFERENCE_SECRET
    delete process.env.KYC_INVOKER_SA_KEY
    delete process.env.KYC_INFERENCE_DISABLE_OIDC
    getRequestHeadersMock.mockClear()
    getIdTokenClientMock.mockClear()
    googleAuthConstructorMock.mockClear()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.unstubAllGlobals()
  })

  test("runOcr : POST /v1/ocr signé, body conforme au contrat, réponse mappée", async () => {
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)

    let capturedUrl = ""
    let capturedInit: RequestInit = {}
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      capturedUrl = url
      capturedInit = init
      return new Response(
        JSON.stringify({
          confidence: 0.95,
          fields: { lastName: "OBAME" },
          docAuthentic: true,
        }),
        { status: 200 },
      )
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await t.action(internal.kyc.actions.runOcr, {
      kycRequestId,
    })

    expect(capturedUrl).toBe(`${INFERENCE_URL}/v1/ocr`)
    const headers = capturedInit.headers as Record<string, string>
    expect(headers["X-Timestamp"]).toBeDefined()
    expect(Number.isNaN(Date.parse(headers["X-Timestamp"]))).toBe(false)

    const body = JSON.parse(capturedInit.body as string) as Record<
      string,
      unknown
    >
    expect(body.documentType).toBe("cni_gabon")
    expect(typeof body.frontImageUrl).toBe("string")
    expect(body.backImageUrl).toBeUndefined()

    // Signature exacte : HMAC-SHA256(hex) du body brut envoyé — vérifie que
    // le service miroir peut la recalculer à l'identique.
    const expectedSignature = await hmacSha256Hex(
      INFERENCE_SECRET,
      capturedInit.body as string,
    )
    expect(headers["X-Signature"]).toBe(expectedSignature)

    // Mapping { confidence, fields } → { confidence, extractedFields }.
    expect(result).toEqual({
      confidence: 0.95,
      extractedFields: { lastName: "OBAME" },
    })
  })

  test("runOcr : réponse HTTP non-OK (≠ 503) → throw (le workflow retry)", async () => {
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("server error", { status: 500 })),
    )

    await expect(
      t.action(internal.kyc.actions.runOcr, { kycRequestId }),
    ).rejects.toThrow()
  })

  test("runOcr : /v1/ocr renvoie 503 (moteur OCR désactivé) → dégrade vers confidence 0 SANS throw", async () => {
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ detail: "OCR engine unavailable" }), {
          status: 503,
        }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const result = await t.action(internal.kyc.actions.runOcr, {
      kycRequestId,
    })

    // Confiance à 0 → structurellement sous KYC_OCR_THRESHOLD, donc
    // `decideKycOutcome` ne peut jamais auto-approuver sur cette base : la
    // demande part en revue manuelle (cf. kyc/workflow.test.ts), pas un
    // échec de workflow après 3 retries.
    // `documentReuse: false` et non `undefined` : l'OCR n'ayant rien lu, il
    // n'y a pas de pièce à rapprocher — ce n'est pas une recherche qui aurait
    // échoué. La distinction compte : `undefined` force la revue manuelle.
    expect(result).toEqual({
      confidence: 0,
      extractedFields: {},
      documentReuse: false,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test("runBiometric : POST /v1/biometric signé, body conforme, réponse mappée", async () => {
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)

    let capturedUrl = ""
    let capturedInit: RequestInit = {}
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      capturedUrl = url
      capturedInit = init
      return new Response(
        JSON.stringify({ faceMatch: 0.82, liveness: "real", livenessScore: 0.91 }),
        { status: 200 },
      )
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await t.action(internal.kyc.actions.runBiometric, {
      kycRequestId,
    })

    expect(capturedUrl).toBe(`${INFERENCE_URL}/v1/biometric`)
    const body = JSON.parse(capturedInit.body as string) as Record<
      string,
      unknown
    >
    expect(typeof body.selfieUrl).toBe("string")
    expect(typeof body.docFaceUrl).toBe("string")

    // Mapping { faceMatch, liveness, livenessScore } → { faceMatch, liveness }
    // — `livenessScore` n'est pas répercuté (contrat interne actuel).
    //
    // Le service simulé ici ne renvoie PAS d'empreinte : c'est le cas d'un
    // service antérieur au déploiement de la déduplication. On doit alors
    // rendre `dedupAvailable: false`, que le workflow traduit en revue
    // manuelle. Rendre `true` avec `faceDuplicate: false` laisserait
    // auto-approuver des dossiers jamais confrontés à la galerie.
    expect(result).toEqual({
      faceMatch: 0.82,
      liveness: "real",
      faceDuplicate: false,
      dedupAvailable: false,
    })
  })

  test("runBiometric : verdict spoof répercuté tel quel", async () => {
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ faceMatch: 0.1, liveness: "spoof", livenessScore: 0.02 }),
            { status: 200 },
          ),
      ),
    )

    const result = await t.action(internal.kyc.actions.runBiometric, {
      kycRequestId,
    })
    expect(result).toEqual({
      faceMatch: 0.1,
      liveness: "spoof",
      faceDuplicate: false,
      dedupAvailable: false,
    })
  })

  test("runBiometric : /v1/biometric renvoie 503 → throw quand même (inchangé, retry workflow)", async () => {
    // Contrairement à `runOcr`, la dégradation 503 est SPÉCIFIQUE à l'OCR —
    // le face-match + liveness restent le cœur de la décision anti-fraude,
    // un 503 biométrique doit continuer à throw pour déclencher le retry.
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ detail: "unavailable" }), {
            status: 503,
          }),
      ),
    )

    await expect(
      t.action(internal.kyc.actions.runBiometric, { kycRequestId }),
    ).rejects.toThrow()
  })

  test("runBiometric : selfie manquant → throw sans appeler le service", async () => {
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t, { selfie: false })
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    await expect(
      t.action(internal.kyc.actions.runBiometric, { kycRequestId }),
    ).rejects.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  describe("défense en profondeur — ID token OIDC Cloud Run (KYC_INVOKER_SA_KEY)", () => {
    test("KYC_INVOKER_SA_KEY défini → Authorization: Bearer <idToken> ET headers HMAC présents, audience = URL racine", async () => {
      process.env.KYC_INVOKER_SA_KEY = FAKE_SA_KEY
      const t = convexTest(schema, modules)
      const kycRequestId = await seedKyc(t)

      let capturedInit: RequestInit = {}
      vi.stubGlobal(
        "fetch",
        vi.fn(async (_url: string, init: RequestInit) => {
          capturedInit = init
          return new Response(
            JSON.stringify({ confidence: 0.9, fields: {} }),
            { status: 200 },
          )
        }),
      )

      await t.action(internal.kyc.actions.runOcr, { kycRequestId })

      const headers = capturedInit.headers as Record<string, string>
      // Les deux couches coexistent : HMAC applicatif + OIDC Cloud Run.
      expect(headers["X-Signature"]).toBeDefined()
      expect(headers["X-Timestamp"]).toBeDefined()
      expect(headers.Authorization).toBe("Bearer fake-id-token")

      // Audience OIDC = URL racine du service (pas le path `/v1/ocr`).
      expect(getIdTokenClientMock).toHaveBeenCalledWith(INFERENCE_URL)
    })

    test("KYC_INVOKER_SA_KEY absent → pas de header Authorization, dégrade vers HMAC seul (dev local)", async () => {
      const t = convexTest(schema, modules)
      const kycRequestId = await seedKyc(t)

      let capturedInit: RequestInit = {}
      vi.stubGlobal(
        "fetch",
        vi.fn(async (_url: string, init: RequestInit) => {
          capturedInit = init
          return new Response(
            JSON.stringify({ confidence: 0.9, fields: {} }),
            { status: 200 },
          )
        }),
      )

      await t.action(internal.kyc.actions.runOcr, { kycRequestId })

      const headers = capturedInit.headers as Record<string, string>
      expect(headers["X-Signature"]).toBeDefined()
      expect(headers.Authorization).toBeUndefined()
      expect(getIdTokenClientMock).not.toHaveBeenCalled()
    })

    test("KYC_INFERENCE_DISABLE_OIDC=true → conserve le HMAC mais omet OIDC même si la clé SA existe", async () => {
      process.env.KYC_INVOKER_SA_KEY = FAKE_SA_KEY
      process.env.KYC_INFERENCE_DISABLE_OIDC = "true"
      const t = convexTest(schema, modules)
      const kycRequestId = await seedKyc(t)

      let capturedInit: RequestInit = {}
      vi.stubGlobal(
        "fetch",
        vi.fn(async (_url: string, init: RequestInit) => {
          capturedInit = init
          return new Response(JSON.stringify({ confidence: 0.9, fields: {} }), {
            status: 200,
          })
        }),
      )

      await t.action(internal.kyc.actions.runOcr, { kycRequestId })

      const headers = capturedInit.headers as Record<string, string>
      expect(headers["X-Signature"]).toBeDefined()
      expect(headers["X-Timestamp"]).toBeDefined()
      expect(headers.Authorization).toBeUndefined()
      expect(getIdTokenClientMock).not.toHaveBeenCalled()
    })
  })
})

/**
 * CE QUI EST EN JEU : la déduplication biométrique est la seule couche qui
 * résiste au changement de nom, de date de naissance ET de document. C'est
 * elle qui attrape le cas décrit — quelqu'un qui se réinscrit avec d'autres
 * informations et une autre adresse.
 *
 * Deux erreurs la rendraient inutile sans jamais lever d'exception. Se trouver
 * soi-même mettrait chaque dossier en revue et noierait le signal. Ne pas
 * exclure ses propres dossiers antérieurs signalerait comme doublon tout
 * citoyen qui resoumet après un rejet.
 */
describe("déduplication biométrique 1:N", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.KYC_INFERENCE_URL = INFERENCE_URL
    process.env.KYC_INFERENCE_SECRET = INFERENCE_SECRET
    delete process.env.KYC_INVOKER_SA_KEY
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.unstubAllGlobals()
  })

  /** Vecteur unitaire de dimension 512 dont le cosinus avec `unit(0)` est
   *  exactement `cos(theta)` — ce qui rend le seuil testable sans modèle. */
  function unitVector(theta: number): number[] {
    const v = new Array(512).fill(0)
    v[0] = Math.cos(theta)
    v[1] = Math.sin(theta)
    return v
  }

  async function seedGalleryTemplate(
    t: ReturnType<typeof convexTest>,
    opts: { userId: string; embedding: number[]; active?: boolean },
  ) {
    await t.run(async (ctx) => {
      const kycId = await ctx.db.insert("kycRequest", {
        userId: opts.userId,
        documentType: "cni_gabon",
        documentImages: {},
        status: "approved",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
      const active = opts.active ?? true
      await ctx.db.insert("faceTemplate", {
        userId: opts.userId,
        kycRequestId: kycId,
        embedding: opts.embedding,
        modelVersion: "buffalo_l",
        gallery: `buffalo_l|${active ? "active" : "pending"}`,
        active,
        createdAt: Date.now(),
      })
    })
  }

  function mockBiometric(embedding: number[]) {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              faceMatch: 0.9,
              liveness: "real",
              livenessScore: 0.9,
              embedding,
              embeddingModel: "buffalo_l",
            }),
            { status: 200 },
          ),
      ),
    )
  }

  test("un visage déjà en galerie sous un AUTRE compte est signalé", async () => {
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)
    // Cosinus ≈ 0.966, au-dessus du seuil par défaut (0.5).
    await seedGalleryTemplate(t, {
      userId: "autre_citoyen",
      embedding: unitVector(0),
    })
    mockBiometric(unitVector(Math.PI / 12))

    const result = await t.action(internal.kyc.actions.runBiometric, {
      kycRequestId,
    })
    expect(result.dedupAvailable).toBe(true)
    expect(result.faceDuplicate).toBe(true)

    const flags = await t.run(async (ctx) =>
      ctx.db
        .query("duplicateSignal")
        .withIndex("by_userId", (q) => q.eq("userId", "user_1"))
        .collect(),
    )
    expect(flags).toHaveLength(1)
    expect(flags[0]!.signal).toBe("face")
    expect(flags[0]!.matchedUserId).toBe("autre_citoyen")
    expect(flags[0]!.score).toBeGreaterThan(0.9)
  })

  test("un visage éloigné ne déclenche rien", async () => {
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)
    await seedGalleryTemplate(t, {
      userId: "autre_citoyen",
      embedding: unitVector(0),
    })
    // Orthogonal : cosinus 0, très en dessous du seuil.
    mockBiometric(unitVector(Math.PI / 2))

    const result = await t.action(internal.kyc.actions.runBiometric, {
      kycRequestId,
    })
    expect(result.faceDuplicate).toBe(false)
  })

  test("on ne se signale pas soi-même", async () => {
    // POURQUOI : un citoyen qui resoumet un dossier après un rejet présente le
    // même visage. Le compter comme doublon condamnerait toute reprise.
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)
    await seedGalleryTemplate(t, {
      userId: "user_1", // le propriétaire du dossier courant
      embedding: unitVector(0),
    })
    mockBiometric(unitVector(0))

    const result = await t.action(internal.kyc.actions.runBiometric, {
      kycRequestId,
    })
    expect(result.faceDuplicate).toBe(false)
  })

  test("une empreinte hors galerie ne sert pas de référence", async () => {
    // POURQUOI : tant qu'un dossier n'est pas approuvé, rien ne dit que ce
    // visage corresponde à une identité réelle.
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)
    await seedGalleryTemplate(t, {
      userId: "autre_citoyen",
      embedding: unitVector(0),
      active: false,
    })
    mockBiometric(unitVector(0))

    const result = await t.action(internal.kyc.actions.runBiometric, {
      kycRequestId,
    })
    expect(result.faceDuplicate).toBe(false)
  })

  test("l'empreinte du dossier est déposée hors galerie, une seule fois", async () => {
    // POURQUOI : déposer AVANT de chercher ferait se trouver soi-même à 1.0 ;
    // déposer en galerie ferait référence à un dossier non approuvé ; déposer
    // deux fois au rejeu d'un step empilerait les empreintes.
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)
    mockBiometric(unitVector(0))

    await t.action(internal.kyc.actions.runBiometric, { kycRequestId })
    await t.action(internal.kyc.actions.runBiometric, { kycRequestId })

    const templates = await t.run(async (ctx) =>
      ctx.db
        .query("faceTemplate")
        .withIndex("by_userId", (q) => q.eq("userId", "user_1"))
        .collect(),
    )
    expect(templates).toHaveLength(1)
    expect(templates[0]!.active).toBe(false)
  })

  test("un service sans empreinte rend la déduplication indisponible", async () => {
    // POURQUOI : le service peut être antérieur au déploiement. On doit alors
    // dire « je n'ai pas cherché », pas « je n'ai rien trouvé ».
    const t = convexTest(schema, modules)
    const kycRequestId = await seedKyc(t)
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              faceMatch: 0.9,
              liveness: "real",
              livenessScore: 0.9,
            }),
            { status: 200 },
          ),
      ),
    )

    const result = await t.action(internal.kyc.actions.runBiometric, {
      kycRequestId,
    })
    expect(result.dedupAvailable).toBe(false)
  })
})
