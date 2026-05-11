/**
 * Helper `idn()` pour Better Auth — s'utilise comme `auth0()`, `keycloak()`,
 * `okta()` dans le plugin `genericOAuth`.
 *
 * ```ts
 * import { genericOAuth } from "better-auth/plugins";
 * import { idn } from "@idn/better-auth";
 *
 * export const auth = betterAuth({
 *   plugins: [
 *     genericOAuth({
 *       config: [
 *         idn({
 *           clientId: process.env.IDN_CLIENT_ID!,
 *           clientSecret: process.env.IDN_CLIENT_SECRET!,
 *         }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */

const DEFAULT_ISSUER = "https://identite.ga"
const DEFAULT_SCOPES = ["openid", "profile", "email"]
const DEFAULT_PROVIDER_ID = "idn"

/** Claims standards retournés par le userinfo IDN. */
export interface IDNProfile {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
  birthdate?: string
  nationality?: string
  profile_type?: "citizen" | "resident" | "visitor" | "developer"
  acr?: "eidas1" | "eidas2" | "eidas3"
  loa?: 1 | 2 | 3
  [claim: string]: unknown
}

export interface IDNHelperOptions {
  /** client_id émis par identité.ga (obligatoire) */
  clientId: string
  /** client_secret émis par identité.ga (obligatoire, serveur uniquement) */
  clientSecret: string
  /** Issuer OIDC. Défaut : `https://identite.ga` */
  issuer?: string
  /** Override de l'URL discovery (sinon dérivée de l'issuer) */
  discoveryUrl?: string
  /** Scopes demandés. Défaut : `["openid", "profile", "email"]` */
  scopes?: string[]
  /** Niveau LoA minimum (envoie acr_values) */
  acrValues?: Array<"eidas1" | "eidas2" | "eidas3">
  /** Identifiant interne du provider (défaut : `"idn"`) */
  providerId?: string
  /**
   * Surcharge du mapping profil → user Better Auth.
   * Par défaut, mappe les claims standards.
   */
  mapProfileToUser?: (profile: IDNProfile) => Record<string, unknown>
}

const defaultMapProfileToUser = (profile: IDNProfile): Record<string, unknown> => ({
  email: profile.email,
  emailVerified: profile.email_verified,
  name:
    profile.name ??
    ([profile.given_name, profile.family_name].filter(Boolean).join(" ") ||
      profile.email),
  image: profile.picture,
  // Champs custom IDN — à câbler dans le schéma Better Auth de l'app consommatrice.
  idnSub: profile.sub,
  idnLoA: profile.loa,
  idnAcr: profile.acr,
  idnProfileType: profile.profile_type,
  idnNationality: profile.nationality,
})

/**
 * Construit une entrée de configuration `genericOAuth` pré-remplie pour
 * Identité Numérique du Gabon.
 *
 * Le retour est typé `Record<string, unknown>` pour rester compatible avec
 * les évolutions mineures de l'API Better Auth — passer le résultat tel quel
 * dans `config: [idn(...)]`.
 */
export const idn = (options: IDNHelperOptions): Record<string, unknown> => {
  if (!options.clientId) {
    throw new Error("[@idn/better-auth] clientId requis")
  }
  if (!options.clientSecret) {
    throw new Error("[@idn/better-auth] clientSecret requis")
  }

  const issuer = (options.issuer ?? DEFAULT_ISSUER).replace(/\/+$/, "")
  const discoveryUrl =
    options.discoveryUrl ?? `${issuer}/.well-known/openid-configuration`
  const scopes = options.scopes ?? DEFAULT_SCOPES
  const mapProfileToUser = options.mapProfileToUser ?? defaultMapProfileToUser

  const config: Record<string, unknown> = {
    providerId: options.providerId ?? DEFAULT_PROVIDER_ID,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    discoveryUrl,
    pkce: true,
    scopes,
    mapProfileToUser: (profile: unknown) =>
      mapProfileToUser(profile as IDNProfile),
  }

  // acr_values est un paramètre OIDC standard transmis à l'authorization
  // endpoint — Better Auth l'expose via `authorizationUrlParams` (1.6+).
  if (options.acrValues && options.acrValues.length > 0) {
    config.authorizationUrlParams = {
      acr_values: options.acrValues.join(" "),
    }
  }

  return config
}

export default idn
