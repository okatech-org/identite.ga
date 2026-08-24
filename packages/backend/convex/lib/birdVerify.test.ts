import { afterEach, describe, expect, test, vi } from "vitest"

import { checkBirdSmsCode, sendBirdSmsCode } from "./birdVerify"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe("client Bird Verify", () => {
  test("déduit l'hôte régional et force le canal SMS", async () => {
    vi.stubEnv("BIRD_API_KEY", "bk_us1_test-key")
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ expires_at: "2026-08-24T12:10:00.000Z" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )

    const result = await sendBirdSmsCode("+24106221489", "request-123456789")

    expect(result.expiresAt).toBe(Date.parse("2026-08-24T12:10:00.000Z"))
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe("https://us1.platform.bird.com/v1/verify/verifications")
    expect(JSON.parse(String(init?.body))).toMatchObject({
      to: { phone_number: "+24106221489" },
      options: { channels: ["sms"], code_length: 6 },
    })
  })

  test("traite un code faux comme une réponse métier", async () => {
    vi.stubEnv("BIRD_API_KEY", "bk_us1_test-key")
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          reason: "incorrect_code",
          attempts_remaining: 4,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    )

    await expect(
      checkBirdSmsCode("+24106221489", "123456", "idn-pin-check-request-test"),
    ).resolves.toEqual({
      success: false,
      reason: "incorrect_code",
      attemptsRemaining: 4,
    })
  })
})
