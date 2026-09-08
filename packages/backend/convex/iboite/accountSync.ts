import type { GenericMutationCtx } from "convex/server"

import type { DataModel, Doc } from "../_generated/dataModel"
import { emitWebhookEvent } from "../webhooks/emission"
import type { IboiteCounters } from "../webhooks/catalog"

/** Met à jour les compteurs/version et crée l'événement dans la même transaction. */
export async function updateAccountCounters(
  ctx: GenericMutationCtx<DataModel>,
  account: Doc<"iboiteAccount">,
  counters: IboiteCounters,
  now = Date.now(),
): Promise<number> {
  const accountVersion = (account.syncVersion ?? 0) + 1
  await ctx.db.patch(account._id, {
    counters,
    syncVersion: accountVersion,
    updatedAt: now,
  })
  await emitWebhookEvent(ctx, {
    type: "iboite.account.updated",
    subject: account.userId,
    data: { accountVersion, counters },
  })
  return accountVersion
}
