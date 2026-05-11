import { ConvexError, v } from "convex/values"

import { components, internal } from "./_generated/api"
import { mutation, query } from "./_generated/server"
import { authComponent, createAuth } from "./auth"
import { getCurrentAuthUser, requireAuth } from "./lib/auth"

/**
 * Consentements OAuth (§3.3).
 *
 * Better Auth stocke les consentements dans la table `oauthConsent` du
 * composant. On expose ici des wrappers qui :
 *   - listent les consentements de l'utilisateur via `auth.api.getOAuthConsents`
 *   - récupèrent les détails de l'app cliente via `auth.api.getOAuthClientPublic`
 *   - révoquent un consentement via `auth.api.deleteOAuthConsent`
 *   - écrivent un audit trail à chaque révocation
 */

type ConsentDoc = {
  _id: string
  userId: string
  clientId: string
  scopes?: string[] | string | null
  consentGiven?: boolean | null
  createdAt?: Date | number | null
  updatedAt?: Date | number | null
}

type OAuthClientDoc = {
  name?: string | null
  icon?: string | null
}

function tsOf(value: Date | number | undefined | null): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  return value
}

function parseScopes(raw: string[] | string | null | undefined): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean).map((s) => String(s))
  // Better Auth stocke les scopes en string séparé par espaces (OAuth standard)
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      clientId: v.string(),
      appName: v.string(),
      appIcon: v.union(v.string(), v.null()),
      scopes: v.array(v.string()),
      grantedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    // Lecture gracieuse pour éviter le UNAUTHENTICATED pendant l'init du
    // Convex client (mêmes raisons que sessions.listMine).
    const user = await getCurrentAuthUser(ctx)
    if (!user) return []

    // Adapter direct (index `userId`) plutôt que `auth.api.getOAuthConsents`
    // pour éviter les warnings d'index compound.
    let raw: { page: ConsentDoc[]; isDone: boolean; continueCursor?: string }
    try {
      raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
        model: "oauthConsent",
        where: [{ field: "userId", value: user.userId, operator: "eq" }],
        paginationOpts: { numItems: 200, cursor: null },
      })) as { page: ConsentDoc[]; isDone: boolean; continueCursor?: string }
    } catch {
      return []
    }

    // Filtre par consentement effectivement accordé.
    const own = raw.page.filter((c) => c.consentGiven !== false)

    let auth: ReturnType<typeof createAuth> | null = null
    let headers: Headers | null = null
    try {
      const got = await authComponent.getAuth(createAuth, ctx)
      auth = got.auth
      headers = got.headers
    } catch {
      // pas grave — on perd juste l'enrichissement nom/icône
    }

    // Enrichissement app par app (clientId → nom/icône). Best-effort.
    const enriched = await Promise.all(
      own.map(async (c) => {
        let appName = c.clientId
        let appIcon: string | null = null
        if (auth && headers) {
          try {
            // oidcProvider expose `getOAuthClient` (au lieu de
            // `getOAuthClientPublic` du plugin oauth-provider abandonné).
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const client = (await (auth.api as any).getOAuthClient({
              params: { id: c.clientId },
              headers,
            })) as OAuthClientDoc | null
            if (client?.name) appName = client.name
            if (client?.icon) appIcon = client.icon
          } catch {
            // ignore — app inconnue ou désactivée
          }
        }
        return {
          id: c._id,
          clientId: c.clientId,
          appName,
          appIcon,
          scopes: parseScopes(c.scopes ?? null),
          grantedAt: tsOf(c.createdAt),
        }
      }),
    )

    return enriched.sort((a, b) => b.grantedAt - a.grantedAt)
  },
})

export const revoke = mutation({
  args: { consentId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    // Récupère le détail pour défense en profondeur (vérif ownership) +
    // métadonnées audit (clientId, scopes)
    const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "oauthConsent",
      where: [{ field: "userId", value: user.userId, operator: "eq" }],
      paginationOpts: { numItems: 200, cursor: null },
    })) as { page: ConsentDoc[] }
    const target = raw.page.find((c) => c._id === args.consentId)
    if (!target) {
      throw new ConvexError({
        code: "CONSENT_NOT_FOUND",
        message: "Consentement introuvable.",
      })
    }
    if (target.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Ce consentement ne vous appartient pas.",
      })
    }

    // oidcProvider n'expose pas `deleteOAuthConsent` côté API. On supprime
    // directement via l'adapter Convex (model "oauthConsent").
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: "oauthConsent",
        where: [{ field: "_id", value: args.consentId, operator: "eq" }],
      },
    })
    void auth
    void headers

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "consent_revoked",
      targetType: "consent",
      targetId: args.consentId,
      metadata: {
        clientId: target.clientId,
        scopes: parseScopes(target.scopes ?? null),
      },
    })

    return null
  },
})

/**
 * Révoque tous les consentements de l'utilisateur courant pour un client
 * OAuth donné — pratique pour forcer la ré-affichage du consent screen
 * au prochain login (le plugin oidcProvider skip auto le consent quand
 * un record `oauthConsent` existe pour le couple user+client).
 *
 * Audite chaque révocation.
 */
export const revokeForClient = mutation({
  args: { clientId: v.string() },
  returns: v.object({ revoked: v.number() }),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)

    const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "oauthConsent",
      where: [{ field: "userId", value: user.userId, operator: "eq" }],
      paginationOpts: { numItems: 200, cursor: null },
    })) as { page: ConsentDoc[] }

    const targets = raw.page.filter((c) => c.clientId === args.clientId)
    for (const t of targets) {
      await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
        input: {
          model: "oauthConsent",
          where: [{ field: "_id", value: t._id, operator: "eq" }],
        },
      })
      await ctx.runMutation(internal.audit.recordAudit, {
        actorId: user.userId,
        action: "consent_revoked",
        targetType: "consent",
        targetId: t._id,
        metadata: {
          clientId: t.clientId,
          scopes: parseScopes(t.scopes ?? null),
        },
      })
    }

    return { revoked: targets.length }
  },
})
