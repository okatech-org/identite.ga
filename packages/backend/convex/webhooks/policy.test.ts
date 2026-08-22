import { describe, expect, test } from "vitest"

import { parseRetryAfterMs, webhookRetryDelayMs } from "./policy"
import { isForbiddenIp, validateWebhookUrl } from "./urlSafety"

describe("politique de livraison webhook", () => {
  test("applique les huit délais contractuels", () => {
    expect(
      Array.from({ length: 8 }, (_, index) => webhookRetryDelayMs(index + 1)),
    ).toEqual([
      0,
      60_000,
      5 * 60_000,
      30 * 60_000,
      2 * 60 * 60_000,
      6 * 60 * 60_000,
      12 * 60 * 60_000,
      24 * 60 * 60_000,
    ])
  })

  test("respecte Retry-After sur 429 sans dépasser 24 heures", () => {
    expect(parseRetryAfterMs("120", 0)).toBe(120_000)
    expect(webhookRetryDelayMs(2, 48 * 60 * 60_000)).toBe(24 * 60 * 60_000)
  })

  test("calcule les tentatives depuis la création, pas en délais cumulés", () => {
    expect(webhookRetryDelayMs(4, undefined, 4 * 60_000)).toBe(26 * 60_000)
    expect(webhookRetryDelayMs(8, undefined, 23 * 60 * 60_000)).toBe(
      60 * 60_000,
    )
  })
})

describe("barrière SSRF des webhooks", () => {
  test.each([
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.1.1",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "64:ff9b::a9fe:a9fe",
    "2002:7f00:1::",
  ])("bloque l'adresse privée %s", (address) => {
    expect(isForbiddenIp(address)).toBe(true)
  })

  test.each(["8.8.8.8", "1.1.1.1", "2001:4860:4860::8888"])(
    "accepte l'adresse publique %s",
    (address) => {
      expect(isForbiddenIp(address)).toBe(false)
    },
  )

  test("impose HTTPS sur le port 443", () => {
    expect(
      validateWebhookUrl("http://consumer.example/hook", "sandbox").ok,
    ).toBe(false)
    expect(
      validateWebhookUrl("https://consumer.example:8443/hook", "sandbox").ok,
    ).toBe(false)
    expect(
      validateWebhookUrl("https://consumer.example/hook", "production"),
    ).toEqual({ ok: true, url: "https://consumer.example/hook" })
  })
})
