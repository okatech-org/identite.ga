import { describe, expect, test } from "vitest"

import {
  decideIdentityCollision,
  derivePivotKeys,
  normalizeIdentityKey,
  normalizeNipKey,
} from "./identity"

/**
 * CE QUI EST EN JEU : ces fonctions décident si une inscription est refusée.
 * Un faux positif barre l'accès à ses droits à un citoyen innocent ; un faux
 * négatif laisse entrer un doublon. Les deux erreurs se paient, et pas dans la
 * même monnaie.
 */

describe("clé de rapprochement d'identité", () => {
  test("la casse, les espaces et les accents ne changent pas l'identité", () => {
    // POURQUOI : un registre d'état civil saisi à la main produit « Jean
    // MBADINGA », « jean  mbadinga » et « Jean Mbadinga » pour la même
    // personne. Ne pas les rapprocher, c'est ne rien détecter du tout.
    const a = normalizeIdentityKey("Jean", "MBADINGA", "1990-01-02")
    const b = normalizeIdentityKey("jean ", " mbadinga", "1990-01-02")
    const c = normalizeIdentityKey("Jéan", "Mbadingà", "1990-01-02")
    expect(a).toBe(b)
    expect(a).toBe(c)
  })

  test("deux homonymes nés à des dates différentes restent deux personnes", () => {
    // POURQUOI : c'est le test qui protège de la catastrophe. Rapprocher sur
    // le seul patronyme suffirait à faire supprimer le compte d'un innocent.
    expect(normalizeIdentityKey("Jean", "Mbadinga", "1990-01-02")).not.toBe(
      normalizeIdentityKey("Jean", "Mbadinga", "1991-06-15"),
    )
  })

  test("un nom contenant le séparateur ne peut pas usurper une autre clé", () => {
    // POURQUOI : la clé est une concaténation sur `|`. Si un nom pouvait en
    // contenir un, « Dupont|Jean » (prénom vide) produirait la même clé que
    // « Dupont » / « Jean » — une collision forgeable à volonté.
    const forged = normalizeIdentityKey("", "Dupont|Jean", "1990-01-02")
    const real = normalizeIdentityKey("Jean", "Dupont", "1990-01-02")
    expect(forged).not.toBe(real)
  })
})

describe("normalisation du NIP", () => {
  test("la casse et les espaces ne créent pas deux numéros", () => {
    // POURQUOI : le NIP admet des lettres. Comparé brut, `abc…` et `ABC…`
    // seraient deux entrées distinctes pour un même numéro — et le contrôle
    // d'unicité laisserait passer.
    expect(normalizeNipKey(" ga12345678abcd ")).toBe("GA12345678ABCD")
  })

  test("l'absence de NIP ne produit pas de clé", () => {
    // POURQUOI : une clé vide rapprocherait entre eux TOUS les comptes sans
    // NIP, soit la majorité de la population.
    expect(normalizeNipKey(undefined)).toBeUndefined()
    expect(normalizeNipKey("")).toBeUndefined()
    expect(normalizeNipKey("   ")).toBeUndefined()
  })
})

describe("dérivation des clés depuis le pivot", () => {
  test("produit les deux clés d'un seul appel", () => {
    const keys = derivePivotKeys({
      firstName: "Jean",
      lastName: "Mbadinga",
      dateOfBirth: "1990-01-02",
      nip: "ga12345678abcd",
    })
    expect(keys.pivotKey).toBe(
      normalizeIdentityKey("Jean", "Mbadinga", "1990-01-02"),
    )
    expect(keys.nipKey).toBe("GA12345678ABCD")
  })

  test("un pivot sans NIP ne produit pas de clé NIP", () => {
    const keys = derivePivotKeys({
      firstName: "Jean",
      lastName: "Mbadinga",
      dateOfBirth: "1990-01-02",
    })
    expect(keys.nipKey).toBeUndefined()
  })
})

describe("verdict de collision", () => {
  test("personne ne porte cette identité → on laisse passer", () => {
    expect(decideIdentityCollision([])).toBe("allow")
  })

  test("un compte VÉRIFIÉ la porte → refus", () => {
    // POURQUOI : un KYC a rattaché ces informations à une personne réelle.
    // C'est la seule situation de quasi-certitude, donc la seule qui autorise
    // à barrer la route.
    expect(decideIdentityCollision([{ loa: 2 }])).toBe("refuse")
    expect(decideIdentityCollision([{ loa: 3 }])).toBe("refuse")
  })

  test("seuls des comptes DÉCLARATIFS la portent → on signale sans bloquer", () => {
    // POURQUOI : rien n'est vérifié en LoA 1. Refuser sur cette base offrirait
    // un déni de service trivial — créer un compte au nom de quelqu'un
    // suffirait à l'empêcher à jamais de s'inscrire.
    expect(decideIdentityCollision([{ loa: 1 }])).toBe("flag")
    expect(decideIdentityCollision([{ loa: 1 }, { loa: 1 }])).toBe("flag")
  })

  test("un seul compte vérifié dans le lot suffit à refuser", () => {
    expect(decideIdentityCollision([{ loa: 1 }, { loa: 3 }])).toBe("refuse")
  })
})
