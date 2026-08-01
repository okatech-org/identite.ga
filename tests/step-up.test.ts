import { describe, expect, test } from "bun:test"

import {
  buildKycHandoffUrl,
  getCurrentUserLoa,
} from "../apps/connect/lib/step-up"

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

describe("getCurrentUserLoa", () => {
  test("lit le niveau dans le profil retourné par getCurrentUser", () => {
    expect(getCurrentUserLoa({ profile: { loa: 2 } })).toBe(2)
    expect(getCurrentUserLoa({ profile: { loa: 3 } })).toBe(3)
  })

  test("revient au niveau 1 sans profil ou avec une valeur invalide", () => {
    expect(getCurrentUserLoa(null)).toBe(1)
    expect(getCurrentUserLoa({ profile: null })).toBe(1)
    expect(getCurrentUserLoa({ profile: { loa: 99 } })).toBe(1)
  })
})
