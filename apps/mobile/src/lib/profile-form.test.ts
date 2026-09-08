import { describe, expect, it } from "vitest"
import {
  normalizeProfileForm,
  type ProfileForm,
  validateProfileForm,
} from "./profile-form"

const valid: ProfileForm = {
  firstName: " Ada ",
  lastName: "Lovelace ",
  dateOfBirth: "1815-12-10",
  gender: "F",
  birthPlace: " Londres ",
  nationality: " gab ",
}

describe("formulaire de profil mobile", () => {
  it("valide et normalise les mêmes champs que le web", () => {
    expect(validateProfileForm(valid, "2026-08-22")).toBeNull()
    expect(normalizeProfileForm(valid)).toEqual({
      ...valid,
      firstName: "Ada",
      lastName: "Lovelace",
      birthPlace: "Londres",
      nationality: "GAB",
    })
  })

  it("refuse une identité incomplète ou une date future", () => {
    expect(
      validateProfileForm({ ...valid, firstName: "" }, "2026-08-22"),
    ).toMatch(/obligatoires/)
    expect(
      validateProfileForm(
        { ...valid, dateOfBirth: "2026-08-22" },
        "2026-08-22",
      ),
    ).toMatch(/antérieure/)
  })
})
