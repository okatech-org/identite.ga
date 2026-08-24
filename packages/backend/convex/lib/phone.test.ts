import { describe, expect, test } from "vitest"

import { normalizeRecoveryPhone } from "./phone"

describe("normalisation des téléphones de récupération", () => {
  test("normalise les formats historiques gabonais", () => {
    expect(normalizeRecoveryPhone("+241 06 22 14 89", "GA")).toBe(
      "+24106221489",
    )
    expect(normalizeRecoveryPhone("06 22 14 89", "GA")).toBe("+24106221489")
  })

  test("retire le zéro national d'un numéro français local", () => {
    expect(normalizeRecoveryPhone("06 12 34 56 78", "FR")).toBe("+33612345678")
    expect(normalizeRecoveryPhone("0033 6 12 34 56 78", "FR")).toBe(
      "+33612345678",
    )
  })

  test("refuse les destinations Bird non activées et les formats ambigus", () => {
    expect(normalizeRecoveryPhone("+221771234567", "SN")).toBeNull()
    expect(normalizeRecoveryPhone("0771234567", "SN")).toBeNull()
    expect(normalizeRecoveryPhone("pas-un-numéro", "GA")).toBeNull()
  })
})
