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

/** Mutation publique IDN avec triggers d'agrégats. */
export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB))

/** Mutation interne IDN avec triggers d'agrégats. */
export const internalMutation = customMutation(
  rawInternalMutation,
  customCtx(triggers.wrapDB),
)
