import { describe, expect, test } from "vitest"

import {
  GRANTABLE_SCOPES,
  mergeConsentScopes,
  parseConsentScopes,
  resolveGrantedScopes,
  serializeConsentScopes,
} from "./consentGrant"

/**
 * Consentement OAuth enregistré depuis l'interface d'un partenaire.
 *
 * Ce que ces tests protègent n'est pas du confort : un consentement mal formé
 * ne « plante » jamais. Il s'enregistre, puis Better Auth ne le reconnaît pas
 * et réaffiche l'écran de consentement — au milieu du parcours d'inscription
 * du citoyen, sans la moindre erreur nulle part. Chaque cas ci-dessous fixe un
 * invariant dont la violation est SILENCIEUSE en production.
 */

describe("serializeConsentScopes", () => {
  test("sépare par des espaces — c'est le contrat de lecture de Better Auth", () => {
    // `authorize.mjs` compare avec `res.scopes.split(" ")`. Toute autre
    // séparation produit un consentement qui ne matche jamais.
    expect(serializeConsentScopes(["openid", "profile", "email"])).toBe(
      "openid profile email",
    )
  })

  test("dédoublonne et purge les entrées vides plutôt que d'écrire des doubles espaces", () => {
    // "openid  profile".split(" ") → ["openid", "", "profile"] : le scope vide
    // ne matcherait aucune demande et fausserait la comparaison d'inclusion.
    expect(serializeConsentScopes(["openid", " ", "profile", "openid"])).toBe(
      "openid profile",
    )
  })
})

describe("parseConsentScopes", () => {
  test("relit ce que serializeConsentScopes a écrit", () => {
    const scopes = ["openid", "profile", "idn:civil_status"]
    expect(parseConsentScopes(serializeConsentScopes(scopes))).toEqual(scopes)
  })

  test("tolère la virgule en LECTURE pour ne pas perdre les lignes héritées", () => {
    expect(parseConsentScopes("openid,profile")).toEqual(["openid", "profile"])
  })

  test("rend un tableau vide sur une valeur absente au lieu de propager null", () => {
    // Le champ `scopes` du composant est optionnel et nullable : un null qui
    // remonterait tel quel ferait échouer le merge à l'appel suivant.
    expect(parseConsentScopes(null)).toEqual([])
    expect(parseConsentScopes(undefined)).toEqual([])
    expect(parseConsentScopes("")).toEqual([])
  })
})

describe("resolveGrantedScopes", () => {
  test("accorde les scopes OIDC standard même si l'app n'en déclare aucun", () => {
    // `developer/apps.ts` crée les apps avec `scopes: []` par défaut. Exiger
    // une déclaration explicite rendrait la fonctionnalité inutilisable pour
    // toutes les apps existantes.
    expect(
      resolveGrantedScopes({
        requested: ["openid", "profile", "email"],
        clientScopes: [],
      }),
    ).toEqual({ ok: true, value: ["openid", "profile", "email"] })
  })

  test("accorde un scope custom quand l'app l'a déclaré", () => {
    expect(
      resolveGrantedScopes({
        requested: ["openid", "idn:civil_status"],
        clientScopes: ["idn:civil_status"],
      }),
    ).toEqual({ ok: true, value: ["openid", "idn:civil_status"] })
  })

  test("refuse un scope custom que l'app n'a pas déclaré", () => {
    // Sans cette barrière, une app pourrait faire consentir le citoyen à un
    // périmètre qu'elle n'a jamais soumis à la revue du portail développeur.
    expect(
      resolveGrantedScopes({
        requested: ["openid", "idn:civil_status"],
        clientScopes: ["email"],
      }),
    ).toMatchObject({ ok: false, error: "scope_not_declared" })
  })

  test("refuse un scope inconnu d'IDN au lieu de le filtrer en silence", () => {
    // Un scope filtré silencieusement enregistrerait un consentement plus
    // étroit que ce que le partenaire a affiché : l'écran de consentement
    // reviendrait au login suivant, très loin de la cause.
    expect(
      resolveGrantedScopes({
        requested: ["openid", "idn:banking"],
        clientScopes: ["idn:banking"],
      }),
    ).toMatchObject({ ok: false, error: "unknown_scope" })
  })

  test("refuse une demande vide", () => {
    expect(
      resolveGrantedScopes({ requested: [], clientScopes: ["email"] }),
    ).toMatchObject({ ok: false, error: "empty_scopes" })
    expect(
      resolveGrantedScopes({ requested: ["  "], clientScopes: ["email"] }),
    ).toMatchObject({ ok: false, error: "empty_scopes" })
  })

  test("les scopes sont sensibles à la casse — `OpenID` n'est pas `openid`", () => {
    // RFC 6749 §3.3 : les valeurs de scope sont sensibles à la casse. Les
    // normaliser en minuscules ferait diverger notre consentement de ce que
    // `/authorize` compare réellement.
    expect(
      resolveGrantedScopes({ requested: ["OpenID"], clientScopes: [] }),
    ).toMatchObject({ ok: false, error: "unknown_scope" })
  })

  test("normalise espaces parasites et doublons", () => {
    expect(
      resolveGrantedScopes({
        requested: [" openid ", "profile", "openid"],
        clientScopes: [],
      }),
    ).toEqual({ ok: true, value: ["openid", "profile"] })
  })

  test("tous les scopes accordables sont acceptés par une app qui les déclare", () => {
    expect(
      resolveGrantedScopes({
        requested: [...GRANTABLE_SCOPES],
        clientScopes: [...GRANTABLE_SCOPES],
      }),
    ).toMatchObject({ ok: true })
  })
})

describe("mergeConsentScopes", () => {
  test("fait l'union — un nouveau consentement ne retire jamais l'ancien", () => {
    // Re-consentir à `openid profile` depuis un autre parcours ne doit pas
    // révoquer le `email` déjà accordé : une réduction de périmètre est une
    // révocation, et elle doit passer par `revoke` (qui, elle, est auditée).
    expect(
      mergeConsentScopes(["openid", "email"], ["openid", "profile"]),
    ).toEqual(["openid", "email", "profile"])
  })

  test("préserve l'ordre de première apparition et dédoublonne", () => {
    expect(mergeConsentScopes(["openid"], ["openid", "openid"])).toEqual([
      "openid",
    ])
  })

  test("part d'un consentement inexistant sans cas particulier", () => {
    expect(mergeConsentScopes([], ["openid", "profile"])).toEqual([
      "openid",
      "profile",
    ])
  })
})
