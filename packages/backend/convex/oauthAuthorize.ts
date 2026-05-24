import { v } from "convex/values"

import { components } from "./_generated/api"
import { query } from "./_generated/server"
import { getCurrentAuthUser } from "./lib/auth"

/**
 * Helpers de l'écran de consentement OAuth — `/oauth/authorize`.
 *
 * Récupère le minimum pour afficher l'écran de consentement (cf.
 * maquette idn-desktop.jsx:100-309) :
 *   - nom de l'app, icône, redirect URIs autorisées
 *   - scopes demandés + niveau LoA exigé (depuis metadata)
 *
 * Auth requise — l'utilisateur doit être connecté pour consentir.
 */

type OAuthAppDoc = {
  _id: string
  clientId?: string | null
  name?: string | null
  icon?: string | null
  metadata?: string | null
  redirectUrls?: string | null
  disabled?: boolean | null
  userId?: string | null
}

interface AppMeta {
  scopes?: string[]
  loa?: 1 | 2 | 3
  description?: string
  env?: "sandbox" | "production"
  testUsers?: string[]
  createdBy?: string
}

const parseMetadata = (raw: string | null | undefined): AppMeta => {
  if (!raw) return {}
  try {
    return JSON.parse(raw) as AppMeta
  } catch {
    return {}
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

export const getAppForConsent = query({
  args: { clientId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      clientId: v.string(),
      name: v.string(),
      icon: v.union(v.string(), v.null()),
      redirectUris: v.array(v.string()),
      requestedScopes: v.array(v.string()),
      requiredLoA: v.union(v.literal(1), v.literal(2), v.literal(3)),
      env: v.union(v.literal("sandbox"), v.literal("production")),
      // En sandbox : true si l'email du user est dans `testUsers` ou si le user
      // est le propriétaire de l'app. En prod : toujours true.
      userAllowed: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentAuthUser(ctx)
    if (!user) return null

    let raw: { page: OAuthAppDoc[] }
    try {
      raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
        model: "oauthApplication",
        where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
        paginationOpts: { numItems: 1, cursor: null },
      })) as { page: OAuthAppDoc[] }
    } catch {
      return null
    }
    const doc = raw.page[0]
    if (!doc || doc.disabled) return null

    const meta = parseMetadata(doc.metadata)
    const env: "sandbox" | "production" =
      meta.env === "production" ? "production" : "sandbox"

    let userAllowed = true
    if (env === "sandbox") {
      const email = String(user.email ?? "").toLowerCase()
      const list = Array.isArray(meta.testUsers) ? meta.testUsers : []
      const inList = email.length > 0 && list.includes(email)
      const isOwner = Boolean(doc.userId && doc.userId === user.userId)
      userAllowed = inList || isOwner
    }

    return {
      clientId: doc.clientId ?? args.clientId,
      name: doc.name ?? args.clientId,
      icon: doc.icon ?? null,
      redirectUris: parseRedirectUrls(doc.redirectUrls),
      requestedScopes: meta.scopes ?? ["openid", "profile", "email"],
      requiredLoA: (meta.loa ?? 1) as 1 | 2 | 3,
      env,
      userAllowed,
    }
  },
})
