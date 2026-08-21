import { v } from "convex/values"

import { query } from "./_generated/server"
import { isOriginTrusted } from "./lib/partnerOrigins"

/**
 * Une origine partenaire est-elle de confiance ?
 *
 * Sert à `/auth-continue` : valider CÔTÉ SERVEUR qu'un `return_to` pointe vers
 * un partenaire déclaré, avant de matérialiser une session et de rediriger.
 * Sans ce contrôle, la page devient une redirection ouverte signée par
 * identite.ga.
 *
 * Répondre oui/non ne révèle pas la liste des partenaires : c'est exactement
 * l'information qu'une sonde CORS (`authCorsHeaders`) laisse déjà filtrer. La
 * source de vérité reste `TRUSTED_ORIGINS` (cf. `lib/partnerOrigins`), commune
 * au CSRF Better Auth et au CORS.
 */
export const isTrusted = query({
  args: { origin: v.string() },
  returns: v.boolean(),
  handler: async (_ctx, args) => {
    return isOriginTrusted(process.env.TRUSTED_ORIGINS, args.origin)
  },
})
