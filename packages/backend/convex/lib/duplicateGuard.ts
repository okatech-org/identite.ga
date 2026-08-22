import type { QueryCtx } from "../_generated/server"
import { decideIdentityCollision } from "./identity"
import type { IdentityCollisionVerdict } from "./identity"

/**
 * Contrôle anti-doublon sur l'identité déclarée, partagé par les trois points
 * d'écriture du pivot : `onboarding.completeSignup`, `profile.updatePivot` et
 * `profile.updateNip`. Une seule règle, un seul jeu de tests — un contrôle
 * dupliqué à trois endroits finirait par diverger, et la divergence rouvrirait
 * silencieusement le contournement « je m'inscris sous un faux nom, puis je le
 * corrige ».
 *
 * SÛRETÉ DE LA COURSE. Deux inscriptions simultanées sur la même identité ne
 * peuvent pas passer toutes les deux : les mutations Convex sont des
 * transactions sérialisables à contrôle de concurrence optimiste. Lire via
 * `withIndex` inscrit la **plage d'index** consultée dans le read set ; une
 * insertion concurrente dans cette plage invalide la transaction, qui est
 * rejouée et voit alors le profil de l'autre. Cette garantie tient à deux
 * conditions, toutes deux structurantes :
 *   1. la lecture passe par un index (un `.filter()` sur scan complet serait à
 *      la fois ruineux et, sur une table entière, un aimant à conflits) ;
 *   2. lecture et écriture sont dans la MÊME mutation — jamais depuis une
 *      action (hors transaction), jamais scindées en deux `runMutation`.
 */

/** Nombre de porteurs d'une même clé examinés. Au-delà, il ne s'agit plus d'un
 *  doublon mais d'un incident à traiter en admin, pas sur le chemin d'un
 *  signup. Borne la lecture pour ne pas transformer une clé dégénérée (une
 *  date de naissance au 1ᵉʳ janvier très commune, par exemple) en scan. */
const MAX_MATCHES = 50

export type IdentityMatch = {
  userId: string
  loa: number
  signal: "pivot" | "nip"
  groupKey: string
}

export type CollisionAssessment = {
  verdict: IdentityCollisionVerdict
  /** Renseigné seulement quand `verdict === "refuse"`. */
  blockedBy?: "pivot" | "nip"
  matches: IdentityMatch[]
}

/**
 * `excludeUserId` : le compte qui écrit. Indispensable sur `updatePivot` —
 * sans lui, un citoyen vérifié qui corrige une faute de frappe dans son propre
 * nom se verrait refuser sa propre identité.
 */
export async function assessIdentityCollision(
  ctx: QueryCtx,
  args: {
    pivotKey?: string
    nipKey?: string
    excludeUserId?: string
  },
): Promise<CollisionAssessment> {
  const matches: IdentityMatch[] = []

  const collect = async (
    signal: "pivot" | "nip",
    key: string | undefined,
  ): Promise<IdentityMatch[]> => {
    if (!key) return []
    const rows =
      signal === "pivot"
        ? await ctx.db
            .query("userProfile")
            .withIndex("by_pivotKey", (q) => q.eq("pivotKey", key))
            .take(MAX_MATCHES)
        : await ctx.db
            .query("userProfile")
            .withIndex("by_nipKey", (q) => q.eq("nipKey", key))
            .take(MAX_MATCHES)

    const found: IdentityMatch[] = []
    for (const row of rows) {
      // Un compte anonymisé ne bloque plus rien : la personne qui a exercé son
      // droit à l'effacement doit pouvoir se réinscrire. (`pivotKey`/`nipKey`
      // sont d'ailleurs vidés à l'anonymisation — ce filtre est la ceinture.)
      if (row.deletedAt) continue
      if (args.excludeUserId && row.userId === args.excludeUserId) continue
      found.push({ userId: row.userId, loa: row.loa, signal, groupKey: key })
    }
    return found
  }

  const pivotMatches = await collect("pivot", args.pivotKey)
  const nipMatches = await collect("nip", args.nipKey)
  matches.push(...pivotMatches, ...nipMatches)

  // Le NIP est évalué en premier pour l'attribution du blocage : c'est un
  // identifiant censé être unique, donc un motif de refus plus solide qu'un
  // triplet d'état civil, et le message rendu au citoyen doit désigner la
  // bonne cause.
  const nipVerdict = decideIdentityCollision(nipMatches)
  if (nipVerdict === "refuse") {
    return { verdict: "refuse", blockedBy: "nip", matches }
  }
  const pivotVerdict = decideIdentityCollision(pivotMatches)
  if (pivotVerdict === "refuse") {
    return { verdict: "refuse", blockedBy: "pivot", matches }
  }

  return {
    verdict: matches.length > 0 ? "flag" : "allow",
    matches,
  }
}
