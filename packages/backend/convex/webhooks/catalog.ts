import { v } from "convex/values"

export const WEBHOOK_EVENT_TYPES = [
  "iboite.account.updated",
  "identity.verification.created",
  "identity.verification.updated",
  "identity.verification.deleted",
] as const

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number]
export type WebhookAuthorization = "oauth_user" | "m2m"

export const webhookEventTypeValidator = v.union(
  ...WEBHOOK_EVENT_TYPES.map((type) => v.literal(type)),
)

export const WEBHOOK_EVENT_CATALOG: Readonly<
  Record<
    WebhookEventType,
    {
      authorization: WebhookAuthorization
      requiredScope: string
      label: string
    }
  >
> = {
  "iboite.account.updated": {
    authorization: "oauth_user",
    requiredScope: "idn:iboite.read",
    label: "iBoîte mise à jour",
  },
  "identity.verification.created": {
    authorization: "m2m",
    requiredScope: "idn:verification:list",
    label: "Vérification créée",
  },
  "identity.verification.updated": {
    authorization: "m2m",
    requiredScope: "idn:verification:list",
    label: "Vérification mise à jour",
  },
  "identity.verification.deleted": {
    authorization: "m2m",
    requiredScope: "idn:verification:list",
    label: "Vérification supprimée",
  },
}

export interface IboiteCounters {
  unreadLetters: number
  pendingLetters: number
  availablePackages: number
  unreadMessages: number
}

export interface IboiteAccountUpdatedData {
  accountVersion: number
  counters: IboiteCounters
}

export interface VerificationEventData {
  verificationId: string
  updatedAt: number
}

export type WebhookEventInput =
  | {
      type: "iboite.account.updated"
      subject: string
      data: IboiteAccountUpdatedData
    }
  | {
      type:
        | "identity.verification.created"
        | "identity.verification.updated"
        | "identity.verification.deleted"
      subject: string
      /** Utilisé pour le filtrage sandbox, jamais sérialisé dans le webhook. */
      authorizationSubject: string
      data: VerificationEventData
    }

export interface WebhookEnvelope {
  id: string
  type: WebhookEventType
  apiVersion: "1"
  createdAt: number
  subject: string
  data: IboiteAccountUpdatedData | VerificationEventData
}

export function buildWebhookEnvelope(
  eventId: string,
  createdAt: number,
  input: WebhookEventInput,
): WebhookEnvelope {
  return {
    id: eventId,
    type: input.type,
    apiVersion: "1",
    createdAt,
    subject: input.subject,
    data: input.data,
  }
}

export function isWebhookEventType(value: string): value is WebhookEventType {
  return (WEBHOOK_EVENT_TYPES as readonly string[]).includes(value)
}
