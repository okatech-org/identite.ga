/**
 * Origines partenaires de confiance — source unique : `TRUSTED_ORIGINS`.
 *
 * `TRUSTED_ORIGINS` est déjà la liste blanche du CSRF Better Auth et du CORS
 * `authCorsHeaders` (`http.ts`). La réutiliser ici évite une seconde liste à
 * maintenir en parallèle — l'ancienne approche (une variable
 * `NEXT_PUBLIC_PARTNER_RETURN_ORIGINS` inlinée dans le bundle client) est
 * supprimée au profit d'une validation serveur (`partnerOrigins.isTrusted`).
 *
 * La comparaison est EXACTE, sur l'origine seule. Jamais de préfixe ni de
 * suffixe : `https://consulat.ga` ne doit pas laisser passer
 * `https://consulat.ga.evil.tld` ni `https://evil.consulat.ga`.
 *
 * Le parsing reproduit à l'identique celui de `authCorsHeaders` (`http.ts`) :
 * découpe sur la virgule, trim, rejet des entrées vides.
 */
export function parseTrustedOrigins(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
}

/**
 * Une `origin` est-elle listée dans `raw` (contenu de `TRUSTED_ORIGINS`) ?
 *
 * `origin` doit être une origine seule (`https://consulat.ga`), pas une URL
 * complète : l'appelant en extrait `new URL(returnTo).origin` avant l'appel.
 */
export function isOriginTrusted(
  raw: string | undefined,
  origin: string,
): boolean {
  if (!origin) return false
  return parseTrustedOrigins(raw).includes(origin)
}
