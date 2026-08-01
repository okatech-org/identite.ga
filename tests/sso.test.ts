import { describe, expect, test } from "bun:test"

import {
  buildPortalSsoUrl,
  buildPostLoginRedirect,
  hasCheckedPortalSession,
  isFederatedSignIn,
  resolveIdnWebUrl,
} from "../apps/connect/lib/sso"
import {
  buildConnectSessionHandoffUrl,
  getAllowedConnectUrl,
  resolveConnectOrigin,
} from "../apps/web/lib/sso"

describe("SSO connect -> portail", () => {
  test("déduit les origins locaux sans configuration supplémentaire", () => {
    expect(resolveIdnWebUrl(undefined, "http://localhost:3004")).toBe(
      "http://localhost:3000",
    )
    expect(resolveConnectOrigin(undefined, "http://127.0.0.1:3000")).toBe(
      "http://127.0.0.1:3004",
    )
  })

  test("reconnaît les deux entrées d'un login fédéré", () => {
    expect(
      isFederatedSignIn(
        new URLSearchParams("client_id=app&response_type=code"),
      ),
    ).toBe(true)
    expect(
      isFederatedSignIn(
        new URLSearchParams(
          "redirect_to=%2Foauth%2Fauthorize%3Fclient_id%3Dapp%26consent_code%3Dabc",
        ),
      ),
    ).toBe(true)
    expect(isFederatedSignIn(new URLSearchParams("redirect_to=%2F"))).toBe(
      false,
    )
  })

  test("ne vérifie le portail qu'une fois", () => {
    expect(hasCheckedPortalSession(new URLSearchParams("sso_checked=1"))).toBe(
      true,
    )
  })

  test("préserve le flow OAuth sans transmettre les paramètres internes", () => {
    const result = buildPostLoginRedirect(
      new URLSearchParams(
        "client_id=app&response_type=code&state=state-1&sso_checked=1&redirect_to=%2Fignored",
      ),
    )
    const url = new URL(result, "https://connect.identite.ga")

    expect(url.pathname).toBe("/api/auth/oauth2/authorize")
    expect(url.searchParams.get("state")).toBe("state-1")
    expect(url.searchParams.has("sso_checked")).toBe(false)
    expect(url.searchParams.has("redirect_to")).toBe(false)
  })

  test("construit le détour et le fallback anti-boucle", () => {
    const result = new URL(
      buildPortalSsoUrl({
        idnWebUrl: "https://identite.ga",
        connectOrigin: "https://connect.identite.ga",
        postLoginPath:
          "/api/auth/oauth2/authorize?client_id=app&response_type=code",
        signInParams: new URLSearchParams(
          "client_id=app&response_type=code&state=abc",
        ),
      }),
    )

    expect(result.pathname).toBe("/sso")
    expect(new URL(result.searchParams.get("return_to")!).pathname).toBe(
      "/api/auth/oauth2/authorize",
    )
    const fallback = new URL(result.searchParams.get("fallback_to")!)
    expect(fallback.pathname).toBe("/sign-in")
    expect(fallback.searchParams.get("sso_checked")).toBe("1")
    expect(fallback.searchParams.get("state")).toBe("abc")
  })
})

describe("validation du handoff SSO", () => {
  const connectOrigin = "https://connect.identite.ga"

  test("n'autorise que les routes OAuth de connect.identite.ga", () => {
    expect(
      getAllowedConnectUrl(
        `${connectOrigin}/api/auth/oauth2/authorize?client_id=app`,
        connectOrigin,
        "return",
      )?.pathname,
    ).toBe("/api/auth/oauth2/authorize")
    expect(
      getAllowedConnectUrl(
        "https://evil.example/api/auth/oauth2/authorize",
        connectOrigin,
        "return",
      ),
    ).toBeNull()
    expect(
      getAllowedConnectUrl(
        `${connectOrigin}/dashboard`,
        connectOrigin,
        "return",
      ),
    ).toBeNull()
  })

  test("exige le marqueur anti-boucle sur le fallback", () => {
    expect(
      getAllowedConnectUrl(
        `${connectOrigin}/sign-in?sso_checked=1`,
        connectOrigin,
        "fallback",
      ),
    ).not.toBeNull()
    expect(
      getAllowedConnectUrl(
        `${connectOrigin}/sign-in`,
        connectOrigin,
        "fallback",
      ),
    ).toBeNull()
  })

  test("place le jeton sur la route de consommation dédiée", () => {
    const result = new URL(
      buildConnectSessionHandoffUrl({
        connectOrigin,
        returnTo: `${connectOrigin}/oauth/authorize?client_id=app`,
        token: "single-use",
      }),
    )
    expect(result.pathname).toBe("/session-handoff")
    expect(result.searchParams.get("handoff_token")).toBe("single-use")
  })
})
