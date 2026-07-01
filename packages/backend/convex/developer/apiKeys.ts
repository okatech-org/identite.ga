import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { internalMutation, mutation, query } from "../_generated/server"
import type { ActionCtx } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { getCurrentAuthUser, requireDeveloper } from "../lib/auth"
import {
  generateApiToken,
  hashToken,
  looksLikeApiToken,
} from "../lib/secureToken"

/**
 * Portail développeur — clés API (PAT / M2M) « maison ».
 *
 * Surface équivalente au composant `convex-api-tokens` mais sans dépendance
 * tierce : émission, listing, révocation, validation. Le secret n'est jamais
 * stocké en clair (seul son hash SHA-256, indexé `by_tokenHash` pour une
 * validation O(1)) ni ré-affichable — il est renvoyé une seule fois à la
 * création. Cf. lib/secureToken.ts.
 *
 * Ces clés authentifient des appels serveur-à-serveur HORS session OAuth.
 * Elles ne touchent PAS au `clientSecret` des apps OAuth (propriété du
 * composant Better Auth, cf. developer/apps.ts).
 *
 * ── Validation HTTP ────────────────────────────────────────────────────────
 * Pour protéger un endpoint `httpAction`, monté dans convex/http.ts :
 *
 *   import { authenticateApiKey } from "./developer/apiKeys"
 *   const handler = httpAction(async (ctx, request) => {
 *     const auth = await authenticateApiKey(ctx, request)
 *     if (!auth) return new Response("Unauthorized", { status: 401 })
 *     if (!auth.scopes.includes("apps:read")) {
 *       return new Response("Forbidden", { status: 403 })
 *     }
 *     // ... auth.userId / auth.scopes disponibles
 *   })
 */

// Garde-fous (alignés sur l'esprit de developer/apps.ts).
const MAX_KEYS_PER_DEV = 25
const MAX_SCOPES = 20
const MAX_EXPIRES_DAYS = 365
const SCOPE_RE = /^[a-z0-9][a-z0-9:_-]{0,63}$/

export const VALID_M2M_SCOPES = [
  "citizens:resolve",
  "idn:delegate:lookup",
  "idn:delegate:create",
  "idn:delegate:status",
] as const
const DAY_MS = 24 * 60 * 60 * 1000

const KEY_STATUS = v.union(
  v.literal("active"),
  v.literal("expired"),
  v.literal("revoked"),
)

const KEY_DTO = v.object({
  id: v.id("developerApiKey"),
  name: v.string(),
  tokenPrefix: v.string(),
  scopes: v.array(v.string()),
  createdAt: v.number(),
  expiresAt: v.union(v.number(), v.null()),
  lastUsedAt: v.union(v.number(), v.null()),
  revokedAt: v.union(v.number(), v.null()),
  status: KEY_STATUS,
})

function normalizeScopes(scopes: string[] | undefined): string[] {
  if (!scopes || scopes.length === 0) return []
  if (scopes.length > MAX_SCOPES) {
    throw new ConvexError({
      code: "TOO_MANY_SCOPES",
      message: `Maximum ${MAX_SCOPES} scopes par clé.`,
    })
  }
  const out: string[] = []
  for (const raw of scopes) {
    const s = raw.trim().toLowerCase()
    if (!s) continue
    if (!SCOPE_RE.test(s)) {
      throw new ConvexError({
        code: "INVALID_SCOPE",
        message: `Scope invalide : ${raw} (a-z, 0-9, : _ -).`,
      })
    }
    if (!(VALID_M2M_SCOPES as readonly string[]).includes(s)) {
      throw new ConvexError({
        code: "UNKNOWN_SCOPE",
        message: `Scope inconnu : ${s}. Valides : ${VALID_M2M_SCOPES.join(", ")}.`,
      })
    }
    if (!out.includes(s)) out.push(s)
  }
  return out
}

function serializeKey(k: Doc<"developerApiKey">) {
  const status: "active" | "expired" | "revoked" = k.revokedAt
    ? "revoked"
    : k.expiresAt !== undefined && k.expiresAt < Date.now()
      ? "expired"
      : "active"
  return {
    id: k._id,
    name: k.name,
    tokenPrefix: k.tokenPrefix,
    scopes: k.scopes,
    createdAt: k.createdAt,
    expiresAt: k.expiresAt ?? null,
    lastUsedAt: k.lastUsedAt ?? null,
    revokedAt: k.revokedAt ?? null,
    status,
  }
}

/**
 * Crée une clé API. Le secret complet est renvoyé UNE SEULE FOIS — il ne peut
 * plus être relu ensuite (seul `tokenPrefix` reste visible).
 */
export const createKey = mutation({
  args: {
    name: v.string(),
    scopes: v.optional(v.array(v.string())),
    expiresInDays: v.optional(v.number()),
  },
  returns: v.object({
    id: v.id("developerApiKey"),
    token: v.string(), // ⚠️ secret en clair, affiché une seule fois
    tokenPrefix: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)

    const name = args.name.trim()
    if (!name) {
      throw new ConvexError({ code: "INVALID_INPUT", message: "Nom requis." })
    }
    if (name.length > 80) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message: "Nom trop long (80 caractères max).",
      })
    }

    const scopes = normalizeScopes(args.scopes)

    let expiresAt: number | undefined
    if (args.expiresInDays !== undefined) {
      const days = Math.floor(args.expiresInDays)
      if (!Number.isFinite(days) || days < 1 || days > MAX_EXPIRES_DAYS) {
        throw new ConvexError({
          code: "INVALID_INPUT",
          message: `Expiration invalide (1 à ${MAX_EXPIRES_DAYS} jours).`,
        })
      }
      expiresAt = Date.now() + days * DAY_MS
    }

    // Borne le nombre de clés actives par développeur.
    const existing = await ctx.db
      .query("developerApiKey")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .take(MAX_KEYS_PER_DEV + 1)
    const activeCount = existing.filter((k) => k.revokedAt === undefined).length
    if (activeCount >= MAX_KEYS_PER_DEV) {
      throw new ConvexError({
        code: "TOO_MANY_KEYS",
        message: `Maximum ${MAX_KEYS_PER_DEV} clés actives. Révoquez-en une d'abord.`,
      })
    }

    const { token, tokenHash, tokenPrefix } = await generateApiToken()
    const now = Date.now()
    const id = await ctx.db.insert("developerApiKey", {
      userId: user.userId,
      name,
      tokenHash,
      tokenPrefix,
      scopes,
      createdAt: now,
      expiresAt,
    })

    return { id, token, tokenPrefix }
  },
})

/** Liste les clés du développeur courant — n'expose jamais le secret/hash. */
export const listKeys = query({
  args: {},
  returns: v.array(KEY_DTO),
  handler: async (ctx) => {
    // Lecture gracieuse (cf. developer/apps.listMine) : [] tant que la session
    // ou le rôle ne sont pas encore en place.
    const user = await getCurrentAuthUser(ctx)
    if (!user || !user.roles.includes("developer")) return []
    const rows = await ctx.db
      .query("developerApiKey")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .order("desc")
      .take(100)
    return rows.map(serializeKey)
  },
})

/** Révoque une clé (irréversible). Idempotent si déjà révoquée. */
export const revokeKey = mutation({
  args: { keyId: v.id("developerApiKey") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireDeveloper(ctx)
    const row = await ctx.db.get(args.keyId)
    if (!row) {
      throw new ConvexError({ code: "NOT_FOUND", message: "Clé introuvable." })
    }
    if (row.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cette clé ne vous appartient pas.",
      })
    }
    if (row.revokedAt === undefined) {
      await ctx.db.patch(args.keyId, { revokedAt: Date.now() })
    }
    return null
  },
})

/**
 * Valide un hash de jeton présenté et met à jour `lastUsedAt`. Interne : appelé
 * par `authenticateApiKey` depuis le contexte HTTP (qui n'a pas accès à
 * `ctx.db`). Renvoie le principal, ou `null` si le jeton est inconnu, révoqué
 * ou expiré.
 */
export const _verify = internalMutation({
  args: { tokenHash: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.string(),
      scopes: v.array(v.string()),
      keyId: v.id("developerApiKey"),
    }),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("developerApiKey")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique()
    if (!row) return null
    if (row.revokedAt !== undefined) return null
    if (row.expiresAt !== undefined && row.expiresAt < Date.now()) return null
    await ctx.db.patch(row._id, { lastUsedAt: Date.now() })
    return { userId: row.userId, scopes: row.scopes, keyId: row._id }
  },
})

/**
 * Helper de validation HTTP. À appeler depuis un `httpAction` : extrait le
 * jeton du header `Authorization: Bearer <token>`, le hashe et le valide.
 * Renvoie le principal (`userId` + `scopes`) ou `null`. Voir l'exemple de
 * montage en tête de fichier.
 */
export async function authenticateApiKey(
  ctx: ActionCtx,
  request: Request,
): Promise<{
  userId: string
  scopes: string[]
  keyId: Id<"developerApiKey">
} | null> {
  const header = request.headers.get("authorization") ?? ""
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim())
  if (!match) return null
  const presented = match[1]!
  if (!looksLikeApiToken(presented)) return null
  const tokenHash = await hashToken(presented)
  return await ctx.runMutation(internal.developer.apiKeys._verify, { tokenHash })
}
