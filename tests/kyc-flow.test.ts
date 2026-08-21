import { describe, expect, test } from "bun:test"

import {
  buildKycPath,
  isAllowedReturnTo,
  parseKycFlow,
} from "../apps/web/lib/kyc-flow"

describe("KYC flow", () => {
  test("n'autorise que les retours IDN et locaux", () => {
    expect(
      isAllowedReturnTo("https://identite.ga/oauth/authorize?a=1"),
    ).toBe(true)
    expect(isAllowedReturnTo("http://localhost:3000/oauth/authorize")).toBe(
      true,
    )
    expect(isAllowedReturnTo("https://evil.example/steal")).toBe(false)
  })

  test("respecte le niveau cible explicite du step-up", () => {
    const flow = parseKycFlow(
      "?target=3&return_to=https%3A%2F%2Fidentite.ga%2Foauth%2Fauthorize",
      2,
    )
    expect(flow).toEqual({
      targetLoa: 3,
      returnTo: "https://identite.ga/oauth/authorize",
    })
  })

  test("un accès direct d'un profil L2 reste une consultation L2", () => {
    expect(parseKycFlow("", 2).targetLoa).toBe(2)
  })

  test("construit le chemin KYC sans perdre la query OAuth", () => {
    const path = buildKycPath({
      returnTo:
        "https://identite.ga/oauth/authorize?client_id=gabon&consent_code=abc",
      targetLoa: 2,
    })
    const url = new URL(path, "https://identite.ga")
    expect(url.pathname).toBe("/kyc")
    expect(url.searchParams.get("target")).toBe("2")
    expect(url.searchParams.get("return_to")).toContain("consent_code=abc")
  })
})
