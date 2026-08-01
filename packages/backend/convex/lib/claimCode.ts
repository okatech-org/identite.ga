/**
 * Code de réclamation à usage unique pour les identités déléguées.
 *
 * PROBLÈME RÉSOLU — avant l'introduction de ce code, `/api/claim/complete`
 * n'exigeait que le `delegatedIdentityId`, lui-même obtenu de la route publique
 * `/api/claim/lookup` avec pour seule entrée un NIP (imprimé sur la carte) ou
 * un nom + une date de naissance. N'importe qui pouvait donc poser son propre
 * mot de passe et son propre PIN sur l'identité d'un citoyen — y compris une
 * identité créée en LoA 2, donc déjà vérifiée.
 *
 * Le code est la PREUVE DE POSSESSION : l'opérateur le remet au citoyen lors de
 * l'enrôlement (hors bande — papier, guichet). Seul son hash est persisté, il
 * n'est jamais relisible depuis la base, exactement comme les clés API
 * (cf. lib/secureToken.ts).
 *
 * Format : 12 caractères base32 Crockford groupés par 4 (`K7M2-9XQ4-B3TF`).
 * Choix contraint par la transcription MANUELLE : alphabet sans I, L, O, U
 * (confusions 1/l/I, 0/O, U/V et jurons involontaires), majuscules, groupes de
 * 4. 12 caractères ≈ 60 bits d'entropie — hors de portée d'une attaque en ligne
 * dès lors que les tentatives sont plafonnées (cf. CLAIM_MAX_ATTEMPTS).
 */

/** Alphabet base32 Crockford, sans I/L/O/U — anti-confusion à la lecture. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

const CODE_LENGTH = 12
const GROUP_SIZE = 4

/** Tentatives de code erroné avant verrouillage temporaire de la réclamation. */
export const CLAIM_MAX_ATTEMPTS = 5

/** Durée du verrouillage après épuisement des tentatives. */
export const CLAIM_LOCKOUT_MS = 15 * 60 * 1000

/** Validité par défaut d'un code (au-delà, l'opérateur doit en réémettre un). */
export const CLAIM_CODE_TTL_MS = 90 * 24 * 60 * 60 * 1000

/**
 * Génère un code de réclamation.
 *
 * `code` est à remettre au citoyen et n'est JAMAIS persisté ; `codeHash` est le
 * seul élément stocké.
 */
export async function generateClaimCode(): Promise<{
  code: string
  codeHash: string
}> {
  // Rejection sampling : `ALPHABET.length` (32) divise 256, donc un simple
  // modulo est déjà uniforme ici — on garde le masque explicite pour que la
  // propriété survive à un changement d'alphabet.
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  let raw = ""
  for (let i = 0; i < CODE_LENGTH; i++) {
    raw += ALPHABET[bytes[i]! % ALPHABET.length]
  }

  const groups: string[] = []
  for (let i = 0; i < raw.length; i += GROUP_SIZE) {
    groups.push(raw.slice(i, i + GROUP_SIZE))
  }
  const code = groups.join("-")
  return { code, codeHash: await hashClaimCode(code) }
}

/**
 * Normalise un code saisi par un humain avant comparaison.
 *
 * Tolère les minuscules, les espaces, l'absence ou l'excès de tirets — un
 * citoyen qui recopie correctement son code ne doit pas être bloqué par une
 * question de mise en forme. Mappe aussi les confusions classiques de
 * l'alphabet Crockford (O→0, I/L→1) : sans ça, un code lu sur un papier
 * imprimé échoue sur un caractère que l'œil humain ne distingue pas.
 */
export function normalizeClaimCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
}

/** SHA-256 hex du code normalisé. Même schéma que lib/secureToken.ts. */
export async function hashClaimCode(code: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalizeClaimCode(code)) as BufferSource,
  )
  const arr = new Uint8Array(buf)
  let hex = ""
  for (let i = 0; i < arr.length; i++) {
    hex += arr[i]!.toString(16).padStart(2, "0")
  }
  return hex
}

/**
 * Comparaison à temps constant de deux hex de même longueur.
 *
 * Les deux opérandes sont des hash SHA-256, donc de longueur fixe et non
 * secrète : la comparaison naïve `a === b` fuirait le nombre de caractères
 * communs en tête. Le risque est faible sur un hash (il faudrait déjà pouvoir
 * choisir des préimages), mais une comparaison de secret se fait à temps
 * constant, sans exception.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/** Forme plausible d'un code (12 caractères de l'alphabet, après normalisation). */
export function looksLikeClaimCode(value: string): boolean {
  return new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`).test(
    normalizeClaimCode(value),
  )
}
