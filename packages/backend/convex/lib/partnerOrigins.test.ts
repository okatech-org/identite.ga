import { describe, expect, test } from "vitest"

import { isOriginTrusted, parseTrustedOrigins } from "./partnerOrigins"

describe("parseTrustedOrigins", () => {
  test("découpe sur la virgule, trim et rejette les vides — comme authCorsHeaders", () => {
    expect(
      parseTrustedOrigins(" https://consulat.ga , https://diplomate.ga ,, "),
    ).toEqual(["https://consulat.ga", "https://diplomate.ga"])
  })

  test("env absente ou vide → liste vide, jamais d'erreur", () => {
    expect(parseTrustedOrigins(undefined)).toEqual([])
    expect(parseTrustedOrigins("")).toEqual([])
    expect(parseTrustedOrigins("   ")).toEqual([])
  })
})

describe("isOriginTrusted", () => {
  const raw = "http://127.0.0.1:3000,https://consulat.ga,https://diplomate.ga"

  test("origine exactement listée → true", () => {
    expect(isOriginTrusted(raw, "https://consulat.ga")).toBe(true)
    expect(isOriginTrusted(raw, "http://127.0.0.1:3000")).toBe(true)
  })

  test("comparaison EXACTE : ni sous-domaine ni suffixe ne passent", () => {
    expect(isOriginTrusted(raw, "https://consulat.ga.evil.tld")).toBe(false)
    expect(isOriginTrusted(raw, "https://evil.consulat.ga")).toBe(false)
    expect(isOriginTrusted(raw, "https://consulat.ga/register")).toBe(false)
  })

  test("port et schéma comptent — 127.0.0.1 sur un autre port est rejeté", () => {
    expect(isOriginTrusted(raw, "http://127.0.0.1:3001")).toBe(false)
    expect(isOriginTrusted(raw, "https://127.0.0.1:3000")).toBe(false)
  })

  test("origine vide ou env absente → false", () => {
    expect(isOriginTrusted(raw, "")).toBe(false)
    expect(isOriginTrusted(undefined, "https://consulat.ga")).toBe(false)
  })
})
