import { describe, expect, it } from "vitest";
import { userinfoClaimsForScopes, type UserinfoProfile } from "./userinfoClaims";

const profile: UserinfoProfile = {
  profileType: "verifie", loa: 2,
  pivot: {
    firstName: "Personne", lastName: "De Test", dateOfBirth: "1990-01-01",
    birthPlace: "Lieu fictif", gender: "F", nationality: "TEST", nip: "NIP-FICTIF",
  },
};

describe("minimisation des claims OIDC", () => {
  it("une connexion Ndjobi conserve le nom composé sans exporter l’état civil", () => {
    const claims = userinfoClaimsForScopes(["openid", "profile", "email"], profile);
    expect(claims).toEqual({ profile_type: "verifie", loa: 2, acr: "eidas2", name: "Personne De Test", given_name: "Personne", family_name: "De Test" });
    for (const key of ["nip", "birthdate", "birth_place", "gender", "nationality"]) expect(claims).not.toHaveProperty(key);
  });
  it("aucun enrichissement de profil sans scope profile", () => {
    expect(userinfoClaimsForScopes(["openid", "email"], profile)).toEqual({});
    expect(userinfoClaimsForScopes([], profile)).toEqual({});
  });
  it("l’état civil exige son scope exact, sans octroyer implicitement profile", () => {
    expect(userinfoClaimsForScopes(["idn:civil_status"], profile)).toEqual({
      birthdate: "1990-01-01", birth_place: "Lieu fictif", gender: "F", nationality: "TEST", nip: "NIP-FICTIF",
    });
    expect(userinfoClaimsForScopes(["idn:civil_status:all"], profile)).toEqual({});
  });
  it("tolère un profil ou un pivot manquant sans inventer des données", () => {
    expect(userinfoClaimsForScopes(["profile"], null)).toEqual({});
    expect(userinfoClaimsForScopes(["idn:civil_status"], { loa: 1, profileType: "declare" })).toEqual({});
  });
});
