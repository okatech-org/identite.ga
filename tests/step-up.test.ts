import { describe, expect, test } from "bun:test"

import { buildKycHandoffUrl } from "../apps/connect/lib/step-up"

describe("buildKycHandoffUrl", () => {
  test("transmet la session, le retour OAuth et le niveau cible", () => {
    const result = new URL(
      buildKycHandoffUrl({
        idnWebUrl: "https://identite.ga",
        continueUrl:
          "https://connect.identite.ga/oauth/authorize?client_id=gabon&consent_code=abc",
        targetLoa: 2,
        token: "one-time-token",
      }),
    )

    expect(result.origin).toBe("https://identite.ga")
    expect(result.pathname).toBe("/session-handoff")
    expect(result.searchParams.get("handoff_token")).toBe("one-time-token")
    expect(result.searchParams.get("return_to")).toBe(
      "https://connect.identite.ga/oauth/authorize?client_id=gabon&consent_code=abc",
    )
    expect(result.searchParams.get("target")).toBe("2")
  })
})
