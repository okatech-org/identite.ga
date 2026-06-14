import { fetchDiscovery } from "./discovery.js"
import { EventBus } from "./events.js"
import { verifyIdToken } from "./jwks.js"
import { challengeS256, generateVerifier, randomString } from "./pkce.js"
import { resolveStorage, storageKeys } from "./storage.js"
import {
  exchangeCode,
  fetchUserInfo,
  fetchVerificationStatus,
  refreshAccessToken,
  revokeToken,
} from "./tokens.js"
import type {
  DiscoveryDocument,
  IDNClientConfig,
  IDNEvent,
  IDNEventListener,
  IDNSession,
  IDNTokens,
  IDNUser,
  IDNVerificationStatus,
  SignInOptions,
  SignOutOptions,
  StorageAdapter,
} from "./types.js"

// Custom domain HTTP Actions du déploiement Convex prod IDN.
const DEFAULT_ISSUER = "https://site.identite.ga"
const DEFAULT_SCOPES = ["openid", "profile", "email"]
const DEFAULT_REFRESH_THRESHOLD = 60

interface PendingFlow {
  codeVerifier: string
  state: string
  nonce: string
  redirectUri: string
  scopes: string[]
}

export class IDNClient {
  private readonly issuer: string
  private readonly clientId: string
  private readonly redirectUri: string
  private readonly scopes: string[]
  private readonly acrValues?: string[]
  private readonly discoveryUrl?: string
  private readonly refreshThreshold: number
  private readonly storage: StorageAdapter
  private readonly keys: ReturnType<typeof storageKeys>
  private readonly bus = new EventBus()
  private discoveryPromise?: Promise<DiscoveryDocument>
  private refreshPromise?: Promise<IDNTokens>

  constructor(config: IDNClientConfig) {
    if (!config.clientId) throw new Error("[@idn-ga/core] clientId requis")
    if (!config.redirectUri) throw new Error("[@idn-ga/core] redirectUri requis")
    this.clientId = config.clientId
    this.redirectUri = config.redirectUri
    this.issuer = (config.issuer ?? DEFAULT_ISSUER).replace(/\/+$/, "")
    this.scopes = config.scopes ?? DEFAULT_SCOPES
    this.acrValues = config.acrValues
    this.discoveryUrl = config.discoveryUrl
    this.refreshThreshold = config.refreshThreshold ?? DEFAULT_REFRESH_THRESHOLD
    this.storage = resolveStorage(config.storage)
    this.keys = storageKeys(this.clientId)
  }

  /** Démarre le flow OIDC — redirige vers l'authorization endpoint. */
  async signIn(opts: SignInOptions = {}): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("[@idn-ga/core] signIn() requiert un environnement browser")
    }
    const discovery = await this.getDiscovery()
    const codeVerifier = generateVerifier()
    const codeChallenge = await challengeS256(codeVerifier)
    const state = randomString()
    const nonce = randomString()
    const scopes = opts.scopes ?? this.scopes

    const pending: PendingFlow = {
      codeVerifier,
      state,
      nonce,
      redirectUri: this.redirectUri,
      scopes,
    }
    await this.storage.set(this.keys.pkce, JSON.stringify(pending))

    const url = new URL(discovery.authorization_endpoint)
    url.searchParams.set("response_type", "code")
    url.searchParams.set("client_id", this.clientId)
    url.searchParams.set("redirect_uri", this.redirectUri)
    url.searchParams.set("scope", scopes.join(" "))
    url.searchParams.set("state", state)
    url.searchParams.set("nonce", nonce)
    url.searchParams.set("code_challenge", codeChallenge)
    url.searchParams.set("code_challenge_method", "S256")
    const acrValues = opts.acrValues ?? this.acrValues
    if (acrValues && acrValues.length > 0) {
      url.searchParams.set("acr_values", acrValues.join(" "))
    }
    if (opts.extraParams) {
      for (const [k, v] of Object.entries(opts.extraParams)) {
        url.searchParams.set(k, v)
      }
    }
    window.location.assign(url.toString())
  }

  /**
   * À appeler sur la page de callback. Échange le code, vérifie l'ID token,
   * persiste la session.
   */
  async handleCallback(callbackUrl?: string): Promise<IDNSession> {
    const href =
      callbackUrl ?? (typeof window !== "undefined" ? window.location.href : undefined)
    if (!href) {
      throw new Error("[@idn-ga/core] handleCallback() : URL inconnue")
    }
    const url = new URL(href)
    const params = url.searchParams

    const oauthError = params.get("error")
    if (oauthError) {
      const desc = params.get("error_description") ?? oauthError
      const err = new Error(`[@idn-ga/core] OAuth error : ${desc}`)
      this.bus.emit("error", { error: err })
      throw err
    }

    const code = params.get("code")
    const returnedState = params.get("state")
    if (!code) throw new Error("[@idn-ga/core] code manquant dans la callback URL")
    if (!returnedState) throw new Error("[@idn-ga/core] state manquant dans la callback URL")

    const raw = await this.storage.get(this.keys.pkce)
    if (!raw) throw new Error("[@idn-ga/core] flow PKCE introuvable — sign-in expiré ?")
    const pending = JSON.parse(raw) as PendingFlow
    await this.storage.remove(this.keys.pkce)

    if (pending.state !== returnedState) {
      throw new Error("[@idn-ga/core] state mismatch — risque CSRF, flow rejeté")
    }

    const discovery = await this.getDiscovery()
    const tokens = await exchangeCode({
      discovery,
      clientId: this.clientId,
      code,
      codeVerifier: pending.codeVerifier,
      redirectUri: pending.redirectUri,
    })

    await verifyIdToken(tokens.idToken, {
      issuer: discovery.issuer,
      audience: this.clientId,
      jwksUri: discovery.jwks_uri,
      nonce: pending.nonce,
    })

    const user = await fetchUserInfo(discovery, tokens.accessToken)
    const session: IDNSession = { user, tokens }
    await this.storage.set(this.keys.session, JSON.stringify(session))
    this.bus.emit("signIn", { session })
    return session
  }

  /** Déconnexion : clear local + redirection vers end_session_endpoint si défini. */
  async signOut(opts: SignOutOptions = {}): Promise<void> {
    const session = await this.loadSession()
    await this.storage.remove(this.keys.session)
    this.bus.emit("signOut", undefined)

    if (opts.localOnly) return
    const discovery = await this.getDiscovery().catch(() => undefined)
    if (!discovery?.end_session_endpoint || typeof window === "undefined") return
    const url = new URL(discovery.end_session_endpoint)
    if (session?.tokens.idToken) {
      url.searchParams.set("id_token_hint", session.tokens.idToken)
    }
    if (opts.redirectTo) {
      url.searchParams.set("post_logout_redirect_uri", opts.redirectTo)
    }
    window.location.assign(url.toString())
  }

  async getSession(): Promise<IDNSession | null> {
    return this.loadSession()
  }

  isAuthenticated(): boolean {
    // Synchrone : si on est en browser, on regarde le storage local sans await
    // (les adapters web sont sync). Storage async = `false` côté SSR/Node.
    if (typeof window === "undefined") return false
    try {
      const raw = window.localStorage?.getItem(this.keys.session)
      if (!raw) return false
      const session = JSON.parse(raw) as IDNSession
      return session.tokens.expiresAt > Math.floor(Date.now() / 1000)
    } catch {
      return false
    }
  }

  async getUser(): Promise<IDNUser | null> {
    const session = await this.loadSession()
    return session?.user ?? null
  }

  /** Access token courant. Refresh auto si proche expiration. */
  async getAccessToken(): Promise<string | null> {
    const session = await this.loadSession()
    if (!session) return null
    const now = Math.floor(Date.now() / 1000)
    if (session.tokens.expiresAt - now > this.refreshThreshold) {
      return session.tokens.accessToken
    }
    if (!session.tokens.refreshToken) {
      this.bus.emit("session:expired", undefined)
      return null
    }
    const refreshed = await this.refreshToken()
    return refreshed?.accessToken ?? null
  }

  async refreshToken(): Promise<IDNTokens | null> {
    if (this.refreshPromise) return this.refreshPromise
    const session = await this.loadSession()
    if (!session?.tokens.refreshToken) return null

    const discovery = await this.getDiscovery()
    this.refreshPromise = refreshAccessToken({
      discovery,
      clientId: this.clientId,
      refreshToken: session.tokens.refreshToken,
    })

    try {
      const tokens = await this.refreshPromise
      const next: IDNSession = { user: session.user, tokens }
      await this.storage.set(this.keys.session, JSON.stringify(next))
      this.bus.emit("token:refreshed", { tokens })
      return tokens
    } catch (err) {
      // Refresh token rejeté → session expirée, on clean.
      await this.storage.remove(this.keys.session)
      this.bus.emit("session:expired", undefined)
      this.bus.emit("error", { error: err as Error })
      return null
    } finally {
      this.refreshPromise = undefined
    }
  }

  /**
   * Statut de vérification d'identité de l'utilisateur connecté — niveau (loa)
   * + état d'une éventuelle demande en cours (en cours / action requise /
   * refusée). Interroge `/oauth2/verification` avec l'access token courant.
   *
   * À utiliser pour afficher « ton identité est en cours de vérification » ou
   * proposer de la lancer/finir. Renvoie `null` si pas de session.
   */
  async getVerificationStatus(): Promise<IDNVerificationStatus | null> {
    const accessToken = await this.getAccessToken()
    if (!accessToken) return null
    const discovery = await this.getDiscovery()
    return fetchVerificationStatus(discovery, accessToken)
  }

  /**
   * Déclenche une vérification d'identité pour le compte de l'utilisateur :
   * relance le flow OIDC en exigeant un niveau de garantie (`acr_values`).
   * identite.ga propose alors le step-up (upload pièce + selfie) puis renvoie
   * l'utilisateur ici une fois le niveau atteint. `minLevel` 2 par défaut.
   */
  async requestIdentityVerification(
    minLevel: 2 | 3 = 2,
    opts: SignInOptions = {},
  ): Promise<void> {
    const acr = minLevel === 3 ? "eidas3" : "eidas2"
    return this.signIn({ ...opts, acrValues: [acr] })
  }

  async revoke(): Promise<void> {
    const session = await this.loadSession()
    if (!session) return
    const discovery = await this.getDiscovery().catch(() => undefined)
    if (!discovery) return
    if (session.tokens.refreshToken) {
      await revokeToken({
        discovery,
        clientId: this.clientId,
        token: session.tokens.refreshToken,
        tokenTypeHint: "refresh_token",
      })
    }
    await revokeToken({
      discovery,
      clientId: this.clientId,
      token: session.tokens.accessToken,
      tokenTypeHint: "access_token",
    })
  }

  on<E extends IDNEvent>(event: E, cb: IDNEventListener<E>): () => void {
    return this.bus.on(event, cb)
  }

  off<E extends IDNEvent>(event: E, cb: IDNEventListener<E>): void {
    this.bus.off(event, cb)
  }

  private async getDiscovery(): Promise<DiscoveryDocument> {
    if (!this.discoveryPromise) {
      this.discoveryPromise = fetchDiscovery(this.issuer, {
        discoveryUrl: this.discoveryUrl,
        storage: this.storage,
        cacheKey: this.keys.discovery,
      }).catch((err) => {
        this.discoveryPromise = undefined
        throw err
      })
    }
    return this.discoveryPromise
  }

  private async loadSession(): Promise<IDNSession | null> {
    const raw = await this.storage.get(this.keys.session)
    if (!raw) return null
    try {
      return JSON.parse(raw) as IDNSession
    } catch {
      await this.storage.remove(this.keys.session)
      return null
    }
  }
}

/** Factory style — `createIDNClient({...})`. */
export const createIDNClient = (config: IDNClientConfig): IDNClient =>
  new IDNClient(config)
