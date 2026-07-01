/**
 * Utilitaires DEV.
 *
 * À n'utiliser qu'en environnement de développement / test. Toutes les
 * fonctions exposées ici sont des `internalMutation`/`internalAction`, donc
 * non joignables depuis le client public — elles s'invoquent uniquement via
 * la CLI Convex (`bunx convex run dev:<nom>`) ou depuis du code serveur.
 */

import { v } from "convex/values"

import { components } from "./_generated/api"
import { internalMutation } from "./_generated/server"
import { generateApiToken } from "./lib/secureToken"
import { VALID_M2M_SCOPES } from "./developer/apiKeys"

/**
 * Réinitialise TOUS les rate-limits (toutes les définitions, tous les
 * utilisateurs). Utile quand on a saturé un quota en testant et qu'on veut
 * repartir d'une ardoise vierge.
 *
 * Usage :
 *   bunx convex run dev:clearAllRateLimits
 *
 * NE JAMAIS appeler en production.
 */
export const clearAllRateLimits = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Le composant purge par lots de 100 lignes et se reschedule
    // automatiquement tant qu'il en reste — un seul appel suffit.
    await ctx.runMutation(components.rateLimiter.lib.clearAll, {})
    return null
  },
})

/**
 * Crée une clé API M2M avec tous les scopes, sans session développeur.
 * Le token est affiché UNE SEULE FOIS dans la sortie CLI.
 *
 * Usage :
 *   bunx convex run dev:createM2mApiKey '{"ownerLabel":"gabon-gouv"}'
 *
 * NE JAMAIS appeler en production.
 */
export const createM2mApiKey = internalMutation({
  args: {
    ownerLabel: v.string(),
  },
  returns: v.object({
    token: v.string(),
    tokenPrefix: v.string(),
    id: v.id("developerApiKey"),
    scopes: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const scopes = [...VALID_M2M_SCOPES]
    const { token, tokenHash, tokenPrefix } = await generateApiToken()
    const now = Date.now()
    const id = await ctx.db.insert("developerApiKey", {
      userId: `dev-script:${args.ownerLabel}`,
      name: `M2M – ${args.ownerLabel}`,
      tokenHash,
      tokenPrefix,
      scopes,
      createdAt: now,
    })
    return { token, tokenPrefix, id, scopes }
  },
})
