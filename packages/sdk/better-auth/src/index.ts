/**
 * Helper `idn()` pour Better Auth — s'utilise comme `auth0()`, `keycloak()`,
 * `okta()` dans le plugin `genericOAuth`.
 *
 * ```ts
 * import { genericOAuth } from "better-auth/plugins";
 * import { idn } from "@idn-ga/better-auth";
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

// Custom domain HTTP Actions du déploiement Convex prod IDN
// (cf. Dashboard Convex → Settings → Custom Domains).
const DEFAULT_ISSUER = "https://site.identite.ga"
// Le composant @convex-dev/better-auth namespace ses routes sous
// /api/auth/convex/*. Discovery + JWKS sont exposés là, pas à la racine.
const DEFAULT_DISCOVERY_PATH =
  "/api/auth/convex/.well-known/openid-configuration"
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
  birth_place?: string
  gender?: "M" | "F" | "O" | "N"
  nationality?: string
  profile_type?: "citizen" | "resident" | "visitor" | "developer"
  acr?: "eidas1" | "eidas2" | "eidas3"
  loa?: 1 | 2 | 3
  nip?: string
  env?: "sandbox" | "production"
  [claim: string]: unknown
}

interface BetterAuthOAuthTokens {
  accessToken?: string
}

type IDNGenericOAuthProfile = IDNProfile & {
  id: string
  emailVerified: boolean
  image?: string
}

export interface IDNHelperOptions {
  /** client_id émis par identité.ga (obligatoire) */
  clientId: string
  /** client_secret émis par identité.ga (obligatoire, serveur uniquement) */
  clientSecret: string
  /** Issuer OIDC. Défaut : `https://site.identite.ga` */
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
  idnBirthdate: profile.birthdate,
  idnNip: profile.nip,
  idnEnvironment: profile.env,
})

/**
 * Charge toujours le profil depuis l'endpoint `/userinfo` annoncé par le
 * discovery OIDC.
 *
 * Better Auth `genericOAuth` préfère sinon décoder l'ID token lorsqu'il
 * contient déjà `sub` et `email`, et n'appelle jamais `/userinfo`. Or le
 * contrat IDN expose volontairement les claims civils étendus dans
 * `/userinfo` plutôt que dans l'ID token.
 */
const createUserInfoFetcher = (discoveryUrl: string) => {
  let resolvedUserInfoUrl: string | undefined

  return async (
    tokens: BetterAuthOAuthTokens,
  ): Promise<IDNGenericOAuthProfile> => {
    if (!tokens.accessToken) {
      throw new Error("[@idn-ga/better-auth] access token userinfo manquant")
    }

    if (!resolvedUserInfoUrl) {
      const discoveryResponse = await fetch(discoveryUrl, {
        headers: { Accept: "application/json" },
      })
      if (!discoveryResponse.ok) {
        throw new Error(
          `[@idn-ga/better-auth] discovery ${discoveryResponse.status}`,
        )
      }
      const discovery = (await discoveryResponse.json()) as {
        userinfo_endpoint?: unknown
      }
      if (
        typeof discovery.userinfo_endpoint !== "string" ||
        !discovery.userinfo_endpoint
      ) {
        throw new Error(
          "[@idn-ga/better-auth] userinfo_endpoint absent du discovery",
        )
      }
      resolvedUserInfoUrl = discovery.userinfo_endpoint
    }

    const userInfoResponse = await fetch(resolvedUserInfoUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    })
    if (!userInfoResponse.ok) {
      throw new Error(
        `[@idn-ga/better-auth] userinfo ${userInfoResponse.status}`,
      )
    }

    const profile = (await userInfoResponse.json()) as IDNProfile
    if (!profile.sub || !profile.email) {
      throw new Error(
        "[@idn-ga/better-auth] profil userinfo incomplet (sub/email requis)",
      )
    }

    return {
      ...profile,
      id: profile.sub,
      emailVerified: profile.email_verified,
      ...(profile.picture ? { image: profile.picture } : {}),
    }
  }
}

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
    throw new Error("[@idn-ga/better-auth] clientId requis")
  }
  if (!options.clientSecret) {
    throw new Error("[@idn-ga/better-auth] clientSecret requis")
  }

  const issuer = (options.issuer ?? DEFAULT_ISSUER).replace(/\/+$/, "")
  const discoveryUrl =
    options.discoveryUrl ?? `${issuer}${DEFAULT_DISCOVERY_PATH}`
  const scopes = options.scopes ?? DEFAULT_SCOPES
  const mapProfileToUser = options.mapProfileToUser ?? defaultMapProfileToUser

  const config: Record<string, unknown> = {
    providerId: options.providerId ?? DEFAULT_PROVIDER_ID,
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    discoveryUrl,
    pkce: true,
    scopes,
    // Force l'appel documenté à `/userinfo`, même si Better Auth peut déjà
    // décoder un ID token contenant `sub` et `email`.
    getUserInfo: createUserInfoFetcher(discoveryUrl),
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
