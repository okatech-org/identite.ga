/**
 * Claims standards émis par le provider OIDC IDN.
 * Tous optionnels sauf `sub` et `email` — l'absence d'un claim custom
 * (`loa`, `profile_type`, …) ne doit pas casser l'auth de base.
 */
export interface IDNUser {
  sub: string
  email: string
  email_verified: boolean
  name?: string
  given_name?: string
  family_name?: string
  birthdate?: string
  gender?: "male" | "female" | "other"
  nationality?: string
  profile_type?: "citizen" | "resident" | "visitor" | "developer"
  acr?: "eidas1" | "eidas2" | "eidas3"
  loa?: 1 | 2 | 3
  picture?: string
  updated_at?: number
  [claim: string]: unknown
}

/**
 * Statut de vérification d'identité renvoyé par l'endpoint
 * `/api/auth/oauth2/verification` (interrogeable avec l'access token).
 *
 * À la différence du claim `loa`/`acr` (figé au login), reflète l'état VIVANT
 * d'une demande de vérification — permet d'afficher « en cours de vérification »
 * ou « action requise » côté application relying party.
 */
export interface IDNVerificationStatus {
  /** Niveau de garantie courant (1 = email seul, 2/3 = identité vérifiée). */
  loa: 1 | 2 | 3
  acr: "eidas1" | "eidas2" | "eidas3"
  /** Raccourci : `loa >= 2`. */
  verified: boolean
  verification: {
    /**
     * - `none` : aucune vérification — proposez-en une
     * - `in_progress` : soumise, en cours d'examen (rien à faire)
     * - `action_required` : l'utilisateur doit agir (finir / compléter)
     * - `approved` : identité vérifiée
     * - `rejected` : demande refusée (l'utilisateur peut recommencer)
     */
    status: "none" | "in_progress" | "action_required" | "approved" | "rejected"
    /** L'utilisateur doit agir pour faire avancer la vérification. */
    action_required: boolean
    /** Lien vers le flux de vérification identite.ga où l'envoyer. */
    action_url: string
    /** Message du contrôleur si un complément est demandé, sinon `null`. */
    message: string | null
    /** Dernière mise à jour de la demande (ms epoch), `null` si aucune. */
    updated_at: number | null
  }
}

export interface IDNTokens {
  accessToken: string
  refreshToken?: string
  idToken: string
  tokenType: "Bearer"
  /** Timestamp Unix en secondes — moment où expire l'access token */
  expiresAt: number
  scope?: string
}

export interface IDNSession {
  user: IDNUser
  tokens: IDNTokens
}

export interface StorageAdapter {
  get(key: string): string | null | Promise<string | null>
  set(key: string, value: string): void | Promise<void>
  remove(key: string): void | Promise<void>
}

export type StorageKind = "localStorage" | "sessionStorage" | "memory" | StorageAdapter

export interface IDNClientConfig {
  /** Identifiant client OAuth enregistré sur identité.ga */
  clientId: string
  /** URI de retour après autorisation. Doit être enregistré côté plateforme. */
  redirectUri: string
  /** Issuer OIDC. Défaut : `https://site.identite.ga`. */
  issuer?: string
  /** URL discovery override. Défaut : `${issuer}/api/auth/convex/.well-known/openid-configuration`. */
  discoveryUrl?: string
  /** Scopes demandés. Défaut : `["openid", "profile", "email"]`. */
  scopes?: string[]
  /** Niveau LoA minimum exigé (envoie `acr_values`). */
  acrValues?: Array<"eidas1" | "eidas2" | "eidas3">
  /** Storage des tokens. Défaut : `localStorage` côté browser, `memory` sinon. */
  storage?: StorageKind
  /** Refresh automatique si l'access token expire dans moins de N secondes. Défaut : 60. */
  refreshThreshold?: number
}

export interface DiscoveryDocument {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  jwks_uri: string
  end_session_endpoint?: string
  revocation_endpoint?: string
  response_types_supported?: string[]
  id_token_signing_alg_values_supported?: string[]
  code_challenge_methods_supported?: string[]
}

export interface SignInOptions {
  /** Paramètres OAuth additionnels à ajouter à la requête authorize */
  extraParams?: Record<string, string>
  /** Surcharge des scopes pour cet appel */
  scopes?: string[]
  /** Surcharge des acr_values pour cet appel */
  acrValues?: string[]
}

export interface SignOutOptions {
  /** Redirection après logout (post_logout_redirect_uri) */
  redirectTo?: string
  /** N'envoie pas la requête de logout au provider (clear local seulement) */
  localOnly?: boolean
}

export type IDNEvent =
  | "signIn"
  | "signOut"
  | "session:expired"
  | "token:refreshed"
  | "error"

export type IDNEventPayload = {
  signIn: { session: IDNSession }
  signOut: void
  "session:expired": void
  "token:refreshed": { tokens: IDNTokens }
  error: { error: Error }
}

export type IDNEventListener<E extends IDNEvent> = (
  payload: IDNEventPayload[E],
) => void
