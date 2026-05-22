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
