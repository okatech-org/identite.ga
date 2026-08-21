/**
 * Clé de rapprochement d'identité pivot.
 *
 * Deux inscriptions du même individu se reconnaissent au triplet
 * (nom, prénom, date de naissance). Les trois composantes sont
 * nécessaires : rapprocher sur le seul nom produirait des faux positifs
 * entre homonymes — et un faux positif ici finit par la suppression du
 * compte d'un innocent.
 *
 * La normalisation retire les accents (`NFD` + suppression des
 * diacritiques), passe en minuscules et compacte les espaces : « Jean
 * MBADINGA », « jean  mbadinga » et « Jean Mbadinga » désignent la même
 * personne dans un registre d'état civil.
 *
 * Le séparateur `|` ne peut pas apparaître dans un nom saisi, ce qui
 * évite qu'un couple (nom, prénom) différent produise la même clé.
 */

/** Minuscules, sans accents, espaces compactés. */
export function normalizeIdentityPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Clé stable d'une identité pivot : `nom|prénom|AAAA-MM-JJ`.
 * La date de naissance est déjà normalisée (ISO) par le schéma.
 */
export function normalizeIdentityKey(
  firstName: string,
  lastName: string,
  dateOfBirth: string,
): string {
  return [
    normalizeIdentityPart(lastName),
    normalizeIdentityPart(firstName),
    dateOfBirth.trim(),
  ].join("|")
}
