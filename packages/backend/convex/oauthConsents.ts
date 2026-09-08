import { ConvexError, v } from "convex/values"

import { components, internal } from "./_generated/api"
import { mutation, query } from "./_generated/server"
import type { MutationCtx } from "./_generated/server"
import { authComponent, createAuth } from "./auth"
import {
  mergeConsentScopes,
  parseConsentScopes,
  resolveGrantedScopes,
  serializeConsentScopes,
} from "./lib/consentGrant"
import {
  getCurrentAuthUser,
  requireAuth,
  requireVerifiedAuth,
} from "./lib/auth"

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

async function revokeClientTokens(
  ctx: MutationCtx,
  userId: string,
  clientId: string,
): Promise<number> {
  const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model: "oauthAccessToken",
    where: [{ field: "userId", value: userId, operator: "eq" }],
    paginationOpts: { numItems: 200, cursor: null },
  })) as { page: Array<{ _id: string; clientId?: string | null }> }
  const targets = raw.page.filter((token) => token.clientId === clientId)
  for (const token of targets) {
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: "oauthAccessToken",
        where: [{ field: "_id", value: token._id, operator: "eq" }],
      },
    })
  }
  return targets.length
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
          scopes: parseConsentScopes(c.scopes ?? null),
          grantedAt: tsOf(c.createdAt),
        }
      }),
    )

    return enriched.sort((a, b) => b.grantedAt - a.grantedAt)
  },
})

/**
 * Enregistre le consentement de l'utilisateur courant pour un client OAuth,
 * depuis l'interface de ce client.
 *
 * POURQUOI — l'inscription fédérée. Quand un citoyen crée son identité IDN
 * depuis l'interface d'une application partenaire (consulat.ga), le parcours
 * enchaîne immédiatement sur un `/oauth2/authorize`. Sans consentement déjà
 * enregistré, Better Auth l'expédie sur l'écran de consentement d'identite.ga —
 * au beau milieu de son inscription, hors du parcours du partenaire.
 *
 * On ne supprime PAS l'écran : le partenaire recueille le consentement dans son
 * propre parcours, puis appelle cette mutation. Différence essentielle avec un
 * `skipConsent` : le consentement existe, il est daté, audité, visible dans
 * l'espace du citoyen et révocable par lui (cf. `listMine` / `revoke`).
 *
 * Garde-fous : session IDN vérifiée obligatoire (le citoyen consent pour
 * lui-même, jamais un tiers pour lui), client existant et actif, et scopes
 * bornés par ce que l'app a déclaré au portail développeur.
 */
export const grant = mutation({
  args: {
    clientId: v.string(),
    scopes: v.array(v.string()),
  },
  returns: v.object({
    consentId: v.string(),
    scopes: v.array(v.string()),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)

    // 1. Le client doit exister ET être actif. Sans ce contrôle, n'importe
    //    quelle chaîne deviendrait un `clientId` consenti : la liste des
    //    consentements du citoyen se remplirait d'entrées qu'il ne peut
    //    rattacher à aucune application.
    const app = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "oauthApplication",
      where: [{ field: "clientId", value: args.clientId, operator: "eq" }],
    })) as { disabled?: boolean | null; metadata?: string | null } | null

    if (!app || app.disabled) {
      throw new ConvexError({
        code: "CLIENT_NOT_FOUND",
        message: "Application OAuth inconnue ou désactivée.",
      })
    }

    // 2. Périmètre déclaré par l'app au portail développeur.
    let declaredScopes: string[] = []
    if (app.metadata) {
      try {
        const meta = JSON.parse(app.metadata) as { scopes?: unknown }
        if (Array.isArray(meta.scopes)) {
          declaredScopes = meta.scopes.map((s) => String(s))
        }
      } catch {
        // Metadata illisible : on retombe sur les seuls scopes OIDC standard.
        // Refuser tout serait pire — le citoyen resterait bloqué au milieu de
        // son inscription à cause d'une ligne de configuration corrompue.
      }
    }

    const resolved = resolveGrantedScopes({
      requested: args.scopes,
      clientScopes: declaredScopes,
    })
    if (!resolved.ok) {
      throw new ConvexError({
        code: resolved.error.toUpperCase(),
        message: resolved.message,
      })
    }

    // 3. Upsert idempotent. Le parcours partenaire peut rejouer cet appel
    //    (reprise après échec réseau, retour en arrière dans le formulaire) :
    //    créer une deuxième ligne casserait `revoke`, qui cible un seul `_id`,
    //    et afficherait deux fois la même app dans l'espace du citoyen.
    //    Lecture par index `userId` puis filtre en mémoire — même idiome que
    //    `revokeForClient` ci-dessous (le nombre de consentements par citoyen
    //    est borné par le nombre d'apps).
    const raw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
      model: "oauthConsent",
      where: [{ field: "userId", value: user.userId, operator: "eq" }],
      paginationOpts: { numItems: 200, cursor: null },
    })) as { page: ConsentDoc[] }
    const existing = raw.page.find((c) => c.clientId === args.clientId)

    const now = Date.now()

    if (existing) {
      const merged = mergeConsentScopes(
        parseConsentScopes(existing.scopes ?? null),
        resolved.value,
      )
      await ctx.runMutation(components.betterAuth.adapter.updateOne, {
        input: {
          model: "oauthConsent",
          where: [{ field: "_id", value: existing._id, operator: "eq" }],
          update: {
            scopes: serializeConsentScopes(merged),
            // Un consentement précédemment révoqué logiquement
            // (`consentGiven: false`) est ré-accordé ici, explicitement.
            consentGiven: true,
            updatedAt: now,
          },
        },
      })

      await ctx.runMutation(internal.audit.recordAudit, {
        actorId: user.userId,
        action: "consent_granted",
        targetType: "consent",
        targetId: existing._id,
        metadata: { clientId: args.clientId, scopes: merged, updated: true },
      })

      return { consentId: existing._id, scopes: merged, created: false }
    }

    const created = (await ctx.runMutation(
      components.betterAuth.adapter.create,
      {
        input: {
          model: "oauthConsent",
          data: {
            clientId: args.clientId,
            userId: user.userId,
            scopes: serializeConsentScopes(resolved.value),
            consentGiven: true,
            createdAt: now,
            updatedAt: now,
          },
        },
      },
    )) as { _id: string }

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "consent_granted",
      targetType: "consent",
      targetId: created._id,
      metadata: {
        clientId: args.clientId,
        scopes: resolved.value,
        updated: false,
      },
    })

    return { consentId: created._id, scopes: resolved.value, created: true }
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
    await revokeClientTokens(ctx, user.userId, target.clientId)
    void auth
    void headers

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "consent_revoked",
      targetType: "consent",
      targetId: args.consentId,
      metadata: {
        clientId: target.clientId,
        scopes: parseConsentScopes(target.scopes ?? null),
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
          scopes: parseConsentScopes(t.scopes ?? null),
        },
      })
    }

    await revokeClientTokens(ctx, user.userId, args.clientId)

    return { revoked: targets.length }
  },
})
