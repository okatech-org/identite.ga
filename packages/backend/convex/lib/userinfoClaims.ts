/** Claims pivot autorisés par les scopes du jeton validé par Better Auth. */
export type UserinfoProfile = {
  profileType: string;
  loa: number;
  pivot?: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    birthPlace: string;
    gender: string;
    nationality: string;
    nip?: string;
  };
};

export function userinfoClaimsForScopes(
  scopes: readonly string[],
  profile: UserinfoProfile | null,
): Record<string, string | number> {
  if (!profile) return {};
  const claims: Record<string, string | number> = {};
  if (scopes.includes("profile")) {
    claims.profile_type = profile.profileType;
    claims.loa = profile.loa;
    claims.acr = profile.loa === 3 ? "eidas3" : profile.loa === 2 ? "eidas2" : "eidas1";
    if (profile.pivot) {
      claims.name = [profile.pivot.firstName, profile.pivot.lastName].filter(Boolean).join(" ");
      claims.given_name = profile.pivot.firstName;
      claims.family_name = profile.pivot.lastName;
    }
  }
  // Une connexion standard openid/profile/email n'a pas besoin d'état civil.
  if (scopes.includes("idn:civil_status") && profile.pivot) {
    claims.birthdate = profile.pivot.dateOfBirth;
    claims.birth_place = profile.pivot.birthPlace;
    claims.gender = profile.pivot.gender;
    claims.nationality = profile.pivot.nationality;
    if (profile.pivot.nip) claims.nip = profile.pivot.nip;
  }
  return claims;
}
