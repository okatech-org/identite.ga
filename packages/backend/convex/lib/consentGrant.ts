/**
 * Consentement OAuth accordé depuis l'interface d'une application partenaire.
 *
 * CONTEXTE — pourquoi cette voie plutôt que `skipConsent`.
 *
 * Better Auth sait sauter l'écran de consentement (`client.skipConsent`), mais
 * UNIQUEMENT pour les clients déclarés en dur dans `oidcProvider({ trustedClients })` :
 * `getClient()` ne remonte pas ce champ depuis la base, et le schéma du composant
 * `@convex-dev/better-auth` n'a pas de colonne pour lui. Passer par
 * `trustedClients` obligerait à dupliquer en variable d'environnement le
 * `clientId`, le secret HACHÉ, les redirect URLs et le `metadata.env` de chaque
 * app — un doublon du portail développeur qui, s'il dérive, casse soit le token
 * endpoint (secret), soit TOUS les logins (`metadata.env` absent ⇒
 * `getAdditionalUserInfoClaim` lève `sandbox_access_denied`).
 *
 * On enregistre donc un VRAI consentement au lieu d'en supprimer l'écran :
 * `authorize.mjs` saute l'écran dès qu'une ligne `oauthConsent` couvre les
 * scopes demandés. Le partenaire recueille le consentement dans sa propre
 * interface, avec ses propres mots, et IDN le trace. Le citoyen le retrouve et
 * peut le révoquer depuis son espace (`oauthConsents.listMine` / `revoke`) —
 * ce qu'un `skipConsent` rendrait impossible, puisqu'il ne laisse aucune trace.
 *
 * Ce module ne contient QUE la logique décidable hors base : le composant Better
 * Auth est hors de portée de `convex-test`, donc tout ce qui peut être faux est
 * ici, et testé (cf. `consentGrant.test.ts`).
 */

/**
 * Scopes OIDC standard. Toujours accordables, quelle que soit la déclaration de
 * l'app dans le portail développeur : `openid` est exigé par le protocole
 * lui-même, et `profile`/`email` sont l'allowlist globale de Better Auth.
 */
export const STANDARD_OIDC_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
] as const

/**
 * Scopes custom IDN. DOIT rester en phase avec `oidcProvider({ scopes })` dans
 * `auth.ts` : un scope accordé ici mais absent de l'allowlist globale produirait
 * un consentement enregistré pour un scope que `/authorize` rejette ensuite en
 * `invalid_scope` — un consentement qui ne consent à rien.
 */
export const IDN_CUSTOM_SCOPES = [
  "idn:civil_status",
  "idn:iboite.read",
  "idn:iboite.manage",
  "idn:iboite.send",
] as const

/** Union des scopes qu'un consentement peut légitimement porter. */
export const GRANTABLE_SCOPES: readonly string[] = [
  ...STANDARD_OIDC_SCOPES,
  ...IDN_CUSTOM_SCOPES,
]

export type ResolveGrantedScopesResult =
  | { ok: true; value: string[] }
  | {
      ok: false
      error: "empty_scopes" | "unknown_scope" | "scope_not_declared"
      message: string
    }

/**
 * Découpe la valeur stockée en base.
 *
 * Better Auth écrit et relit les scopes d'un `oauthConsent` en chaîne séparée
 * par des ESPACES (`res.scopes.split(" ")` dans `authorize.mjs`). On tolère la
 * virgule en lecture — d'anciennes lignes ont pu être écrites autrement — mais
 * jamais en écriture (cf. `serializeConsentScopes`).
 */
export function parseConsentScopes(
  raw: string[] | string | null | undefined,
): string[] {
  if (!raw) return []
  const list = Array.isArray(raw) ? raw : raw.split(/[\s,]+/)
  return dedupe(list.map((s) => String(s).trim()).filter(Boolean))
}

/**
 * Sérialise pour la base.
 *
 * L'espace n'est pas un détail de style : `authorize.mjs` fait `split(" ")`.
 * Une écriture en virgules produirait un consentement qui ne matche JAMAIS —
 * l'écran de consentement réapparaîtrait à chaque connexion sans que rien
 * ne signale l'erreur.
 */
export function serializeConsentScopes(scopes: string[]): string {
  return dedupe(scopes.map((s) => s.trim()).filter(Boolean)).join(" ")
}

/**
 * Valide les scopes qu'une app demande à faire consentir.
 *
 * Deux barrières, dans cet ordre :
 *   1. le scope doit exister côté IDN (`GRANTABLE_SCOPES`) — sinon on
 *      enregistrerait un consentement inopérant ;
 *   2. si l'app a déclaré des scopes dans le portail développeur, elle ne peut
 *      pas faire consentir au-delà. Une app qui n'en déclare aucun (champ vide
 *      à la création) reste limitée aux scopes OIDC standard.
 *
 * On REFUSE au lieu de filtrer silencieusement : un scope qui disparaît sans
 * bruit produirait un consentement plus étroit que ce que le partenaire a
 * affiché au citoyen, donc un écran de consentement au prochain login — le
 * symptôme apparaîtrait loin de sa cause.
 */
export function resolveGrantedScopes({
  requested,
  clientScopes,
}: {
  requested: string[]
  clientScopes: string[]
}): ResolveGrantedScopesResult {
  const normalized = dedupe(requested.map((s) => s.trim()).filter(Boolean))

  if (normalized.length === 0) {
    return {
      ok: false,
      error: "empty_scopes",
      message: "Au moins un scope est requis.",
    }
  }

  const unknown = normalized.find((s) => !GRANTABLE_SCOPES.includes(s))
  if (unknown) {
    return {
      ok: false,
      error: "unknown_scope",
      message: `Scope inconnu : ${unknown}. Valides : ${GRANTABLE_SCOPES.join(", ")}.`,
    }
  }

  const declared = dedupe(clientScopes.map((s) => s.trim()).filter(Boolean))
  const allowed = new Set<string>([...STANDARD_OIDC_SCOPES, ...declared])
  const notDeclared = normalized.find((s) => !allowed.has(s))
  if (notDeclared) {
    return {
      ok: false,
      error: "scope_not_declared",
      message: `L'application n'a pas déclaré le scope ${notDeclared}.`,
    }
  }

  return { ok: true, value: normalized }
}

/**
 * Fusionne un consentement déjà accordé avec un nouveau.
 *
 * L'union, jamais le remplacement : re-consentir à `openid profile` ne doit pas
 * retirer un `email` accordé précédemment. Une réduction du périmètre est une
 * révocation — elle passe par `revoke` / `revokeForClient`, avec son audit.
 */
export function mergeConsentScopes(
  existing: string[],
  granted: string[],
): string[] {
  return dedupe([...existing, ...granted].map((s) => s.trim()).filter(Boolean))
}

/** Dédoublonne en préservant l'ordre de première apparition. */
function dedupe(values: string[]): string[] {
  return [...new Set(values)]
}
