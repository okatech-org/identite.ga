import { describe, expect, test } from "bun:test"

import { getBrowserRedirectUrl } from "../apps/connect/lib/auth-proxy"

const body = (value: unknown): ArrayBuffer =>
  new TextEncoder().encode(JSON.stringify(value)).buffer as ArrayBuffer

describe("auth proxy browser redirects", () => {
  test("convertit la réponse Better Auth en redirection pour une navigation", () => {
    expect(
      getBrowserRedirectUrl({
        requestMode: "navigate",
        requestAccept: "text/html,application/xhtml+xml",
        responseStatus: 200,
        responseContentType: "application/json; charset=utf-8",
        responseBody: body({
          redirect: true,
          url: "https://connect.identite.ga/oauth/authorize?consent_code=abc",
        }),
      }),
    ).toBe(
      "https://connect.identite.ga/oauth/authorize?consent_code=abc",
    )
  })

  test("laisse les fetch JavaScript recevoir leur JSON", () => {
    expect(
      getBrowserRedirectUrl({
        requestMode: "cors",
        requestAccept: "application/json",
        responseStatus: 200,
        responseContentType: "application/json",
        responseBody: body({
          redirect: true,
          url: "https://connect.identite.ga/oauth/authorize",
        }),
      }),
    ).toBeNull()
  })

  test("ignore les réponses non conformes ou les protocoles dangereux", () => {
    expect(
      getBrowserRedirectUrl({
        requestMode: "navigate",
        requestAccept: "text/html",
        responseStatus: 200,
        responseContentType: "application/json",
        responseBody: body({ redirect: true, url: "javascript:alert(1)" }),
      }),
    ).toBeNull()
    expect(
      getBrowserRedirectUrl({
        requestMode: "navigate",
        requestAccept: "text/html",
        responseStatus: 400,
        responseContentType: "application/json",
        responseBody: body({ redirect: true, url: "https://example.com" }),
      }),
    ).toBeNull()
  })
})
