import { afterEach, describe, expect, test } from "vitest"

import {
  decryptWebhookSecret,
  encryptWebhookSecret,
  generateWebhookSecret,
  signWebhookDelivery,
  verifyWebhookDelivery,
} from "./crypto"

const previousMasterKey = process.env.WEBHOOK_SECRETS_KEY

afterEach(() => {
  if (previousMasterKey === undefined) delete process.env.WEBHOOK_SECRETS_KEY
  else process.env.WEBHOOK_SECRETS_KEY = previousMasterKey
})

describe("secrets et signatures des webhooks", () => {
  test("génère un secret aléatoire de 256 bits", () => {
    const first = generateWebhookSecret()
    const second = generateWebhookSecret()
    expect(first).toMatch(/^whsec_[A-Za-z0-9_-]{43}$/)
    expect(second).not.toBe(first)
  })

  test("chiffre le secret avec la clé maître avant stockage", async () => {
    process.env.WEBHOOK_SECRETS_KEY = "11".repeat(32)
    const secret = generateWebhookSecret()
    const encrypted = await encryptWebhookSecret(secret)

    expect(encrypted.ciphertext).not.toContain(secret)
    expect(await decryptWebhookSecret(encrypted.ciphertext, encrypted.iv)).toBe(
      secret,
    )
  })

  test("signe exactement timestamp point corps brut et accepte deux signatures", async () => {
    const rawBody = '{ "id": "evt_1" }'
    const signature = await signWebhookDelivery("secret", "1787395200", rawBody)

    expect(signature).toMatch(/^v1=[0-9a-f]{64}$/)
    expect(
      await verifyWebhookDelivery(
        "secret",
        "1787395200",
        rawBody,
        `v1=${"0".repeat(64)}, ${signature}`,
      ),
    ).toBe(true)
    expect(
      await verifyWebhookDelivery(
        "secret",
        "1787395200",
        `${rawBody} `,
        signature,
      ),
    ).toBe(false)
  })
})
