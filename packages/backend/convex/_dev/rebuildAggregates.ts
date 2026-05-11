import { internalMutation } from "../_generated/server"
import { kycByStatus, usersByLoa, usersByProfile } from "../aggregates"

/**
 * Backfill one-shot des agrégats Convex.
 *
 * Re-construit `usersByLoa`, `usersByProfile` et `kycByStatus` à partir
 * des tables `userProfile` et `kycRequest`. À exécuter quand on installe
 * la console admin sur une base où ces agrégats n'ont jamais été
 * synchronisés (cf. ressources/stack-technique.md §5.6).
 *
 * Sécurité : `internalMutation`, donc invocable uniquement via
 * `bunx convex run _dev/rebuildAggregates:run`.
 *
 * Idempotent : on `.clear()` puis on `.insertIfDoesNotExist()` pour chaque
 * ligne. Lance-le autant de fois que tu veux.
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    await usersByLoa.clear(ctx)
    await usersByProfile.clear(ctx)
    await kycByStatus.clear(ctx)

    let users = 0
    for await (const doc of ctx.db.query("userProfile")) {
      await usersByLoa.insertIfDoesNotExist(ctx, doc)
      await usersByProfile.insertIfDoesNotExist(ctx, doc)
      users++
    }

    let kycs = 0
    for await (const doc of ctx.db.query("kycRequest")) {
      await kycByStatus.insertIfDoesNotExist(ctx, doc)
      kycs++
    }

    return { users, kycs }
  },
})
