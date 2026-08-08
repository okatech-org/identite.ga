import { describe, expect, test } from "vitest"
import { parseDirectoryResolveRequest } from "./resolveRequest"

describe("parseDirectoryResolveRequest", () => {
  test("normalise un critère unique et sa limite", () => {
    expect(
      parseDirectoryResolveRequest({
        emailAlias: "  Jean.Moussavou@IDN.GA ",
        limit: 8,
      }),
    ).toEqual({
      ok: true,
      value: { emailAlias: "jean.moussavou@idn.ga", limit: 8 },
    })
  })

  test("refuse une recherche sans critère", () => {
    expect(parseDirectoryResolveRequest({ name: "  " })).toMatchObject({
      ok: false,
      error: "missing_query",
    })
  })

  test("refuse plusieurs critères au lieu d'appliquer une priorité implicite", () => {
    expect(
      parseDirectoryResolveRequest({ nip: "123", sub: "user-1" }),
    ).toMatchObject({ ok: false, error: "ambiguous_query" })
  })

  test.each([0, 21, 1.5, "8"])("refuse la limite invalide %s", (limit) => {
    expect(parseDirectoryResolveRequest({ sub: "user-1", limit })).toMatchObject({
      ok: false,
      error: "invalid_limit",
    })
  })

  test("refuse un corps JSON qui n'est pas un objet", () => {
    expect(parseDirectoryResolveRequest([])).toMatchObject({
      ok: false,
      error: "invalid_body",
    })
  })
})
