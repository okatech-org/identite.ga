import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { expo } from "@better-auth/expo";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth/minimal";
import {
  emailOTP,
  haveIBeenPwned,
  jwt,
  oidcProvider,
  twoFactor,
} from "better-auth/plugins";

// ─────────────────────────────────────────────────────────────────────────
// Polyfill : `URL.canParse` (Node 19.9+ / Bun) — le V8 runtime Convex ne
// l'expose pas, et @better-auth/oauth-provider v1.6.x l'utilise (sinon
// les routes /api/auth/oauth2/{authorize,register,...} crashent avec
// `TypeError: URL.canParse is not a function`).
//
// Spec : retourne true si `new URL(input, base)` ne throw pas.
// ─────────────────────────────────────────────────────────────────────────
if (typeof (URL as { canParse?: unknown }).canParse !== "function") {
  ;(URL as { canParse: (input: string, base?: string) => boolean }).canParse = (
    input: string,
    base?: string,
  ) => {
    try {
      new URL(input, base)
      return true
    } catch {
      return false
    }
  }
}

import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import { pinSignIn } from "./lib/pinSignInPlugin";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Trusted origins lus depuis la variable d'env Convex `TRUSTED_ORIGINS`
 * (CSV). En dev, la fonction `trustedOrigins` ci-dessous accepte aussi
 * dynamiquement n'importe quel `localhost` / `127.0.0.1` / `*.local`
 * venant du header Origin.
 *
 * Set via : `bunx convex env set TRUSTED_ORIGINS "https://...,https://..."`
 */
function parseTrustedOrigins(): string[] {
  return (process.env.TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Dérive le `siteUrl` du plugin crossDomain depuis le header Origin de la
 * requête. Permet à chaque app (web, admin, developer, controller) de se
 * voir renvoyer les redirects OAuth/OIDC vers son propre origin.
 *
 * Fallback : env SITE_URL → "http://localhost:3000".
 */
function resolveSiteUrl(origin?: string | null): string {
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      /* invalid origin, use fallback */
    }
  }
  return process.env.SITE_URL ?? "http://localhost:3000";
}

/**
 * Client Better Auth + Convex.
 * Le composant @convex-dev/better-auth gère ses propres tables (user,
 * account, session, oauthApplication, oauthConsent, jwks, etc.) dans
 * son namespace isolé.
 */
export const authComponent = createClient<DataModel>(components.betterAuth);

/**
 * Configuration Better Auth — appelée à chaque requête HTTP via http.ts.
 * Cf. cahier §6.2 (auth + politique mots de passe), §6.4 (sessions),
 * §6.5 (OIDC hardening), §3.7 (serveur OIDC).
 *
 * `requestOrigin` est passé par http.ts (header Origin de la requête)
 * pour que le plugin crossDomain rewrite les callbacks OAuth vers l'app
 * appelante.
 */
export const createAuth = (
  ctx: GenericCtx<DataModel>,
  requestOrigin?: string | null,
) => {
  return betterAuth({
    appName: "IDN",
    // baseURL = CONVEX_SITE_URL pour que le JWT `iss` corresponde à ce
    // qu'attend Convex (cf. auth.config.ts → getAuthConfigProvider()).
    // L'origin dynamique de l'app appelante n'est utilisée que par le
    // plugin crossDomain pour rewrite les redirects OAuth.
    baseURL: process.env.CONVEX_SITE_URL,
    database: authComponent.adapter(ctx),
    trustedOrigins: isDev
      ? (request) => {
          const origins = parseTrustedOrigins();
          const reqOrigin = request?.headers?.get("origin");
          if (reqOrigin) {
            try {
              const url = new URL(reqOrigin);
              if (
                url.hostname === "localhost" ||
                url.hostname === "127.0.0.1" ||
                url.hostname.endsWith(".local")
              ) {
                origins.push(reqOrigin);
              }
            } catch {
              /* ignore */
            }
          }
          return origins;
        }
      : parseTrustedOrigins(),
    emailAndPassword: {
      enabled: true,
      // Le sign-up crée immédiatement la session (sinon impossible d'appeler
      // les mutations IDN avant d'avoir signé séparément). La vérification
      // d'email reste obligatoire côté métier : nos mutations sensibles
      // passent par requireVerifiedAuth() qui contrôle `emailVerified`.
      requireEmailVerification: false,
      minPasswordLength: 12,
      maxPasswordLength: 256,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14, // 14 jours (§6.3)
      updateAge: 60 * 60 * 24, // refresh quotidien
    },
    /**
     * Hook DB Better Auth : à chaque création de session (sign-in OK,
     * sign-up OK ou OTP/2FA vérifié), on écrit un événement `login_success`
     * dans `auditLog`. C'est ce qui alimente la sparkline « Connexions
     * par jour » du dashboard admin (cf. admin/dashboard.getDailyLogins).
     */
    databaseHooks: {
      session: {
        create: {
          after: async (session: {
            userId?: string
            ipAddress?: string | null
            userAgent?: string | null
          }) => {
            try {
              await (ctx as unknown as {
                runMutation: (
                  ref: typeof internal.audit.recordAudit,
                  args: {
                    actorId?: string
                    action: "login_success"
                    targetType: "session"
                    targetId: string
                    ip?: string
                    userAgent?: string
                  },
                ) => Promise<unknown>
              }).runMutation(internal.audit.recordAudit, {
                actorId: session.userId ?? undefined,
                action: "login_success",
                targetType: "session",
                targetId: session.userId ?? "—",
                ip: session.ipAddress ?? undefined,
                userAgent: session.userAgent ?? undefined,
              })
            } catch (err) {
              // Ne pas casser la connexion si l'audit foire.
              console.error("[auth] login audit failed", err)
            }
          },
        },
      },
    },
    advanced: {
      // Convex tourne toujours en HTTPS → Better Auth infère Secure cookies.
      // En dev, le proxy Next.js parle en http://localhost → le navigateur
      // refuserait les cookies Secure. On les force non-secure (le proxy
      // strip aussi le préfixe __Secure- au passage).
      useSecureCookies: isDev ? false : undefined,
    },
    plugins: [
      // Réécrit les redirects OAuth/OIDC vers l'origin de l'app appelante
      // (web, admin, developer, controller, connect). Permet aussi au
      // crossDomainClient côté navigateur d'enregistrer la session via
      // localStorage (cookies cross-domain non garantis).
      crossDomain({
        siteUrl: resolveSiteUrl(requestOrigin),
      }),

      // Sign-in par PIN à 6 chiffres — endpoint /api/auth/sign-in/pin.
      // Le plugin reçoit (email, pin), résout l'email via Better Auth,
      // vérifie le pinHash côté Convex (PBKDF2-SHA256, §6.1) puis crée
      // la session standard via internalAdapter.createSession.
      pinSignIn(async (userId, pin) => {
        return await (ctx as unknown as {
          runQuery: (
            ref: typeof internal.onboarding.verifyPinForUserId,
            args: { userId: string; pin: string },
          ) => Promise<boolean>
        }).runQuery(internal.onboarding.verifyPinForUserId, {
          userId,
          pin,
        });
      }),

      // Support Expo (beta) — gère le retour de session via deep link
      // (scheme idn://) et l'authent depuis l'app mobile RN. À utiliser
      // conjointement avec expoClient() côté client + expo-secure-store.
      expo(),

      // WebAuthn / passkey — enrôlement biométrique (Face ID / Touch ID
      // sur iOS, Credential Manager sur Android, plateformes WebAuthn sur
      // desktop). `rpID` = hostname (sans schéma ni port). `origin` doit
      // inclure tous les origins qui authentifient (HTTPS de prod, scheme
      // expo, dev tunnels). En dev par défaut on accepte localhost.
      passkey({
        rpID: process.env.PASSKEY_RP_ID ?? "localhost",
        rpName: "Identité Numérique",
        origin: (() => {
          const csv = process.env.PASSKEY_RP_ORIGINS ?? "";
          const fromEnv = csv.split(",").map((o) => o.trim()).filter(Boolean);
          // Toujours autoriser le scheme expo mobile (idn://) en plus.
          return fromEnv.length > 0 ? [...fromEnv, "idn://"] : ["idn://"];
        })(),
      }),

      // OTP 6 chiffres — utilisé pour reset password / changement email côté
      // admin/web ; l'inscription IDN ne déclenche pas d'OTP (l'adresse
      // @idn.ga est vérifiée par construction via `onboarding.completeSignup`).
      emailOTP({
        otpLength: 6,
        expiresIn: 60 * 15, // 15 min (§3.2)
        sendVerificationOnSignUp: false,
        sendVerificationOTP: async ({ email, otp, type }) => {
          await (ctx as any).scheduler.runAfter(
            0,
            internal.email.dispatch.sendOtp,
            { to: email, code: otp, type },
          );
        },
      }),

      // 2FA TOTP (obligatoire admin / identity_controller — §6.2)
      twoFactor({ issuer: "IDN" }),

      // Vérification HIBP côté Better Auth — bloque les mots de passe leakés
      // sur sign-up / change-password / reset-password.
      haveIBeenPwned({
        customPasswordCompromisedMessage:
          "Ce mot de passe figure dans une fuite de données publique. Choisissez-en un autre.",
      }),

      // Serveur OAuth/OIDC — `oidcProvider` intégré à better-auth/plugins
      // (NB : pas le plugin séparé `@better-auth/oauth-provider` qui n'est
      // pas compatible avec le schema du composant @convex-dev/better-auth
      // 0.12.2 — voir l'ancien projet /Users/berny/Developer/idn/apps/portal
      // qui utilise déjà ce pattern).
      //
      // `loginPage` / `consentPage` sont des URLs complètes vers apps/connect
      // (point d'authentification fédéré) — Convex ne sert pas de HTML.
      // `useJWTPlugin: true` → ID tokens signés en RS256 via le plugin jwt
      // ci-dessous (§6.1) plutôt qu'en HS256 avec BETTER_AUTH_SECRET.
      oidcProvider({
        // Scopes custom `idn:*` supportés en plus des scopes OIDC standard.
        // Better Auth valide CHAQUE scope demandé sur /authorize contre une
        // allowlist GLOBALE = ["openid","profile","email","offline_access",
        // ...scopes] (voir oidc-provider/authorize.mjs). Les scopes déclarés
        // par client dans le portail développeur ne sont PAS consultés ici :
        // sans cette option, tout scope custom (ex. idn:civil_status) est
        // rejeté avec `invalid_scope`. À garder en phase avec AVAILABLE_SCOPES
        // (apps/developer/.../applications/new) et claimsForScopes
        // (apps/connect/.../consent-form.tsx).
        scopes: ["idn:civil_status"],
        loginPage:
          process.env.IDN_LOGIN_PAGE ?? "http://localhost:3004/sign-in",
        consentPage:
          process.env.IDN_CONSENT_PAGE ?? "http://localhost:3004/oauth/authorize",
        requirePKCE: true,
        useJWTPlugin: true,
        allowPlainCodeChallengeMethod: false,
        // Stocke ET compare les client_secret HACHÉS (base64url(SHA-256(secret))
        // sans padding = `defaultClientSecretHasher` de better-auth) au lieu d'en
        // clair. Le portail développeur (developer/apps.ts → hashClientSecret) doit
        // stocker le secret avec EXACTEMENT ce même hash. Sans cette option,
        // oidcProvider compare le secret reçu en clair à la valeur stockée : tout
        // client créé via le portail (qui stocke un hash) échouait alors au token
        // endpoint avec `invalid_client`.
        storeClientSecret: "hashed",
        // Injecte le claim `env` (sandbox/production) dans l'ID token et la
        // réponse /oauth2/userinfo. Sert aussi de filet défensif : si un
        // utilisateur non whitelisté contourne l'UI consent en sandbox, on
        // throw — Better Auth refuse alors l'émission du token.
        getAdditionalUserInfoClaim: (user, _scopes, client) => {
          const meta = (client.metadata ?? {}) as Record<string, unknown>
          const env = meta.env === "production" ? "production" : "sandbox"
          if (env === "sandbox") {
            const list = Array.isArray(meta.testUsers)
              ? (meta.testUsers as unknown[]).map((e) =>
                  typeof e === "string" ? e.toLowerCase() : "",
                )
              : []
            const email = String(
              (user as { email?: unknown }).email ?? "",
            ).toLowerCase()
            const ownerId =
              typeof meta.createdBy === "string" ? meta.createdBy : null
            const userId = String(
              (user as { id?: unknown }).id ?? "",
            )
            if (
              email.length > 0 &&
              !list.includes(email) &&
              (ownerId === null || userId !== ownerId)
            ) {
              throw new Error("sandbox_access_denied")
            }
          }
          return { env }
        },
      }),

      // Émission ID tokens RS256 + JWKS publique (§6.1)
      jwt({
        jwks: { keyPairConfig: { alg: "RS256", modulusLength: 2048 } },
      }),

      // Plugin requis par @convex-dev/better-auth pour exposer l'auth à
      // Convex (endpoint /api/auth/convex/token utilisé par
      // ConvexBetterAuthProvider). Enregistré en dernier — c'était l'ordre
      // qui fonctionnait avec @convex-dev/better-auth 0.12.x.
      convex({ authConfig }),
    ],
  });
};

/**
 * Renvoie le user Better Auth courant (côté Convex query/mutation).
 * Helper standard de @convex-dev/better-auth — accède aux tables du
 * composant isolé via son adapter.
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx);
  },
});
