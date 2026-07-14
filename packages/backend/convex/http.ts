import { httpRouter } from "convex/server"

import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"
import { authenticateApiKey } from "./developer/apiKeys"
import { createAuth } from "./auth"
import { resend } from "./email/provider"
import { getPublicJwk } from "./lib/documentSigning"

const http = httpRouter()

const AUTH_PATH = "/api/auth"

// Routes Better Auth — /api/auth/* (sign-in/sign-up/sign-out, OTP, OIDC,
// JWKS, userinfo, etc.). Enregistrement manuel (au lieu de
// `authComponent.registerRoutes`) pour passer le header Origin de la
// requête à `createAuth`. Le plugin crossDomain peut alors renvoyer les
// callbacks vers l'origin de l'app appelante (web / admin / developer /
// controller).
//
// Le plugin `oidcProvider` de better-auth/plugins expose automatiquement
// ses routes sous `/api/auth/oauth2/*` (authorize, token, callback) et
// le discovery sous `/api/auth/.well-known/openid-configuration`. Pas
// besoin de monter des handlers custom — tout est servi par
// `auth.handler(request)`.
const authRequestHandler = httpAction(async (ctx, request) => {
  const origin = request.headers.get("origin")
  const auth = createAuth(ctx, origin)
  return await auth.handler(request)
})

// Override du discovery OIDC : @convex-dev/better-auth instancie en interne
// sa propre oidcProvider (sans useJWTPlugin: true ni notre metadata custom),
// donc le JSON servi sous /api/auth/convex/.well-known/openid-configuration
// annonce HS256 alors qu'on signe en RS256 via le plugin jwt. On intercepte
// la route exacte (prioritaire sur le pathPrefix) et on appelle l'instance
// oidcProvider qu'on configure dans auth.ts.
// Claims étendus IDN exposés sous scope "profile" en plus des claims
// standards Better Auth. Maintenus en un seul endroit (utilisés à la fois
// par le handler /userinfo pour les valeurs et par le discovery pour la
// liste `claims_supported`).
const IDN_EXTENDED_CLAIMS = [
  "given_name",
  "family_name",
  "birthdate",
  "nationality",
  "profile_type",
  "acr",
  "loa",
  "nip",
] as const

const loaToAcr = (loa: number): string =>
  loa === 3 ? "eidas3" : loa === 2 ? "eidas2" : "eidas1"

// Base de l'app web identite.ga (flux KYC sous /kyc) — pour construire le
// `action_url` renvoyé aux apps tierces dans /verification. Même fallback que
// `getSiteUrl` dans auth.ts.
const siteUrl = (): string =>
  (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "")

// Valide le Bearer access token via Better Auth (réutilise l'endpoint
// /oauth2/userinfo qui gère la validation 401/403) et renvoie le `sub`.
// Renvoie soit `{ sub }`, soit `{ error }` (la Response 401/403 à propager).
const validateBearerSub = async (
  auth: ReturnType<typeof createAuth>,
  request: Request,
): Promise<{ sub: string } | { error: Response }> => {
  const api = auth.api as unknown as {
    oAuth2userInfo: (input: {
      headers: Headers
      request: Request
      asResponse: true
    }) => Promise<Response>
  }
  let res: Response
  try {
    res = await api.oAuth2userInfo({
      headers: request.headers,
      request,
      asResponse: true,
    })
  } catch (err) {
    if (err instanceof Response) return { error: err }
    throw err
  }
  if (!res.ok) return { error: res }
  const claims = (await res.json()) as { sub?: unknown }
  if (typeof claims.sub !== "string") {
    return {
      error: new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    }
  }
  return { sub: claims.sub }
}

// GET /api/auth/oauth2/verification — statut de vérification d'identité,
// interrogeable par une app tierce avec l'access token de l'utilisateur.
// Contrairement au claim `loa` (figé au login), reflète l'état vivant d'une
// demande KYC (en cours / action requise / refusée). Cf. verification.ts.
const verificationHandler = httpAction(async (ctx, request) => {
  const origin = request.headers.get("origin")
  const auth = createAuth(ctx, origin)

  const validated = await validateBearerSub(auth, request)
  if ("error" in validated) return validated.error

  const status = await ctx.runQuery(internal.verification.getStatusForUser, {
    userId: validated.sub,
  })

  const body = {
    loa: status.loa,
    acr: loaToAcr(status.loa),
    verified: status.loa >= 2,
    verification: {
      status: status.status,
      action_required: status.actionRequired,
      action_url: `${siteUrl()}/kyc`,
      message: status.message,
      updated_at: status.updatedAt,
    },
  }

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
})

// Override du discovery OIDC : @convex-dev/better-auth instancie en interne
// sa propre oidcProvider (sans useJWTPlugin: true ni notre metadata custom),
// donc le JSON servi sous /api/auth/convex/.well-known/openid-configuration
// annonce HS256 alors qu'on signe en RS256 via le plugin jwt. On intercepte
// la route exacte (prioritaire sur le pathPrefix) et on appelle l'instance
// oidcProvider qu'on configure dans auth.ts. On en profite pour étendre
// `claims_supported` avec les claims IDN qu'on injecte dans /userinfo.
const oidcDiscoveryHandler = httpAction(async (ctx, request) => {
  const origin = request.headers.get("origin")
  const auth = createAuth(ctx, origin)
  const api = auth.api as unknown as {
    getOpenIdConfig: (input: {
      asResponse: false
    }) => Promise<Record<string, unknown>>
  }
  const metadata = await api.getOpenIdConfig({ asResponse: false })
  const baseClaims = Array.isArray(metadata.claims_supported)
    ? (metadata.claims_supported as string[])
    : []
  const patched = {
    ...metadata,
    id_token_signing_alg_values_supported: ["RS256"],
    claims_supported: Array.from(
      new Set([...baseClaims, ...IDN_EXTENDED_CLAIMS]),
    ),
    acr_values_supported: ["eidas1", "eidas2", "eidas3"],
  }
  return new Response(JSON.stringify(patched), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
})

// Enrichissement de /oauth2/userinfo : Better Auth n'expose que les champs
// de la table user de son composant (sub, email, name, picture, email_verified
// + un given_name/family_name fait via `name.split(" ")`, souvent faux pour
// les noms composés). Le NIP et l'identité pivot IDN sont dans la table
// `userProfile` côté Convex. On délègue la validation du token à Better Auth
// (call de l'endpoint original) puis on lookup `userProfile` par sub et on
// merge les claims étendus.
const userinfoHandler = httpAction(async (ctx, request) => {
  const origin = request.headers.get("origin")
  const auth = createAuth(ctx, origin)
  const api = auth.api as unknown as {
    oAuth2userInfo: (input: {
      headers: Headers
      request: Request
      asResponse: true
    }) => Promise<Response>
  }

  // Better Auth gère la validation du Bearer token (401/403 si invalide ou
  // expiré). Le handler upstream check `ctx.request` (pas juste headers) —
  // il faut lui passer le Request object complet.
  let baseRes: Response
  try {
    baseRes = await api.oAuth2userInfo({
      headers: request.headers,
      request,
      asResponse: true,
    })
  } catch (err) {
    if (err instanceof Response) return err
    throw err
  }

  if (!baseRes.ok) return baseRes

  const baseClaims = (await baseRes.json()) as Record<string, unknown> & {
    sub?: string
  }
  const sub = typeof baseClaims.sub === "string" ? baseClaims.sub : null
  if (!sub) {
    return new Response(JSON.stringify(baseClaims), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  const profile = await ctx.runQuery(internal.profile.getForUserinfo, {
    userId: sub,
  })

  if (!profile) {
    return new Response(JSON.stringify(baseClaims), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  const pivot = profile.pivot
  const enriched: Record<string, unknown> = {
    ...baseClaims,
    profile_type: profile.profileType,
    loa: profile.loa,
    acr: loaToAcr(profile.loa),
    ...(pivot
      ? {
          given_name: pivot.firstName,
          family_name: pivot.lastName,
          birthdate: pivot.dateOfBirth,
          nationality: pivot.nationality,
          ...(pivot.nip ? { nip: pivot.nip } : {}),
        }
      : {}),
  }

  return new Response(JSON.stringify(enriched), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
})

http.route({
  path: `${AUTH_PATH}/convex/.well-known/openid-configuration`,
  method: "GET",
  handler: oidcDiscoveryHandler,
})

http.route({
  path: `${AUTH_PATH}/oauth2/userinfo`,
  method: "GET",
  handler: userinfoHandler,
})

http.route({
  path: `${AUTH_PATH}/oauth2/verification`,
  method: "GET",
  handler: verificationHandler,
})

// POST /api/partner/citizens/resolve — annuaire partenaire.
// Authentifié par clé API M2M (Authorization: Bearer <token>) avec le scope
// `citizens:resolve`. Permet à une app relying party autorisée de retrouver
// une identité par NIP / alias @idn.ga / Nom (cf. partner/citizens.ts).
// HORS session OAuth : sert l'enrôlement d'agents (l'app n'a pas l'access
// token de la personne recherchée, seulement l'un de ses identifiants).
const partnerResolveHandler = httpAction(async (ctx, request) => {
  const principal = await authenticateApiKey(ctx, request)
  if (!principal) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  if (!principal.scopes.includes("citizens:resolve")) {
    return new Response(JSON.stringify({ error: "insufficient_scope" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const str = (x: unknown) =>
    typeof x === "string" && x.trim() ? x.trim() : undefined
  const sub = str(b.sub)
  const nip = str(b.nip)
  const emailAlias = str(b.emailAlias)
  const name = str(b.name)
  const limit = typeof b.limit === "number" ? b.limit : undefined

  if (!sub && !nip && !emailAlias && !name) {
    return new Response(
      JSON.stringify({ error: "missing_query", message: "sub | nip | emailAlias | name requis" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const results = await ctx.runQuery(internal.partner.citizens.resolveDirectory, {
    sub,
    nip,
    emailAlias,
    name,
    limit,
  })

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})

http.route({
  path: "/api/partner/citizens/resolve",
  method: "POST",
  handler: partnerResolveHandler,
})

// ---------------------------------------------------------------------------
// POST /api/delegate/lookup — recherche d'un citoyen avant création déléguée.
// Authentifié par clé API M2M avec le scope `idn:delegate:lookup`.
// ---------------------------------------------------------------------------
const delegateLookupHandler = httpAction(async (ctx, request) => {
  const principal = await authenticateApiKey(ctx, request)
  if (!principal) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  if (!principal.scopes.includes("idn:delegate:lookup")) {
    return new Response(JSON.stringify({ error: "insufficient_scope" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  const app = await ctx.runQuery(internal.delegate.queries.getAppDelegation, {
    developerUserId: principal.userId,
  })
  if (!app?.enabled) {
    return new Response(
      JSON.stringify({ error: "delegation_not_enabled" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const str = (x: unknown) =>
    typeof x === "string" && x.trim() ? x.trim() : undefined

  const result = await ctx.runQuery(
    internal.delegate.mutations.lookupForDelegation,
    {
      nip: str(b.nip),
      firstName: str(b.firstName),
      lastName: str(b.lastName),
      dateOfBirth: str(b.dateOfBirth),
    },
  )

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})

http.route({
  path: "/api/delegate/lookup",
  method: "POST",
  handler: delegateLookupHandler,
})

// ---------------------------------------------------------------------------
// POST /api/delegate/identity — création d'une identité déléguée.
// Authentifié par clé API M2M avec le scope `idn:delegate:create`.
// ---------------------------------------------------------------------------
const delegateCreateHandler = httpAction(async (ctx, request) => {
  const principal = await authenticateApiKey(ctx, request)
  if (!principal) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  if (!principal.scopes.includes("idn:delegate:create")) {
    return new Response(JSON.stringify({ error: "insufficient_scope" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  const app = await ctx.runQuery(internal.delegate.queries.getAppDelegation, {
    developerUserId: principal.userId,
  })
  if (!app?.enabled) {
    return new Response(
      JSON.stringify({ error: "delegation_not_enabled" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const str = (x: unknown) =>
    typeof x === "string" && x.trim() ? x.trim() : undefined

  const firstName = str(b.firstName)
  const lastName = str(b.lastName)
  const dateOfBirth = str(b.dateOfBirth)
  const gender = str(b.gender)
  const birthPlace = str(b.birthPlace)
  const nationality = str(b.nationality)

  if (!firstName || !lastName || !dateOfBirth || !gender || !birthPlace || !nationality) {
    return new Response(
      JSON.stringify({
        error: "missing_fields",
        message: "firstName, lastName, dateOfBirth, gender, birthPlace, nationality requis.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  if (!["M", "F", "O", "N"].includes(gender)) {
    return new Response(
      JSON.stringify({ error: "invalid_gender" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return new Response(
      JSON.stringify({ error: "invalid_date_of_birth" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const nip = str(b.nip)
  if (nip && !/^[A-Za-z0-9]{14}$/.test(nip)) {
    return new Response(
      JSON.stringify({ error: "invalid_nip" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  // Vérifier que le citoyen n'a pas déjà d'IDN
  if (nip) {
    const existing = await ctx.runQuery(
      internal.delegate.mutations.lookupForDelegation,
      { nip },
    )
    if (existing.found) {
      return new Response(
        JSON.stringify({
          error: "identity_already_exists",
          idnId: (existing as { idnId?: string }).idnId,
        }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      )
    }
  }

  const requestedLoa = typeof b.loa === "number" ? b.loa : 1
  const assignedLoa = Math.min(requestedLoa, app.maxLoa) as 1 | 2

  const result = await ctx.runAction(
    internal.delegate.actions.createDelegatedUser,
    {
      pivot: {
        firstName,
        lastName,
        dateOfBirth,
        gender: gender as "M" | "F" | "O" | "N",
        birthPlace,
        nationality: nationality.toUpperCase(),
        phone: str(b.phone),
        nip,
      },
      profileType: (str(b.profileType) === "resident" ? "resident" : "citizen") as
        | "citizen"
        | "resident",
      assignedLoa,
      appClientId: app.clientId,
      operatorUserId: principal.userId,
      kycDocumentType: str(b.documentType) as any,
      kycDocFront: str(b.documentFront) as any,
      kycDocBack: str(b.documentBack) as any,
    },
  )

  return new Response(
    JSON.stringify({
      idnId: result.idnId,
      delegatedIdentityId: result.delegatedIdentityId,
      assignedLoa,
    }),
    { status: 201, headers: { "Content-Type": "application/json" } },
  )
})

http.route({
  path: "/api/delegate/identity",
  method: "POST",
  handler: delegateCreateHandler,
})

// ---------------------------------------------------------------------------
// GET /api/delegate/identity?id=xxx — statut d'une identité déléguée.
// Authentifié par clé API M2M avec le scope `idn:delegate:status`.
// ---------------------------------------------------------------------------
const delegateStatusHandler = httpAction(async (ctx, request) => {
  const principal = await authenticateApiKey(ctx, request)
  if (!principal) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  if (!principal.scopes.includes("idn:delegate:status")) {
    return new Response(JSON.stringify({ error: "insufficient_scope" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) {
    return new Response(
      JSON.stringify({ error: "missing_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const result = await ctx.runQuery(internal.delegate.queries.getById, {
    id: id as any,
  })
  if (!result) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Vérifier que l'app appelante est bien propriétaire
  const app = await ctx.runQuery(internal.delegate.queries.getAppDelegation, {
    developerUserId: principal.userId,
  })
  if (!app || result.appClientId !== app.clientId) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})

http.route({
  path: "/api/delegate/identity",
  method: "GET",
  handler: delegateStatusHandler,
})

// ---------------------------------------------------------------------------
// POST /api/claim/lookup — recherche publique d'une identité déléguée réclamable.
// Pas d'auth M2M — appelé par le wizard citoyen.
// ---------------------------------------------------------------------------
const claimLookupHandler = httpAction(async (ctx, request) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const str = (x: unknown) =>
    typeof x === "string" && x.trim() ? x.trim() : undefined

  const nip = str(b.nip)
  const firstName = str(b.firstName)
  const lastName = str(b.lastName)
  const dateOfBirth = str(b.dateOfBirth)

  if (!nip && !(firstName && lastName && dateOfBirth)) {
    return new Response(
      JSON.stringify({ error: "missing_fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const result = await ctx.runQuery(
    internal.delegate.queries.lookupForClaim,
    { nip, firstName, lastName, dateOfBirth },
  )

  if (!result) {
    return new Response(JSON.stringify({ found: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new Response(
    JSON.stringify({
      found: true,
      delegatedIdentityId: result.delegatedIdentityId,
      idnId: result.idnId,
      firstName: result.firstName,
      lastName: result.lastName,
      loa: result.loa,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  )
})

http.route({
  path: "/api/claim/lookup",
  method: "POST",
  handler: claimLookupHandler,
})

// ---------------------------------------------------------------------------
// POST /api/claim/complete — finalise la réclamation (password + PIN).
// ---------------------------------------------------------------------------
const claimCompleteHandler = httpAction(async (ctx, request) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const delegatedIdentityId = b.delegatedIdentityId as string | undefined
  const password = b.password as string | undefined
  const pin = b.pin as string | undefined

  if (!delegatedIdentityId || !password || !pin) {
    return new Response(
      JSON.stringify({ error: "missing_fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  if (password.length < 12) {
    return new Response(
      JSON.stringify({ error: "password_too_short" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  if (!/^\d{6}$/.test(pin)) {
    return new Response(
      JSON.stringify({ error: "invalid_pin" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  try {
    const result = await ctx.runAction(
      internal.delegate.actions.claimAccount,
      {
        delegatedIdentityId: delegatedIdentityId as any,
        password,
        pin,
      },
    )

    return new Response(
      JSON.stringify({ success: true, userId: result.userId }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible de réclamer le compte."
    return new Response(
      JSON.stringify({ error: "claim_failed", message }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }
})

http.route({
  path: "/api/claim/complete",
  method: "POST",
  handler: claimCompleteHandler,
})

// GET /.well-known/document-signing-jwks.json — clé publique RS256 dédiée
// à la feature « Signer un document » (cf. lib/documentSigning.ts). Permet
// à un tiers de vérifier une signature indépendamment de Convex, avec
// n'importe quelle lib JWT/JWKS standard. Distincte de la JWKS du plugin
// better-auth `jwt` servie sous `${AUTH_PATH}/jwks` (réservée aux ID tokens
// OIDC — cf. auth.ts).
const documentSigningJwksHandler = httpAction(async (_ctx, _request) => {
  const jwk = await getPublicJwk()
  return new Response(JSON.stringify({ keys: [jwk] }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
})

http.route({
  path: "/.well-known/document-signing-jwks.json",
  method: "GET",
  handler: documentSigningJwksHandler,
})

http.route({ pathPrefix: `${AUTH_PATH}/`, method: "GET", handler: authRequestHandler })
http.route({ pathPrefix: `${AUTH_PATH}/`, method: "POST", handler: authRequestHandler })

// Webhook Resend — Resend POST ici les événements (sent / delivered / bounce
// / complaint / opened / clicked) avec une signature HMAC. Le composant
// vérifie la signature et met à jour le statut des emails en BD.
//
// URL à déclarer côté Resend :
//   <NEXT_PUBLIC_CONVEX_SITE_URL>/resend-webhook
//   (en dev local : https://pleasant-platypus-379.eu-west-1.convex.site/resend-webhook)
http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req)
  }),
})

export default http
