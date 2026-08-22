import { describe, expect, test } from "vitest"

import {
  buildWebhookEnvelope,
  WEBHOOK_EVENT_CATALOG,
  WEBHOOK_EVENT_TYPES,
} from "./catalog"

describe("catalogue public des webhooks", () => {
  test("n'autorise que des événements exacts, sans abonnement générique", () => {
    expect(WEBHOOK_EVENT_TYPES).not.toContain("*")
    expect(Object.keys(WEBHOOK_EVENT_CATALOG)).toEqual(WEBHOOK_EVENT_TYPES)
  })

  test("l'événement iBoîte ne divulgue aucune donnée de message", () => {
    const envelope = buildWebhookEnvelope("evt_test", 1_787_395_200_000, {
      type: "iboite.account.updated",
      subject: "sub_citizen",
      data: {
        accountVersion: 42,
        counters: {
          unreadLetters: 2,
          pendingLetters: 1,
          availablePackages: 0,
          unreadMessages: 4,
        },
      },
    })

    expect(Object.keys(envelope.data).sort()).toEqual([
      "accountVersion",
      "counters",
    ])
    expect(JSON.stringify(envelope)).not.toMatch(
      /body|attachment|sender|recipient|subjectLine/i,
    )
  })

  test("le sujet d'autorisation d'une vérification reste hors enveloppe", () => {
    const envelope = buildWebhookEnvelope("evt_verification", 10, {
      type: "identity.verification.updated",
      subject: "verification_1",
      authorizationSubject: "sub_secret",
      data: { verificationId: "verification_1", updatedAt: 9 },
    })

    expect(JSON.stringify(envelope)).not.toContain("sub_secret")
  })
})
