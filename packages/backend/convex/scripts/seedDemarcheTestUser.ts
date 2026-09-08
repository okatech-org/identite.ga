import { ConvexError, v } from "convex/values"

import { components, internal } from "../_generated/api"
import { action, internalMutation } from "../_generated/server"
import { authComponent, createAuth } from "../auth"
import { generateIdnId } from "../lib/idnId"
import { derivePivotKeys } from "../lib/identity"

/**
 * Script de seed DEV — provisionne tout ce qu'il faut pour tester
 * « Se connecter avec identite.ga » depuis Démarche.ga (administration.ga,
 * app citoyenne `admin-gabon-citizen`, port 3000) :
 *
 *   1. un **client OAuth** sandbox (`oauthApplication`) pour Démarche.ga, avec
 *      les redirect URIs du backend Convex de demarche.ga + localhost ;
 *   2. un **utilisateur de test** complet (compte Better Auth + email vérifié +
 *      `userProfile` avec identité pivot + PIN à 6 chiffres) ;
 *   3. l'email du user ajouté à la **whitelist sandbox** de l'app (`testUsers`)
 *      ET défini comme propriétaire (`createdBy`/`userId`) — double garantie
 *      que le consentement OAuth est autorisé (cf. oauthAuthorize.userAllowed +
 *      auth.ts/getAdditionalUserInfoClaim).
 *
 * Idempotent : rejouable sans créer de doublon (upsert app + upsert profil ;
 * si l'email existe déjà on bascule sur signIn pour récupérer l'userId).
 * Secret client et PIN sont FIXES → l'env de demarche.ga reste valable entre
 * deux runs.
 *
 *   bunx convex run scripts/seedDemarcheTestUser:run
 *
 * Le retour contient `clientId`, `clientSecret` (clair), `discoveryUrl`, ainsi
 * que l'identifiant `email` + `pin` du compte de test.
 *
 * Implémenté en `action` : `auth.api.signUpEmail` déclenche le plugin
 * `haveIBeenPwned` (fetch HTTP interdit en mutation). Les écritures BD passent
 * par l'`internalMutation` `provision`.
 */

// ── Client OAuth Démarche.ga (dev local) ───────────────────────────────────
const CLIENT_ID = "demarche-ga-local"
// Secret FIXE en clair (dev local uniquement) — permet de garder l'env de
// demarche.ga (IDN_CLIENT_SECRET) stable entre deux seeds. C'est le secret que
// demarche.ga envoie au token endpoint.
//
// Stocké HACHÉ dans `oauthApplication.clientSecret` via `hashClientSecret`
// (base64url(SHA-256), même format que `developer/apps.ts` et que
// `defaultClientSecretHasher` de better-auth) : `oidcProvider` est configuré
// `storeClientSecret: "hashed"` (cf. auth.ts), donc il recompute ce hash au
// token endpoint pour comparer le secret reçu.
const CLIENT_SECRET_PLAIN = "idn_sk_test_demarcheGaLocalDev_v1"
const REDIRECT_URIS = [
  // redirect_uri par défaut de Better Auth genericOAuth côté demarche.ga :
  // `${CONVEX_SITE_URL}/api/auth/oauth2/callback/idn`.
  "https://clean-guineapig-897.eu-west-1.convex.site/api/auth/oauth2/callback/idn",
  // Filet : variante localhost si le callback transite par le proxy Next.js.
  "http://localhost:3000/api/auth/oauth2/callback/idn",
]
const SCOPES = ["openid", "profile", "email"]

// ── Utilisateur de test ─────────────────────────────────────────────────────
const TEST_EMAIL = "demarchetest@idn.ga"
// Handle de connexion sur identite.ga : `demarchetest` (ou `demarchetest@idn.ga`).
const TEST_PASSWORD = "Zr4t-Demarche-Local-9Kpx"
const TEST_PIN = "246813"
const TEST_NAME = "Citoyen Test Démarche"

/** Identique à onboarding.derivePinHash — PBKDF2-SHA256, 600k itérations. */
const derivePinHash = async (pin: string, userId: string): Promise<string> => {
  const salt = new TextEncoder().encode(`idn:pin:${userId}`)
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 600_000, hash: "SHA-256" },
    keyMaterial,
    256,
  )
  return [...new Uint8Array(bits)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * base64url(SHA-256(secret)) sans padding — identique à `hashClientSecret` de
 * developer/apps.ts et à `defaultClientSecretHasher` de better-auth. C'est le
 * format attendu par `oidcProvider({ storeClientSecret: "hashed" })`.
 */
const hashClientSecret = async (secret: string): Promise<string> => {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret) as BufferSource,
  )
  const bytes = new Uint8Array(buf)
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export const run = action({
  args: {},
  returns: v.object({
    userId: v.string(),
    email: v.string(),
    pin: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    discoveryUrl: v.string(),
  }),
  handler: async (ctx) => {
    // Garde-fou : interdit sur le déploiement de production IDN.
    const deployment = process.env.CONVEX_DEPLOYMENT ?? ""
    if (deployment.startsWith("prod:")) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "seedDemarcheTestUser est réservé aux déploiements dev.",
      })
    }

    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    let userId: string
    try {
      const result = await auth.api.signUpEmail({
        body: { email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME },
        headers,
      })
      userId = (result as { user?: { id?: string } })?.user?.id ?? ""
      if (!userId) throw new Error("Better Auth n'a pas renvoyé d'userId.")
    } catch (err) {
      // Re-run : l'email existe déjà → signIn pour récupérer l'userId.
      const message =
        err instanceof Error ? err.message : "Création utilisateur impossible."
      const isExisting =
        /already|exist|taken|in use/i.test(message) ||
        (err as { code?: string } | undefined)?.code === "USER_ALREADY_EXISTS"
      if (!isExisting) {
        throw new ConvexError({ code: "SIGNUP_FAILED", message })
      }
      const result = await auth.api.signInEmail({
        body: { email: TEST_EMAIL, password: TEST_PASSWORD },
        headers,
      })
      userId = (result as { user?: { id?: string } })?.user?.id ?? ""
      if (!userId) {
        throw new ConvexError({
          code: "USER_LOOKUP_FAILED",
          message: "Impossible de retrouver l'userId du compte de test.",
        })
      }
    }

    const pinHash = await derivePinHash(TEST_PIN, userId)

    await ctx.runMutation(internal.scripts.seedDemarcheTestUser.provision, {
      userId,
      email: TEST_EMAIL,
      pinHash,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET_PLAIN,
      redirectUris: REDIRECT_URIS,
      scopes: SCOPES,
    })

    const issuer = (
      process.env.CONVEX_SITE_URL ??
      "https://pleasant-platypus-379.eu-west-1.convex.site"
    ).replace(/\/+$/, "")

    return {
      userId,
      email: TEST_EMAIL,
      pin: TEST_PIN,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET_PLAIN,
      discoveryUrl: `${issuer}/api/auth/convex/.well-known/openid-configuration`,
    }
  },
})

type OAuthAppDoc = { _id: string }

export const provision = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    pinHash: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    redirectUris: v.array(v.string()),
    scopes: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now()
    const email = args.email.toLowerCase()

    // 1. Email vérifié par construction (le PIN sign-in refuse les non vérifiés).
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: args.userId, operator: "eq" }],
        update: { emailVerified: true, updatedAt: now },
      },
    })

    // 2. userProfile (identité pivot + PIN) — upsert.
    const pivot = {
      firstName: "Citoyen",
      lastName: "Test",
      dateOfBirth: "1990-01-15",
      gender: "M" as const,
      birthPlace: "Libreville",
      nationality: "GA",
    }
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique()
    if (profile) {
      await ctx.db.patch(profile._id, {
        pivot,
        ...derivePivotKeys(pivot),
        pinHash: args.pinHash,
        updatedAt: now,
      })
    } else {
      const idnId = await generateIdnId(ctx)
      await ctx.db.insert("userProfile", {
        userId: args.userId,
        profileType: "citizen",
        loa: 1,
        idnId,
        pivot,
        ...derivePivotKeys(pivot),
        pinHash: args.pinHash,
        createdAt: now,
        updatedAt: now,
      })
    }

    // 3. Client OAuth Démarche.ga — upsert dans `oauthApplication`.
    const metadata = JSON.stringify({
      env: "sandbox",
      loa: 1,
      description: "Démarche.ga — portail citoyen (dev local)",
      scopes: args.scopes,
      createdBy: args.userId,
      services: [],
      testUsers: [email],
      productionStatus: "none",
    })

    const found = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "oauthApplication",
      where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: OAuthAppDoc[] }
    const doc = found.page[0]

    const clientSecretHash = await hashClientSecret(args.clientSecret)
    const data = {
      clientId: args.clientId,
      clientSecret: clientSecretHash,
      name: "Démarche.ga (dev local)",
      userId: args.userId,
      // Better Auth oidc-provider lit les redirect URIs en CSV (.split(",")).
      redirectUrls: args.redirectUris.join(","),
      disabled: false,
      type: "web",
      metadata,
      updatedAt: now,
    }

    if (doc) {
      await ctx.runMutation(components.betterAuth.adapter.updateOne, {
        input: {
          model: "oauthApplication",
          where: [{ field: "_id", value: doc._id, operator: "eq" }],
          update: data,
        },
      })
    } else {
      await ctx.runMutation(components.betterAuth.adapter.create, {
        input: {
          model: "oauthApplication",
          data: { ...data, createdAt: now },
        },
      })
    }

    return null
  },
})
