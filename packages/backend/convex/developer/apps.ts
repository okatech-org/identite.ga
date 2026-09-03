import { ConvexError, v } from "convex/values"

import { components } from "../_generated/api"
import { internalMutation, mutation, query } from "../_generated/server"
import { getCurrentAuthUser, requireAuth, requireDeveloper } from "../lib/auth"
import { GRANTABLE_SCOPES } from "../lib/consentGrant"

/**
 * Portail développeur — apps OAuth (§3.11).
 *
 * Source de vérité : table `oauthApplication` du composant Better Auth.
 * On y accède via `components.betterAuth.adapter.{findMany,create,updateMany,
 * deleteOne}`. Le composant aplatit le schéma : `redirectUrls` et `metadata`
 * sont stockés en `string` (JSON sérialisé).
 *
 * `clientSecret` est stocké hashé via `hashClientSecret` (base64url(SHA-256)
 * sans padding = `defaultClientSecretHasher` de better-auth ; cf.
 * `oidcProvider({ storeClientSecret: "hashed" })` dans auth.ts). Il est retourné
 * en clair UNE seule fois à la création, puis lors d'une rotation explicite.
 */

type OAuthAppDoc = {
  _id: string
  clientId?: string | null
  clientSecret?: string | null
  name?: string | null
  icon?: string | null
  metadata?: string | null
  redirectUrls?: string | null
  type?: string | null
  disabled?: boolean | null
  userId?: string | null
  createdAt?: Date | number | null
  updatedAt?: Date | number | null
}

const MODEL = "oauthApplication" as const

const SERVICE_CATEGORIES = [
  "administrative",
  "civilStatus",
  "fiscal",
  "education",
  "health",
  "transport",
  "social",
  "other",
] as const
type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

interface AppService {
  id: string
  label: string
  description: string
  category: ServiceCategory
  link: string
}

interface AppMetadata {
  env: "production" | "sandbox"
  loa: 1 | 2 | 3
  description: string
  scopes: string[]
  createdBy: string
  services: AppService[]
  /** Whitelist d'emails autorisés à consentir sur une app sandbox. Lowercased. */
  testUsers?: string[]
  /** Clé étrangère vers le jumeau prod (depuis la sandbox) ou sandbox (depuis le jumeau prod). */
  linkedClientId?: string
  /** État de la demande de production (uniquement renseigné côté sandbox). */
  productionStatus?: "none" | "pending" | "approved" | "rejected"
  /**
   * Sur le jumeau prod : statut de revue admin ("pending" puis "production").
   * Lu par admin/oauthApps.ts qui a la priorité sur `env` pour l'affichage.
   */
  status?: "pending" | "production"
}

const MAX_TEST_USERS = 25

const parseService = (raw: unknown): AppService | null => {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const id = typeof r.id === "string" ? r.id.trim() : ""
  const label = typeof r.label === "string" ? r.label.trim() : ""
  const link = typeof r.link === "string" ? r.link.trim() : ""
  if (!id || !label || !link) return null
  const category =
    typeof r.category === "string" &&
    (SERVICE_CATEGORIES as readonly string[]).includes(r.category)
      ? (r.category as ServiceCategory)
      : "other"
  const description = typeof r.description === "string" ? r.description : ""
  return { id, label, description, category, link }
}

const parseMetadata = (raw: string | null | undefined): AppMetadata => {
  const fallback: AppMetadata = {
    env: "sandbox",
    loa: 1,
    description: "",
    scopes: [],
    createdBy: "",
    services: [],
  }
  if (!raw) return fallback
  try {
    const obj = JSON.parse(raw) as Partial<AppMetadata> & {
      services?: unknown
      testUsers?: unknown
    }
    const services = Array.isArray(obj.services)
      ? obj.services
          .map(parseService)
          .filter((s): s is AppService => s !== null)
      : []
    const testUsers = Array.isArray(obj.testUsers)
      ? obj.testUsers
          .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
          .filter((e) => e.length > 0)
      : undefined
    const productionStatus =
      obj.productionStatus === "pending" ||
      obj.productionStatus === "approved" ||
      obj.productionStatus === "rejected" ||
      obj.productionStatus === "none"
        ? obj.productionStatus
        : undefined
    const status =
      obj.status === "pending" || obj.status === "production"
        ? obj.status
        : undefined
    return {
      env: obj.env === "production" ? "production" : "sandbox",
      loa: obj.loa === 2 || obj.loa === 3 ? obj.loa : 1,
      description: typeof obj.description === "string" ? obj.description : "",
      scopes: Array.isArray(obj.scopes) ? obj.scopes.map(String) : [],
      createdBy: typeof obj.createdBy === "string" ? obj.createdBy : "",
      services,
      testUsers,
      linkedClientId:
        typeof obj.linkedClientId === "string" && obj.linkedClientId.length > 0
          ? obj.linkedClientId
          : undefined,
      productionStatus,
      status,
    }
  } catch {
    return fallback
  }
}

const credentialsForEnv = (
  slug: string,
  env: "sandbox" | "production",
): { clientId: string; clientSecret: string } => {
  const envTag = env === "production" ? "prd" : "sbx"
  const secretTag = env === "production" ? "live" : "test"
  return {
    clientId: `${slug}_${envTag}_${base64Url(randomBytes(6))}`,
    clientSecret: `idn_sk_${secretTag}_${base64Url(randomBytes(24))}`,
  }
}

const isValidEmail = (input: string): boolean =>
  /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(input)

const parseRedirectUrls = (raw: string | null | undefined): string[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    // not JSON
  }
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const base64Url = (bytes: Uint8Array): string => {
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const randomBytes = (n: number): Uint8Array => {
  const bytes = new Uint8Array(n)
  crypto.getRandomValues(bytes)
  return bytes
}

/**
 * Hash du `client_secret` OAuth.
 *
 * DOIT correspondre EXACTEMENT à `defaultClientSecretHasher` de better-auth
 * (oidc-provider) : base64url(SHA-256(secret)) SANS padding. C'est ce que
 * `oidcProvider` (configuré `storeClientSecret: "hashed"` dans auth.ts)
 * recompute au token endpoint pour comparer le secret reçu à la valeur stockée.
 * Toute divergence de format (ex. ancien hex) casse l'authentification client
 * avec `invalid_client`.
 */
const hashClientSecret = async (secret: string): Promise<string> => {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret) as BufferSource,
  )
  return base64Url(new Uint8Array(buf))
}

const tsOf = (value: Date | number | undefined | null): number => {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  return value
}

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "app"

const SERVICE_CATEGORY_VALIDATOR = v.union(
  ...SERVICE_CATEGORIES.map((c) => v.literal(c)),
)

const SERVICE_VALIDATOR = v.object({
  id: v.string(),
  label: v.string(),
  description: v.string(),
  category: SERVICE_CATEGORY_VALIDATOR,
  link: v.string(),
})

const toDto = (doc: OAuthAppDoc) => {
  const meta = parseMetadata(doc.metadata)
  return {
    id: doc._id,
    clientId: doc.clientId ?? "",
    name: doc.name ?? doc.clientId ?? "",
    env: meta.env,
    loa: meta.loa,
    scopes: meta.scopes,
    redirectUris: parseRedirectUrls(doc.redirectUrls),
    description: meta.description,
    services: meta.services,
    disabled: Boolean(doc.disabled),
    createdAt: tsOf(doc.createdAt),
    testUsers: meta.testUsers ?? [],
    linkedClientId: meta.linkedClientId ?? null,
    productionStatus: meta.productionStatus ?? "none",
  }
}

const appDtoValidator = v.object({
  id: v.string(),
  clientId: v.string(),
  name: v.string(),
  env: v.union(v.literal("production"), v.literal("sandbox")),
  loa: v.union(v.literal(1), v.literal(2), v.literal(3)),
  scopes: v.array(v.string()),
  redirectUris: v.array(v.string()),
  description: v.string(),
  services: v.array(SERVICE_VALIDATOR),
  disabled: v.boolean(),
  createdAt: v.number(),
  testUsers: v.array(v.string()),
  linkedClientId: v.union(v.string(), v.null()),
  productionStatus: v.union(
    v.literal("none"),
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
  ),
})

export const listMine = query({
  args: {},
  returns: v.array(appDtoValidator),
  handler: async (ctx) => {
    // Lecture gracieuse : on retourne [] tant que la session ou le rôle ne
    // sont pas encore en place (même pattern que oauthConsents.listMine,
    // sessions.listMine — évite un crash React/Suspense au premier render).
    const user = await getCurrentAuthUser(ctx)
    if (!user || !user.roles.includes("developer")) return []
    let raw: { page: OAuthAppDoc[] }
    try {
      raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
        model: MODEL,
        where: [{ field: "userId", value: user.userId, operator: "eq" }],
        paginationOpts: { numItems: 200, cursor: null },
      })) as { page: OAuthAppDoc[] }
    } catch {
      return []
    }
    return raw.page.map(toDto)
  },
})

export const get = query({
  args: { clientId: v.string() },
  returns: v.union(v.null(), appDtoValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentAuthUser(ctx)
    if (!user || !user.roles.includes("developer")) return null
    let raw: { page: OAuthAppDoc[] }
    try {
      raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
        model: MODEL,
        where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
        paginationOpts: { numItems: 1, cursor: null },
      })) as { page: OAuthAppDoc[] }
    } catch {
      return null
    }
    const doc = raw.page[0]
    if (!doc) return null
    if (doc.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cette application ne vous appartient pas.",
      })
    }
    return toDto(doc)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    redirectUris: v.array(v.string()),
    scopes: v.array(v.string()),
    loa: v.union(v.literal(1), v.literal(2), v.literal(3)),
  },
  returns: v.object({
    id: v.string(),
    clientId: v.string(),
    clientSecret: v.string(), // ⚠️ retourné UNE SEULE FOIS
  }),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)

    if (!args.name.trim()) {
      throw new ConvexError({ code: "INVALID_INPUT", message: "Nom requis." })
    }
    if (args.redirectUris.length === 0) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Au moins une redirect URI est requise.",
      })
    }
    // Toute nouvelle app naît en sandbox — pas de garde verified ici (le
    // gate verified n'intervient qu'au moment de `requestProduction`).
    for (const uri of args.redirectUris) {
      try {
        new URL(uri)
      } catch {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: `Redirect URI invalide : ${uri}`,
        })
      }
    }

    const { clientId, clientSecret: clientSecretPlain } = credentialsForEnv(
      slugify(args.name),
      "sandbox",
    )
    const clientSecretHash = await hashClientSecret(clientSecretPlain)
    const now = Date.now()

    const metadata: AppMetadata = {
      env: "sandbox",
      loa: args.loa,
      description: args.description ?? "",
      scopes: args.scopes,
      createdBy: user.userId,
      services: [],
      testUsers: [],
      productionStatus: "none",
    }

    const created = (await ctx.runMutation(
      components.betterAuth.adapter.create,
      {
        input: {
          model: MODEL,
          data: {
            clientId,
            clientSecret: clientSecretHash,
            name: args.name.trim(),
            userId: user.userId,
            // Better Auth oidc-provider stocke et lit en CSV (.split(",") dans
            // getClient). Stocker en JSON casse la validation redirect_uri du
            // flow /oauth2/authorize.
            redirectUrls: args.redirectUris.join(","),
            disabled: false,
            type: "web",
            metadata: JSON.stringify(metadata),
            createdAt: now,
            updatedAt: now,
          },
        },
      },
    )) as { _id: string }

    return {
      id: created._id,
      clientId,
      clientSecret: clientSecretPlain,
    }
  },
})

export const rotateSecret = mutation({
  args: { clientId: v.string() },
  returns: v.object({ clientSecret: v.string() }),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: MODEL,
      where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: OAuthAppDoc[] }
    const doc = raw.page[0]
    if (!doc) {
      throw new ConvexError({ code: "NOT_FOUND", message: "App introuvable." })
    }
    if (doc.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cette application ne vous appartient pas.",
      })
    }

    const meta = parseMetadata(doc.metadata)
    const secretTag = meta.env === "production" ? "live" : "test"
    const newSecretPlain = `idn_sk_${secretTag}_${base64Url(randomBytes(24))}`
    const newSecretHash = await hashClientSecret(newSecretPlain)

    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: MODEL,
        update: { clientSecret: newSecretHash, updatedAt: Date.now() },
        where: [{ field: "_id", value: doc._id, operator: "eq" }],
      },
    })

    return { clientSecret: newSecretPlain }
  },
})

/** Met à jour les scopes OAuth déclarés par l'application. */
export const setScopes = mutation({
  args: { clientId: v.string(), scopes: v.array(v.string()) },
  returns: v.object({ scopes: v.array(v.string()) }),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const scopes = [
      ...new Set(args.scopes.map((scope) => scope.trim()).filter(Boolean)),
    ]
    const unknown = scopes.find((scope) => !GRANTABLE_SCOPES.includes(scope))
    if (unknown) {
      throw new ConvexError({
        code: "UNKNOWN_SCOPE",
        message: `Scope inconnu : ${unknown}.`,
      })
    }
    const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: MODEL,
      where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: OAuthAppDoc[] }
    const doc = raw.page[0]
    if (!doc || doc.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Application non autorisée.",
      })
    }
    const meta = parseMetadata(doc.metadata)
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: MODEL,
        where: [{ field: "_id", value: doc._id, operator: "eq" }],
        update: {
          metadata: JSON.stringify({ ...meta, scopes }),
          updatedAt: Date.now(),
        },
      },
    })
    return { scopes }
  },
})

/**
 * Met à jour la liste des services publiés par l'app. Ces services sont
 * exposés au catalogue citoyen via `convex/services.ts` après consentement
 * OAuth — l'app mobile les présente dans (tabs)/services.
 */
export const setServices = mutation({
  args: {
    clientId: v.string(),
    services: v.array(SERVICE_VALIDATOR),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    if (args.services.length > 50) {
      throw new ConvexError({
        code: "TOO_MANY_SERVICES",
        message: "Maximum 50 services par application.",
      })
    }
    const seenIds = new Set<string>()
    for (const s of args.services) {
      if (seenIds.has(s.id)) {
        throw new ConvexError({
          code: "DUPLICATE_ID",
          message: `Identifiant en double : ${s.id}`,
        })
      }
      seenIds.add(s.id)
      if (!/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(s.id)) {
        throw new ConvexError({
          code: "INVALID_ID",
          message: `ID invalide : ${s.id} (a-z, 0-9, _, -)`,
        })
      }
      try {
        const url = new URL(s.link)
        if (url.protocol !== "https:" && url.protocol !== "http:") {
          throw new Error("non-http")
        }
      } catch {
        throw new ConvexError({
          code: "INVALID_LINK",
          message: `Lien invalide pour ${s.id} : ${s.link}`,
        })
      }
    }

    const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: MODEL,
      where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: OAuthAppDoc[] }
    const doc = raw.page[0]
    if (!doc) {
      throw new ConvexError({ code: "NOT_FOUND", message: "App introuvable." })
    }
    if (doc.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cette application ne vous appartient pas.",
      })
    }
    const meta = parseMetadata(doc.metadata)
    const nextMeta: AppMetadata = { ...meta, services: args.services }
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: MODEL,
        where: [{ field: "_id", value: doc._id, operator: "eq" }],
        update: {
          metadata: JSON.stringify(nextMeta),
          updatedAt: Date.now(),
        },
      },
    })
    return null
  },
})

export const remove = mutation({
  args: { clientId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: MODEL,
      where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: OAuthAppDoc[] }
    const doc = raw.page[0]
    if (!doc) return null
    if (doc.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cette application ne vous appartient pas.",
      })
    }
    const meta = parseMetadata(doc.metadata)
    const appsToDelete = [doc]

    // Sandbox et production forment une seule application dans le portail.
    // Supprimer l'une supprime donc aussi sa jumelle, après avoir vérifié que
    // les deux enregistrements appartiennent bien au même développeur.
    if (meta.linkedClientId) {
      const twinRaw = (await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
          model: MODEL,
          where: [
            { field: "clientId", value: meta.linkedClientId, operator: "eq" },
          ],
          paginationOpts: { numItems: 1, cursor: null },
        },
      )) as { page: OAuthAppDoc[] }
      const twin = twinRaw.page[0]
      if (twin) {
        if (twin.userId !== user.userId) {
          throw new ConvexError({
            code: "INVALID_LINKED_APP",
            message: "La liaison entre les environnements est invalide.",
          })
        }
        appsToDelete.push(twin)
      }
    }

    const now = Date.now()
    for (const app of appsToDelete) {
      const appClientId = app.clientId
      if (appClientId) {
        // Révoque les sessions OAuth déjà émises et retire les consentements
        // associés. Sans cela, un jeton existant pourrait rester valable
        // jusqu'à son expiration malgré la disparition du client.
        for (const model of ["oauthAccessToken", "oauthConsent"] as const) {
          await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
            input: {
              model,
              where: [
                { field: "clientId", value: appClientId, operator: "eq" },
              ],
            },
            paginationOpts: { numItems: 200, cursor: null },
          })
        }

        // Une clé liée à une application supprimée ne doit plus pouvoir
        // authentifier d'appel serveur-à-serveur.
        const apiKeys = await ctx.db
          .query("developerApiKey")
          .withIndex("by_appClientId_and_createdAt", (q) =>
            q.eq("appClientId", appClientId),
          )
          .take(100)
        for (const key of apiKeys) {
          if (key.userId === user.userId && key.revokedAt === undefined) {
            await ctx.db.patch(key._id, { revokedAt: now })
          }
        }

        // Les livraisons historiques restent dans l'audit, mais les endpoints
        // et leurs secrets sont neutralisés comme lors d'une suppression
        // manuelle depuis la page Webhooks.
        const endpoints = await ctx.db
          .query("webhookEndpoints")
          .withIndex("by_appClientId_and_createdAt", (q) =>
            q.eq("appClientId", appClientId),
          )
          .take(20)
        for (const endpoint of endpoints) {
          if (
            endpoint.developerUserId !== user.userId ||
            endpoint.deletedAt !== undefined
          ) {
            continue
          }
          await ctx.db.patch(endpoint._id, {
            status: "disabled",
            url: "https://deleted.invalid/",
            secretCiphertext: "",
            secretIv: "",
            previousSecretCiphertext: undefined,
            previousSecretIv: undefined,
            previousSecretValidUntil: undefined,
            challengeId: undefined,
            deletedAt: now,
            updatedAt: now,
          })
          const subscriptions = await ctx.db
            .query("webhookSubscriptions")
            .withIndex("by_endpointId_and_eventType", (q) =>
              q.eq("endpointId", endpoint._id),
            )
            .take(20)
          for (const subscription of subscriptions) {
            await ctx.db.delete(subscription._id)
          }
        }
      }

      await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
        input: {
          model: MODEL,
          where: [{ field: "_id", value: app._id, operator: "eq" }],
        },
      })
    }
    return null
  },
})

/**
 * Ajoute un email à la whitelist sandbox de l'app. Seuls les emails
 * présents pourront consentir sur cette app (cf. oauthAuthorize.userAllowed
 * + filet défensif dans auth.ts/getAdditionalUserInfoClaim).
 */
export const addTestUser = mutation({
  args: { clientId: v.string(), email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const email = args.email.trim().toLowerCase()
    if (!isValidEmail(email)) {
      throw new ConvexError({
        code: "INVALID_EMAIL",
        message: "Adresse email invalide.",
      })
    }
    const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: MODEL,
      where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: OAuthAppDoc[] }
    const doc = raw.page[0]
    if (!doc) {
      throw new ConvexError({ code: "NOT_FOUND", message: "App introuvable." })
    }
    if (doc.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cette application ne vous appartient pas.",
      })
    }
    const meta = parseMetadata(doc.metadata)
    if (meta.env !== "sandbox") {
      throw new ConvexError({
        code: "NOT_SANDBOX",
        message:
          "Les comptes de test ne s'appliquent qu'aux applications sandbox.",
      })
    }
    const current = meta.testUsers ?? []
    if (current.includes(email)) {
      // Idempotent : pas d'erreur si déjà présent.
      return null
    }
    if (current.length >= MAX_TEST_USERS) {
      throw new ConvexError({
        code: "TOO_MANY_TEST_USERS",
        message: `Maximum ${MAX_TEST_USERS} comptes de test par application.`,
      })
    }
    const nextMeta: AppMetadata = {
      ...meta,
      testUsers: [...current, email],
    }
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: MODEL,
        where: [{ field: "_id", value: doc._id, operator: "eq" }],
        update: {
          metadata: JSON.stringify(nextMeta),
          updatedAt: Date.now(),
        },
      },
    })
    return null
  },
})

export const removeTestUser = mutation({
  args: { clientId: v.string(), email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const email = args.email.trim().toLowerCase()
    const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: MODEL,
      where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: OAuthAppDoc[] }
    const doc = raw.page[0]
    if (!doc) {
      throw new ConvexError({ code: "NOT_FOUND", message: "App introuvable." })
    }
    if (doc.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cette application ne vous appartient pas.",
      })
    }
    const meta = parseMetadata(doc.metadata)
    const current = meta.testUsers ?? []
    const next = current.filter((e) => e !== email)
    if (next.length === current.length) return null
    const nextMeta: AppMetadata = { ...meta, testUsers: next }
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: MODEL,
        where: [{ field: "_id", value: doc._id, operator: "eq" }],
        update: {
          metadata: JSON.stringify(nextMeta),
          updatedAt: Date.now(),
        },
      },
    })
    return null
  },
})

/**
 * Crée une app jumelle "production" en attente d'approbation admin.
 *
 * Garde : seul un développeur déjà validé par un super-admin
 * (userRole.verified === true) peut soumettre une demande prod.
 * La jumelle est créée disabled=true ; admin l'active via
 * `admin/oauthApps.approveProductionRequest`.
 */
export const requestProduction = mutation({
  args: { clientId: v.string() },
  returns: v.object({
    id: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)

    // Garde verified — alignée sur la garde historique du `create` pour
    // la prod. Le compte dev doit être validé manuellement avant de
    // publier en production.
    const roleRow = await ctx.db
      .query("userRole")
      .withIndex("by_userId_role", (q) =>
        q.eq("userId", user.userId).eq("role", "developer"),
      )
      .unique()
    if (!roleRow || roleRow.revokedAt || roleRow.verified !== true) {
      throw new ConvexError({
        code: "DEVELOPER_NOT_VERIFIED",
        message:
          "Votre compte développeur doit être validé par un super-administrateur avant de publier en production.",
      })
    }

    const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: MODEL,
      where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: OAuthAppDoc[] }
    const doc = raw.page[0]
    if (!doc) {
      throw new ConvexError({ code: "NOT_FOUND", message: "App introuvable." })
    }
    if (doc.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cette application ne vous appartient pas.",
      })
    }
    const meta = parseMetadata(doc.metadata)
    if (meta.env !== "sandbox") {
      throw new ConvexError({
        code: "NOT_SANDBOX",
        message: "La demande de production ne s'applique qu'à une app sandbox.",
      })
    }
    if (
      meta.productionStatus === "pending" ||
      meta.productionStatus === "approved"
    ) {
      throw new ConvexError({
        code: "ALREADY_REQUESTED",
        message:
          meta.productionStatus === "pending"
            ? "Une demande de production est déjà en cours."
            : "Cette application a déjà une jumelle en production.",
      })
    }

    const redirectUris = parseRedirectUrls(doc.redirectUrls)
    for (const uri of redirectUris) {
      let parsed: URL
      try {
        parsed = new URL(uri)
      } catch {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: `Redirect URI invalide : ${uri}`,
        })
      }
      if (parsed.protocol !== "https:") {
        throw new ConvexError({
          code: "HTTPS_REQUIRED",
          message: `HTTPS requis en production : ${uri}`,
        })
      }
    }

    const baseName = doc.name ?? args.clientId
    const { clientId: prodClientId, clientSecret: prodSecretPlain } =
      credentialsForEnv(slugify(baseName), "production")
    const prodSecretHash = await hashClientSecret(prodSecretPlain)
    const now = Date.now()

    const prodMeta: AppMetadata = {
      env: "production",
      loa: meta.loa,
      description: meta.description,
      scopes: meta.scopes,
      createdBy: user.userId,
      services: meta.services,
      linkedClientId: args.clientId,
      status: "pending",
    }

    const created = (await ctx.runMutation(
      components.betterAuth.adapter.create,
      {
        input: {
          model: MODEL,
          data: {
            clientId: prodClientId,
            clientSecret: prodSecretHash,
            name: baseName,
            userId: user.userId,
            // Voir la note sur create() : Better Auth attend du CSV.
            redirectUrls: redirectUris.join(","),
            // Désactivée jusqu'à approbation admin.
            disabled: true,
            type: "web",
            metadata: JSON.stringify(prodMeta),
            createdAt: now,
            updatedAt: now,
          },
        },
      },
    )) as { _id: string }

    const nextSandboxMeta: AppMetadata = {
      ...meta,
      linkedClientId: prodClientId,
      productionStatus: "pending",
    }
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: MODEL,
        where: [{ field: "_id", value: doc._id, operator: "eq" }],
        update: {
          metadata: JSON.stringify(nextSandboxMeta),
          updatedAt: now,
        },
      },
    })

    return {
      id: created._id,
      clientId: prodClientId,
      clientSecret: prodSecretPlain,
    }
  },
})

/**
 * Métriques d'usage — zéros tant que l'agrégation des `oauthAccessToken`
 * + logs HTTP n'est pas branchée (Phase 2). On retourne des valeurs neutres
 * que l'UI traduit en empty-state.
 */
export const usage = query({
  args: { clientId: v.optional(v.string()) },
  returns: v.object({
    requestsThisMonth: v.number(),
    requestsQuota: v.number(),
    requestsDelta: v.string(),
    latencyP95Ms: v.number(),
    error4xxRate: v.string(),
    series: v.array(v.number()),
    hasData: v.boolean(),
  }),
  handler: async (ctx, args) => {
    void args
    const user = await getCurrentAuthUser(ctx)
    void user
    return {
      requestsThisMonth: 0,
      requestsQuota: 100_000,
      requestsDelta: "—",
      latencyP95Ms: 0,
      error4xxRate: "—",
      series: [],
      hasData: false,
    }
  },
})

/**
 * Auto-attribue le rôle "developer" à l'utilisateur courant.
 *
 * Appelée au premier accès au portail développeur (sign-up minimaliste).
 * Idempotent : si le rôle existe déjà, no-op.
 */
export const ensureRole = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // requireAuth (pas requireDeveloper — c'est nous qui assignons le rôle)
    const user = await requireAuth(ctx)
    const existing = await ctx.db
      .query("userRole")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .collect()
    if (existing.some((r) => r.role === "developer" && !r.revokedAt)) {
      return null
    }
    await ctx.db.insert("userRole", {
      userId: user.userId,
      role: "developer",
      assignedAt: Date.now(),
      assignedBy: user.userId,
    })
    return null
  },
})

/**
 * Sentinel d'authentification — sert au bootstrap client pour savoir
 * quand le JWT Convex est prêt avant d'appeler `ensureRole`.
 *
 * Retour :
 *   - `{ authenticated: false }` tant que la requête n'a pas de JWT valide
 *   - `{ authenticated: true, hasDeveloperRole }` quand l'auth Convex a réussi
 */
export const me = query({
  args: {},
  returns: v.object({
    authenticated: v.boolean(),
    hasDeveloperRole: v.boolean(),
  }),
  handler: async (ctx) => {
    const user = await getCurrentAuthUser(ctx)
    if (!user) return { authenticated: false, hasDeveloperRole: false }
    return {
      authenticated: true,
      hasDeveloperRole: user.roles.includes("developer"),
    }
  },
})

/**
 * Édite les redirect URIs d'une app OAuth depuis le portail développeur.
 *
 * Opère par `clientId`, avec contrôle de propriété. Comme sandbox et jumeau
 * prod sont deux records distincts, chacun s'édite indépendamment — c'est ce
 * qui permet d'avoir des URIs propres à chaque environnement (la prod n'hérite
 * plus définitivement des URIs sandbox copiées par `requestProduction`).
 *
 * En production, HTTPS est obligatoire (aligné sur `requestProduction`).
 * Stockage en CSV — format attendu par Better Auth oidc-provider (getClient
 * fait `(redirectUrls ?? "").split(",")`), cf. note sur `create`.
 */
export const setRedirectUris = mutation({
  args: {
    clientId: v.string(),
    redirectUris: v.array(v.string()),
  },
  returns: v.object({ redirectUris: v.array(v.string()) }),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: MODEL,
      where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: OAuthAppDoc[] }
    const doc = raw.page[0]
    if (!doc) {
      throw new ConvexError({ code: "NOT_FOUND", message: "App introuvable." })
    }
    if (doc.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cette application ne vous appartient pas.",
      })
    }
    const meta = parseMetadata(doc.metadata)
    const normalized: string[] = []
    for (const rawUri of args.redirectUris) {
      const uri = rawUri.trim()
      if (!uri) continue
      let parsed: URL
      try {
        parsed = new URL(uri)
      } catch {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: `Redirect URI invalide : ${uri}`,
        })
      }
      if (meta.env === "production" && parsed.protocol !== "https:") {
        throw new ConvexError({
          code: "HTTPS_REQUIRED",
          message: `HTTPS requis en production : ${uri}`,
        })
      }
      if (!normalized.includes(uri)) normalized.push(uri)
    }
    if (normalized.length === 0) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Au moins une redirect URI est requise.",
      })
    }
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: MODEL,
        where: [{ field: "_id", value: doc._id, operator: "eq" }],
        update: {
          redirectUrls: normalized.join(","),
          updatedAt: Date.now(),
        },
      },
    })
    return { redirectUris: normalized }
  },
})

/**
 * Outil ops — patch les `redirectUris` d'une app par clientId, sans auth
 * (à lancer via `bunx convex run developer/apps:setRedirectUrisByClientId
 * '{"clientId":"...","redirectUris":["..."]}'`). Doublon assumé de la mutation
 * publique `setRedirectUris` ci-dessus, pour intervention hors session (script,
 * support). N'applique pas la garde HTTPS prod.
 */
export const setRedirectUrisByClientId = internalMutation({
  args: {
    clientId: v.string(),
    redirectUris: v.array(v.string()),
  },
  returns: v.object({
    updated: v.boolean(),
    redirectUris: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    if (args.redirectUris.length === 0) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Au moins une redirect URI est requise.",
      })
    }
    for (const uri of args.redirectUris) {
      try {
        new URL(uri)
      } catch {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: `Redirect URI invalide : ${uri}`,
        })
      }
    }
    const found = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: MODEL,
      where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: OAuthAppDoc[] }
    const doc = found.page[0]
    if (!doc) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: `Application introuvable : ${args.clientId}`,
      })
    }
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: MODEL,
        update: {
          // Better Auth oidc-provider stocke et lit en CSV (.split(",") dans
          // getClient). Stocker en JSON casse la validation redirect_uri du
          // flow /oauth2/authorize.
          redirectUrls: args.redirectUris.join(","),
          updatedAt: Date.now(),
        },
        where: [{ field: "_id", value: doc._id, operator: "eq" }],
      },
    })
    return { updated: true, redirectUris: args.redirectUris }
  },
})

/**
 * Migration one-shot : convertit les `redirectUrls` stockés en JSON
 * (ancien format developer/apps) vers CSV (format attendu par Better Auth
 * oidc-provider). Lancer via :
 *
 *   bunx convex run developer/apps:migrateRedirectUrlsToCsv '{}'
 *
 * Idempotent — saute les apps déjà au bon format.
 */
export const migrateRedirectUrlsToCsv = internalMutation({
  args: {},
  returns: v.object({
    inspected: v.number(),
    updated: v.number(),
  }),
  handler: async (ctx) => {
    let cursor: string | null = null
    let inspected = 0
    let updated = 0
    // Pagination défensive — la table `oauthApplication` reste petite mais on
    // ne fait pas l'hypothèse d'un seul lot.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch = (await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
          model: MODEL,
          paginationOpts: { numItems: 200, cursor },
        },
      )) as {
        page: OAuthAppDoc[]
        isDone?: boolean
        continueCursor?: string | null
      }
      for (const doc of batch.page) {
        inspected++
        const raw = doc.redirectUrls ?? ""
        if (!raw || !raw.startsWith("[")) continue // déjà en CSV
        let parsed: unknown
        try {
          parsed = JSON.parse(raw)
        } catch {
          continue
        }
        if (!Array.isArray(parsed)) continue
        const csv = parsed
          .map(String)
          .map((s) => s.trim())
          .filter(Boolean)
          .join(",")
        await ctx.runMutation(components.betterAuth.adapter.updateOne, {
          input: {
            model: MODEL,
            where: [{ field: "_id", value: doc._id, operator: "eq" }],
            update: { redirectUrls: csv, updatedAt: Date.now() },
          },
        })
        updated++
      }
      if (batch.isDone || !batch.continueCursor) break
      cursor = batch.continueCursor
    }
    return { inspected, updated }
  },
})

/**
 * Amorçage d'un client OAuth de confiance, hors portail développeur.
 *
 * Les applications de l'État — NDJOBI, par exemple — ne suivent pas le parcours
 * sandbox du portail : elles sont provisionnées directement en production par un
 * opérateur disposant de la clé d'administration Convex.
 *
 *   bunx convex run --prod developer/apps:bootstrapTrustedClient '{"name":"…", …}'
 *
 * Le secret n'est retourné qu'ici, une seule fois, et stocké haché comme pour
 * tout client du portail. Pour le renouveler ensuite : `rotateSecret`.
 */
export const bootstrapTrustedClient = internalMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    redirectUris: v.array(v.string()),
    scopes: v.array(v.string()),
    loa: v.union(v.literal(1), v.literal(2), v.literal(3)),
    /** Développeur propriétaire, si l'app doit rester gérable au portail. */
    ownerUserId: v.optional(v.string()),
  },
  returns: v.object({
    id: v.string(),
    clientId: v.string(),
    clientSecret: v.string(), // ⚠️ retourné UNE SEULE FOIS
  }),
  handler: async (ctx, args) => {
    const name = args.name.trim()
    if (!name) {
      throw new ConvexError({ code: "INVALID_INPUT", message: "Nom requis." })
    }
    if (args.redirectUris.length === 0) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Au moins une redirect URI est requise.",
      })
    }
    // Client de production : https obligatoire et pas de fragment. Une URI de
    // redirection laxiste sur un fournisseur d'identité national ouvre la porte
    // au vol de code d'autorisation.
    for (const uri of args.redirectUris) {
      let parsed: URL
      try {
        parsed = new URL(uri)
      } catch {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: `Redirect URI invalide : ${uri}`,
        })
      }
      if (parsed.protocol !== "https:") {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: `Redirect URI non https : ${uri}`,
        })
      }
      if (parsed.hash) {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: `Redirect URI avec fragment : ${uri}`,
        })
      }
    }

    // Idempotence : deux applications homonymes seraient indiscernables sur
    // l'écran de consentement — exactement ce qu'un hameçonnage recherche.
    const existing = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: MODEL,
      where: [{ field: "name", value: name, operator: "eq" }],
      paginationOpts: { numItems: 1, cursor: null },
    })) as { page: OAuthAppDoc[] }
    if (existing.page[0]) {
      throw new ConvexError({
        code: "ALREADY_EXISTS",
        message:
          `Une application « ${name} » existe déjà (${existing.page[0].clientId ?? "?"}). ` +
          `Utiliser rotateSecret pour renouveler son secret.`,
      })
    }

    const { clientId, clientSecret: clientSecretPlain } = credentialsForEnv(
      slugify(name),
      "production",
    )
    const clientSecretHash = await hashClientSecret(clientSecretPlain)
    const now = Date.now()

    const metadata: AppMetadata = {
      env: "production",
      loa: args.loa,
      description: args.description ?? "",
      scopes: args.scopes,
      createdBy: args.ownerUserId ?? "",
      services: [],
      testUsers: [],
      productionStatus: "approved",
      status: "production",
    }

    const created = (await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: MODEL,
        data: {
          clientId,
          clientSecret: clientSecretHash,
          name,
          userId: args.ownerUserId ?? "",
          // CSV, et non JSON : `getClient` de better-auth fait un .split(",").
          redirectUrls: args.redirectUris.join(","),
          disabled: false,
          type: "web",
          metadata: JSON.stringify(metadata),
          createdAt: now,
          updatedAt: now,
        },
      },
    })) as { _id: string }

    return { id: created._id, clientId, clientSecret: clientSecretPlain }
  },
})
