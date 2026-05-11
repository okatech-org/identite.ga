import { ConvexError, v } from "convex/values"

import { components } from "../_generated/api"
import { mutation, query } from "../_generated/server"
import { getCurrentAuthUser, requireAuth, requireDeveloper } from "../lib/auth"

/**
 * Portail développeur — apps OAuth (§3.11).
 *
 * Source de vérité : table `oauthApplication` du composant Better Auth.
 * On y accède via `components.betterAuth.adapter.{findMany,create,updateMany,
 * deleteOne}`. Le composant aplatit le schéma : `redirectUrls` et `metadata`
 * sont stockés en `string` (JSON sérialisé).
 *
 * `clientSecret` est stocké hashé (SHA-256). Il est retourné en clair UNE
 * seule fois à la création, puis lors d'une rotation explicite.
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

interface AppMetadata {
  env: "production" | "sandbox"
  loa: 1 | 2 | 3
  description: string
  scopes: string[]
  createdBy: string
}

const parseMetadata = (raw: string | null | undefined): AppMetadata => {
  const fallback: AppMetadata = {
    env: "sandbox",
    loa: 1,
    description: "",
    scopes: [],
    createdBy: "",
  }
  if (!raw) return fallback
  try {
    const obj = JSON.parse(raw) as Partial<AppMetadata>
    return {
      env: obj.env === "production" ? "production" : "sandbox",
      loa: obj.loa === 2 || obj.loa === 3 ? obj.loa : 1,
      description: typeof obj.description === "string" ? obj.description : "",
      scopes: Array.isArray(obj.scopes) ? obj.scopes.map(String) : [],
      createdBy: typeof obj.createdBy === "string" ? obj.createdBy : "",
    }
  } catch {
    return fallback
  }
}

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

const sha256Hex = async (input: string): Promise<string> => {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input) as BufferSource,
  )
  const arr = new Uint8Array(buf)
  let hex = ""
  for (let i = 0; i < arr.length; i++) {
    hex += arr[i]!.toString(16).padStart(2, "0")
  }
  return hex
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
    disabled: Boolean(doc.disabled),
    createdAt: tsOf(doc.createdAt),
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
  disabled: v.boolean(),
  createdAt: v.number(),
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
    env: v.union(v.literal("production"), v.literal("sandbox")),
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
    // Garde : un développeur non validé par le super-admin ne peut créer
    // que des apps en sandbox. Le passage en production requiert d'avoir
    // été approuvé manuellement (cf. admin/roles.setDeveloperVerified).
    if (args.env === "production") {
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
    }
    for (const uri of args.redirectUris) {
      try {
        const parsed = new URL(uri)
        if (args.env === "production" && parsed.protocol !== "https:") {
          throw new ConvexError({
            code: "INVALID_INPUT",
            message: `HTTPS requis en production : ${uri}`,
          })
        }
      } catch {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: `Redirect URI invalide : ${uri}`,
        })
      }
    }

    const clientId = `${slugify(args.name)}-${base64Url(randomBytes(4))}`
    const clientSecretPlain = `idn_sk_${base64Url(randomBytes(24))}`
    const clientSecretHash = await sha256Hex(clientSecretPlain)
    const now = Date.now()

    const metadata: AppMetadata = {
      env: args.env,
      loa: args.loa,
      description: args.description ?? "",
      scopes: args.scopes,
      createdBy: user.userId,
    }

    const created = (await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: MODEL,
        data: {
          clientId,
          clientSecret: clientSecretHash,
          name: args.name.trim(),
          userId: user.userId,
          redirectUrls: JSON.stringify(args.redirectUris),
          disabled: false,
          type: "web",
          metadata: JSON.stringify(metadata),
          createdAt: now,
          updatedAt: now,
        },
      },
    })) as { _id: string }

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

    const newSecretPlain = `idn_sk_${base64Url(randomBytes(24))}`
    const newSecretHash = await sha256Hex(newSecretPlain)

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
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: MODEL,
        where: [{ field: "_id", value: doc._id, operator: "eq" }],
      },
    })
    return null
  },
})

/**
 * Métriques d'usage — mock pour la phase MVP (cf. cahier des charges
 * "Quotas & usage"). Les vraies métriques arriveront via une agrégation
 * des `oauthAccessToken` + logs HTTP en Phase 2.
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
  }),
  handler: async (ctx, args) => {
    void args
    const user = await getCurrentAuthUser(ctx)
    if (!user || !user.roles.includes("developer")) {
      return {
        requestsThisMonth: 0,
        requestsQuota: 100_000,
        requestsDelta: "—",
        latencyP95Ms: 0,
        error4xxRate: "—",
        series: [],
      }
    }
    return {
      requestsThisMonth: 38542,
      requestsQuota: 100_000,
      requestsDelta: "+38.5%",
      latencyP95Ms: 142,
      error4xxRate: "0.42%",
      series: [12, 18, 9, 22, 27, 31, 24, 19, 25, 29, 33, 28, 35, 30, 32, 38, 41],
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
