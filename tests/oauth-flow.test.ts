import { describe, expect, test } from "bun:test"

import {
  buildPostLoginRedirect,
  isFederatedSignIn,
} from "../apps/web/lib/oauth-flow"

const params = (qs: string) => new URLSearchParams(qs)

describe("isFederatedSignIn", () => {
  test("reconnaît une arrivée directe depuis oidcProvider", () => {
    expect(
      isFederatedSignIn(params("client_id=gabon&response_type=code")),
    ).toBe(true)
  })

  test("reconnaît un retour depuis l'écran de consentement", () => {
    expect(
      isFederatedSignIn(
        params("redirect_to=%2Foauth%2Fauthorize%3Fclient_id%3Dgabon"),
      ),
    ).toBe(true)
  })

  test("une connexion ordinaire au portail n'est pas fédérée", () => {
    // Sinon le citoyen qui se connecte pour consulter son dossier serait
    // renvoyé vers /oauth2/authorize sans qu'aucune app ne l'ait demandé.
    expect(isFederatedSignIn(params("redirect_to=%2Fdashboard"))).toBe(
      false,
    )
    expect(isFederatedSignIn(params(""))).toBe(false)
  })

  test("un redirect_to externe est rejeté", () => {
    // Anti-open-redirect : un `redirect_to` absolu ou protocol-relative ne doit
    // jamais être considéré comme une destination légitime, même s'il imite le
    // chemin de l'écran de consentement.
    expect(
      isFederatedSignIn(
        params("redirect_to=https%3A%2F%2Fevil.example%2Foauth%2Fauthorize"),
      ),
    ).toBe(false)
    expect(
      isFederatedSignIn(
        params("redirect_to=%2F%2Fevil.example%2Foauth%2Fauthorize"),
      ),
    ).toBe(false)
  })
})

describe("buildPostLoginRedirect", () => {
  test("rejoue /oauth2/authorize en conservant les paramètres OAuth", () => {
    const result = buildPostLoginRedirect(
      params(
        "client_id=gabon&response_type=code&scope=openid&state=xyz&code_challenge=abc",
      ),
    )
    const url = new URL(result, "https://identite.ga")

    expect(url.pathname).toBe("/api/auth/oauth2/authorize")
    expect(url.searchParams.get("client_id")).toBe("gabon")
    expect(url.searchParams.get("state")).toBe("xyz")
    // PKCE : perdre code_challenge ferait échouer l'échange du code côté
    // partenaire, avec une erreur survenant bien plus tard dans le flux.
    expect(url.searchParams.get("code_challenge")).toBe("abc")
  })

  test("produit toujours un chemin interne", () => {
    // C'est la condition de sécurité du rejeu : seul un chemin interne passe
    // par le proxy /api/auth/* de cette origine, seul porteur du cookie de
    // session. Une URL absolue enverrait la session ailleurs.
    const federated = buildPostLoginRedirect(
      params("client_id=gabon&response_type=code"),
    )
    expect(federated.startsWith("/")).toBe(true)
    expect(federated.startsWith("//")).toBe(false)

    expect(
      buildPostLoginRedirect(
        params("redirect_to=https%3A%2F%2Fevil.example%2Fsteal"),
      ),
    ).toBe("/")
    expect(
      buildPostLoginRedirect(params("redirect_to=%2F%2Fevil.example")),
    ).toBe("/")
  })

  test("ne transporte pas redirect_to dans la requête d'autorisation", () => {
    // `redirect_to` est un paramètre de navigation interne ; le laisser fuiter
    // vers /oauth2/authorize polluerait la requête OAuth du partenaire.
    const result = buildPostLoginRedirect(
      params("client_id=gabon&response_type=code&redirect_to=%2Fdashboard"),
    )
    expect(result).not.toContain("redirect_to")
  })
})
