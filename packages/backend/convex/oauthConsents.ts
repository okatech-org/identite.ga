import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
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
  id: string
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

    let result: { auth: ReturnType<typeof createAuth>; headers: Headers }
    try {
      result = await authComponent.getAuth(createAuth, ctx)
    } catch {
      return []
    }
    const { auth, headers } = result

    let consents: ConsentDoc[] = []
    try {
      const list = (await auth.api.getOAuthConsents({
        headers,
      })) as unknown as ConsentDoc[] | null
      consents = list ?? []
    } catch {
      return []
    }

    // Filtre stricte par user (sécurité défense en profondeur — Better Auth filtre
    // déjà par session) et par consentement effectivement accordé.
    const own = consents.filter(
      (c) => c.userId === user.userId && c.consentGiven !== false,
    )

    // Enrichissement app par app (clientId → nom/icône). Best-effort : si
    // l'app n'est pas trouvée, on retombe sur le clientId comme nom.
    const enriched = await Promise.all(
      own.map(async (c) => {
        let appName = c.clientId
        let appIcon: string | null = null
        try {
          const client = (await auth.api.getOAuthClientPublic({
            query: { client_id: c.clientId },
            headers,
          })) as OAuthClientDoc | null
          if (client?.name) appName = client.name
          if (client?.icon) appIcon = client.icon
        } catch {
          // ignore — app inconnue ou désactivée
        }
        return {
          id: c.id,
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
    const consents = (await auth.api.getOAuthConsents({
      headers,
    })) as unknown as ConsentDoc[] | null
    const target = consents?.find((c) => c.id === args.consentId)
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

    await auth.api.deleteOAuthConsent({
      body: { id: args.consentId },
      headers,
    })

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
