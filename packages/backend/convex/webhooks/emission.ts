import type { GenericMutationCtx } from "convex/server"

import { internal } from "../_generated/api"
import type { DataModel, Id } from "../_generated/dataModel"
import {
  buildWebhookEnvelope,
  WEBHOOK_EVENT_CATALOG,
  type WebhookEventInput,
} from "./catalog"
import { WEBHOOK_RETENTION_MS } from "./policy"

/**
 * Point d'émission unique. L'insertion de l'événement est exécutée dans la
 * transaction métier appelante ; seule la livraison HTTP est différée.
 */
export async function emitWebhookEvent(
  ctx: GenericMutationCtx<DataModel>,
  input: WebhookEventInput,
): Promise<Id<"webhookEvents">> {
  const createdAt = Date.now()
  const eventId = `evt_${crypto.randomUUID().replaceAll("-", "")}`
  const contract = WEBHOOK_EVENT_CATALOG[input.type]
  const envelope = buildWebhookEnvelope(eventId, createdAt, input)
  const hasSubscription = await ctx.db
    .query("webhookSubscriptions")
    .withIndex("by_eventType_and_endpointId", (q) =>
      q.eq("eventType", input.type),
    )
    .first()
  const id = await ctx.db.insert("webhookEvents", {
    eventId,
    type: input.type,
    apiVersion: "1",
    authorization: contract.authorization,
    subject: input.subject,
    authorizationSubject:
      "authorizationSubject" in input
        ? input.authorizationSubject
        : input.subject,
    requiredScope: contract.requiredScope,
    payloadJson: JSON.stringify(envelope),
    fanoutStatus: hasSubscription ? "pending" : "completed",
    createdAt,
    fanoutCompletedAt: hasSubscription ? undefined : createdAt,
    expiresAt: createdAt + WEBHOOK_RETENTION_MS,
  })
  if (hasSubscription) {
    await ctx.scheduler.runAfter(0, internal.webhooks.dispatch.fanoutEvent, {
      eventId: id,
    })
  }
  return id
}
