import { makeFunctionReference } from "convex/server"
import { v } from "convex/values"

import { internalMutation } from "../_generated/server"
import { derivePivotKeys } from "../lib/identity"

/**
 * Backfill des clés de rapprochement `pivotKey` / `nipKey` sur les profils
 * créés avant leur introduction.
 *
 *   bunx convex run _dev/backfillPivotKey:run
 *
 * Idempotent : ne réécrit que les lignes dont les clés sont absentes ou
 * périmées. Relançable sans effet de bord, et sûr à exécuter pendant que le
 * trafic tourne.
 *
 * PAGINÉ ET AUTO-RELANCÉ, contrairement aux backfills `_dev` plus anciens qui
 * itèrent la table entière : une mutation Convex ne peut lire que 16 384
 * documents, et un `for await` sur `userProfile` échouerait donc dès que la
 * base dépasse cette taille. Chaque page se replanifie via le scheduler, ce
 * qui découpe le travail en autant de transactions courtes.
 *
 * Ce backfill ne signale ni ne bloque rien : il se contente de rendre les
 * comptes existants visibles du rapprochement. Les doublons déjà en base
 * apparaîtront ensuite dans la vue admin, où un humain tranchera — aucun
 * compte n'est fermé ni rétrogradé automatiquement.
 */
const PAGE_SIZE = 200

/**
 * Auto-référence pour la replanification.
 *
 * Passer par `makeFunctionReference` plutôt que par `internal._dev.…` est
 * nécessaire, pas cosmétique : `internal` type l'API entière, si bien qu'une
 * fonction qui s'y référence elle-même rend son propre type circulaire.
 * TypeScript renonce alors à l'inférer, et l'abandon se propage à tout le
 * graphe de modules — on obtient des dizaines de `implicitly has type 'any'`
 * dans des fichiers sans rapport (`auth.ts`, `sessions.ts`…). Résoudre la
 * fonction par son nom coupe le cycle à la racine.
 */
const SELF = makeFunctionReference<
  "mutation",
  { cursor?: string | null; patchedSoFar?: number },
  { patched: number; done: boolean }
>("_dev/backfillPivotKey:run")

export const run = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
    patchedSoFar: v.optional(v.number()),
  },
  returns: v.object({
    patched: v.number(),
    done: v.boolean(),
  }),
  // Annotation explicite obligatoire : ce handler se replanifie lui-même via
  // `internal._dev.backfillPivotKey.run`, donc son type se référencerait
  // lui-même. Sans elle, TypeScript abandonne l'inférence et la contamine de
  // proche en proche dans tout le graphe de modules.
  handler: async (ctx, args): Promise<{ patched: number; done: boolean }> => {
    const page = await ctx.db.query("userProfile").paginate({
      numItems: PAGE_SIZE,
      cursor: args.cursor ?? null,
    })

    let patched = args.patchedSoFar ?? 0
    for (const profile of page.page) {
      // Profil anonymisé : ses clés ont été volontairement effacées, les
      // recalculer le remettrait dans les rapprochements.
      if (profile.deletedAt) continue

      if (!profile.pivot) {
        // Pas d'identité à rapprocher. On nettoie une clé résiduelle si le
        // pivot a été retiré sans que la clé suive.
        if (profile.pivotKey !== undefined || profile.nipKey !== undefined) {
          await ctx.db.patch(profile._id, {
            pivotKey: undefined,
            nipKey: undefined,
          })
          patched++
        }
        continue
      }

      const { pivotKey, nipKey } = derivePivotKeys(profile.pivot)
      if (profile.pivotKey === pivotKey && profile.nipKey === nipKey) continue

      await ctx.db.patch(profile._id, { pivotKey, nipKey })
      patched++
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, SELF, {
        cursor: page.continueCursor,
        patchedSoFar: patched,
      })
    }

    return { patched, done: page.isDone }
  },
})
