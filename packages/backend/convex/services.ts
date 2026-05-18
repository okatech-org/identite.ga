import { v } from "convex/values"

import { components } from "./_generated/api"
import { query } from "./_generated/server"
import { authComponent, createAuth } from "./auth"
import { getCurrentAuthUser } from "./lib/auth"

/**
 * Catalogue de services citoyen.
 *
 * Modèle : ce sont les apps développeurs (table `oauthApplication`) qui
 * publient les services qu'elles proposent, via leur `metadata.services`.
 * Format attendu dans metadata (JSON, déjà parsé côté developer/apps.ts) :
 *
 *   {
 *     ...,
 *     "services": [
 *       {
 *         "id": "unique-slug",
 *         "label": "Déclaration fiscale 2025",
 *         "description": "Déposez votre déclaration en ligne",
 *         "category": "finance",
 *         "link": "https://impots.ga/decl"
 *       }
 *     ]
 *   }
 *
 * Le mobile ne fait que servir de pont :
 *  - il liste les services des applications auxquelles le citoyen a
 *    consenti (table `oauthConsent`)
 *  - il les regroupe par catégorie (notre liste fixe ci-dessous)
 *  - cliquer sur un service ouvre le `link` externe (deeplink / WebBrowser)
 *
 * Pas de suivi de démarche à ce stade.
 */

export const SERVICE_CATEGORIES = [
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

const CATEGORY_VALIDATOR = v.union(
  ...SERVICE_CATEGORIES.map((c) => v.literal(c)),
)

const SERVICE_DTO = v.object({
  id: v.string(),
  clientId: v.string(),
  appName: v.string(),
  appIcon: v.union(v.string(), v.null()),
  label: v.string(),
  description: v.string(),
  category: CATEGORY_VALIDATOR,
  link: v.string(),
})

type ConsentDoc = {
  _id: string
  userId: string
  clientId: string
  consentGiven?: boolean | null
}

type OAuthAppDoc = {
  _id: string
  clientId?: string | null
  name?: string | null
  icon?: string | null
  metadata?: string | null
  disabled?: boolean | null
}

type RawService = {
  id?: unknown
  label?: unknown
  description?: unknown
  category?: unknown
  link?: unknown
}

function asString(x: unknown, fallback = ""): string {
  return typeof x === "string" ? x : fallback
}

function asCategory(x: unknown): ServiceCategory {
  if (typeof x === "string" && (SERVICE_CATEGORIES as readonly string[]).includes(x)) {
    return x as ServiceCategory
  }
  return "other"
}

function parseServices(rawMeta: string | null | undefined): RawService[] {
  if (!rawMeta) return []
  try {
    const obj = JSON.parse(rawMeta) as { services?: unknown }
    if (!Array.isArray(obj.services)) return []
    return obj.services as RawService[]
  } catch {
    return []
  }
}

/**
 * Catalogue des services accessibles au citoyen courant — uniquement les
 * services publiés par les apps auxquelles il a consenti.
 */
export const listForCurrentUser = query({
  args: {},
  returns: v.array(SERVICE_DTO),
  handler: async (ctx) => {
    const user = await getCurrentAuthUser(ctx)
    if (!user) return []

    // Récupère les consents actifs
    let consentsRaw: { page: ConsentDoc[] }
    try {
      consentsRaw = (await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
          model: "oauthConsent",
          where: [{ field: "userId", value: user.userId, operator: "eq" }],
          paginationOpts: { numItems: 200, cursor: null },
        },
      )) as { page: ConsentDoc[] }
    } catch {
      return []
    }

    const clientIds = Array.from(
      new Set(
        consentsRaw.page
          .filter((c) => c.consentGiven !== false)
          .map((c) => c.clientId),
      ),
    )
    if (clientIds.length === 0) return []

    // Pour chaque clientId, charge l'app (metadata.services)
    const out: Array<{
      id: string
      clientId: string
      appName: string
      appIcon: string | null
      label: string
      description: string
      category: ServiceCategory
      link: string
    }> = []

    // Best-effort enrichment via getOAuthClient pour récupérer le nom/icône
    let auth: ReturnType<typeof createAuth> | null = null
    let headers: Headers | null = null
    try {
      const got = await authComponent.getAuth(createAuth, ctx)
      auth = got.auth
      headers = got.headers
    } catch {
      // ok
    }

    for (const clientId of clientIds) {
      // Récupère l'app par clientId
      let appRaw: { page: OAuthAppDoc[] }
      try {
        appRaw = (await ctx.runQuery(
          components.betterAuth.adapter.findMany,
          {
            model: "oauthApplication",
            where: [{ field: "clientId", value: clientId, operator: "eq" }],
            paginationOpts: { numItems: 1, cursor: null },
          },
        )) as { page: OAuthAppDoc[] }
      } catch {
        continue
      }
      const app = appRaw.page[0]
      if (!app || app.disabled) continue

      const services = parseServices(app.metadata)
      if (services.length === 0) continue

      let appName = app.name ?? clientId
      let appIcon: string | null = app.icon ?? null
      if (auth && headers) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const client = (await (auth.api as any).getOAuthClient({
            params: { id: clientId },
            headers,
          })) as { name?: string; icon?: string } | null
          if (client?.name) appName = client.name
          if (client?.icon) appIcon = client.icon
        } catch {
          // ignore
        }
      }

      for (const s of services) {
        const sid = asString(s.id)
        const label = asString(s.label)
        const link = asString(s.link)
        if (!sid || !label || !link) continue
        out.push({
          id: `${clientId}:${sid}`,
          clientId,
          appName,
          appIcon,
          label,
          description: asString(s.description),
          category: asCategory(s.category),
          link,
        })
      }
    }

    return out
  },
})

export const listCategories = query({
  args: {},
  returns: v.array(
    v.object({
      id: CATEGORY_VALIDATOR,
      label: v.string(),
    }),
  ),
  handler: async () => {
    return [
      { id: "administrative" as const, label: "Administratif" },
      { id: "civilStatus" as const, label: "État civil" },
      { id: "fiscal" as const, label: "Fiscalité" },
      { id: "education" as const, label: "Éducation" },
      { id: "health" as const, label: "Santé" },
      { id: "transport" as const, label: "Transport" },
      { id: "social" as const, label: "Social" },
      { id: "other" as const, label: "Autres" },
    ]
  },
})

export const get = query({
  args: { id: v.string() },
  returns: v.union(SERVICE_DTO, v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentAuthUser(ctx)
    if (!user) return null
    // id = `${clientId}:${serviceId}`
    const sep = args.id.indexOf(":")
    if (sep <= 0) return null
    const clientId = args.id.slice(0, sep)
    const serviceId = args.id.slice(sep + 1)

    // Vérifie le consent
    let consentsRaw: { page: ConsentDoc[] }
    try {
      consentsRaw = (await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
          model: "oauthConsent",
          where: [
            { field: "userId", value: user.userId, operator: "eq" },
            { field: "clientId", value: clientId, operator: "eq" },
          ],
          paginationOpts: { numItems: 1, cursor: null },
        },
      )) as { page: ConsentDoc[] }
    } catch {
      return null
    }
    if (consentsRaw.page.length === 0) return null

    // Charge l'app
    let appRaw: { page: OAuthAppDoc[] }
    try {
      appRaw = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
        model: "oauthApplication",
        where: [{ field: "clientId", value: clientId, operator: "eq" }],
        paginationOpts: { numItems: 1, cursor: null },
      })) as { page: OAuthAppDoc[] }
    } catch {
      return null
    }
    const app = appRaw.page[0]
    if (!app) return null
    const services = parseServices(app.metadata)
    const service = services.find((s) => asString(s.id) === serviceId)
    if (!service) return null

    return {
      id: args.id,
      clientId,
      appName: app.name ?? clientId,
      appIcon: app.icon ?? null,
      label: asString(service.label),
      description: asString(service.description),
      category: asCategory(service.category),
      link: asString(service.link),
    }
  },
})
