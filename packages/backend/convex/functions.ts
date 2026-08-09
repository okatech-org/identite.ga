/**
 * Wrappers de mutations IDN avec triggers convex-helpers.
 *
 * Les mutations qui touchent les tables `userProfile`, `kycRequest` (et
 * plus tard `auditLog`) DOIVENT s'importer depuis ce fichier (et **pas**
 * depuis `_generated/server`) pour que les agrégats
 * `usersByLoa` / `usersByProfile` / `kycByStatus` restent synchronisés
 * automatiquement à chaque insert/update/delete.
 *
 * Pattern documenté : https://stack.convex.dev/triggers
 * Ressource projet : stack-technique.md §5.6.
 */
import { Triggers } from "convex-helpers/server/triggers"
import {
  customCtx,
  customMutation,
} from "convex-helpers/server/customFunctions"

import { kycByStatus, usersByLoa, usersByProfile } from "./aggregates"
import { internal } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import {
  internalMutation as rawInternalMutation,
  mutation as rawMutation,
} from "./_generated/server"

const triggers = new Triggers<DataModel>()

// userProfile → usersByLoa + usersByProfile
triggers.register("userProfile", async (ctx, change) => {
  if (change.operation === "insert") {
    await usersByLoa.insertIfDoesNotExist(ctx, change.newDoc)
    await usersByProfile.insertIfDoesNotExist(ctx, change.newDoc)
  } else if (change.operation === "update") {
    await usersByLoa.replaceOrInsert(ctx, change.oldDoc, change.newDoc)
    await usersByProfile.replaceOrInsert(ctx, change.oldDoc, change.newDoc)
  } else if (change.operation === "delete") {
    await usersByLoa.deleteIfExists(ctx, change.oldDoc)
    await usersByProfile.deleteIfExists(ctx, change.oldDoc)
  }
})

// kycRequest → kycByStatus
triggers.register("kycRequest", async (ctx, change) => {
  if (change.operation === "insert") {
    await kycByStatus.insertIfDoesNotExist(ctx, change.newDoc)
  } else if (change.operation === "update") {
    await kycByStatus.replaceOrInsert(ctx, change.oldDoc, change.newDoc)
  } else if (change.operation === "delete") {
    await kycByStatus.deleteIfExists(ctx, change.oldDoc)
  }
})

// level3Verification → notification sortante vers les applications partenaires
// (administration.ga répliquant la file de vérification).
//
// Le trigger est LE point de notification, plutôt qu'un appel explicite dans
// chaque mutation : le cycle de vie d'une demande est touché par le citoyen
// (`verification.request`, réservation), par le contrôleur natif et par les
// agents partenaires. Notifier depuis chaque appelant reviendrait à parier
// qu'aucun chemin présent ou futur ne sera oublié — et un chemin oublié se
// traduit par une réplique qui diverge en silence, sans erreur nulle part.
triggers.register("level3Verification", async (ctx, change) => {
  const doc = change.newDoc ?? change.oldDoc
  if (!doc) return
  // Aucun partenaire configuré → on ne planifie RIEN. L'action se contentait
  // déjà de sortir sans rien faire, mais la planifier avait deux coûts réels :
  // une fonction planifiée par écriture sur tout déploiement sans partenaire
  // (développement, test, préproduction), et — sous `convex-test` — une
  // exécution APRÈS la fin de la transaction du test, que Vitest remonte en
  // « Write outside of transaction ». Décider ici est aussi plus honnête :
  // la condition « y a-t-il quelqu'un à prévenir ? » appartient à l'émetteur.
  if (!process.env.IDN_PARTNER_WEBHOOK_URL?.trim()) return
  await ctx.scheduler.runAfter(
    0,
    internal.partner.verificationWebhook.notify,
    {
      verificationId: doc._id,
      event:
        change.operation === "insert"
          ? "created"
          : change.operation === "delete"
            ? "deleted"
            : "updated",
    },
  )
})

/** Mutation publique IDN avec triggers d'agrégats. */
export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB))

/** Mutation interne IDN avec triggers d'agrégats. */
export const internalMutation = customMutation(
  rawInternalMutation,
  customCtx(triggers.wrapDB),
)
