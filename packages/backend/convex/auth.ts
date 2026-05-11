import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { betterAuth } from "better-auth/minimal";
import { emailOTP, haveIBeenPwned, jwt, twoFactor } from "better-auth/plugins";

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
import { sendOtpEmail } from "./email/provider";

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

      // OTP 6 chiffres pour vérification email, reset password, changement email
      emailOTP({
        otpLength: 6,
        expiresIn: 60 * 15, // 15 min (§3.2)
        sendVerificationOnSignUp: true, // OTP envoyé automatiquement au sign-up
        sendVerificationOTP: async ({ email, otp, type }) => {
          await sendOtpEmail(ctx as any, {
            to: email,
            code: otp,
            type,
          });
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

      // Serveur OAuth/OIDC — RS256 obligatoire, PKCE requis (§3.7, §6.5)
      // Successeur de l'ancien `oidcProvider` (plugin déprécié).
      oauthProvider({
        loginPage: "/connexion",
        consentPage: "/consentement",
        requirePKCE: true,
        // Les endpoints metadata sont montés à la racine convex.site
        // dans http.ts (RFC 8414 + OIDC Discovery). Le plugin n'a pas
        // moyen de tester leur présence à runtime, on lui dit qu'on a fait
        // le nécessaire.
        silenceWarnings: {
          oauthAuthServerConfig: true,
          openidConfig: true,
        },
        // Le plugin 1.6.10 a renommé `oauthApplication` → `oauthClient` dans
        // son schema. Le composant @convex-dev/better-auth 0.12.2 n'expose
        // que `oauthApplication` côté adapter. On force le mapping inverse
        // pour que les queries `findOne({ model: "oauthClient" })` du plugin
        // ciblent la table `oauthApplication` côté Convex.
        schema: {
          oauthClient: { modelName: "oauthApplication" },
        },
        // Active la Dynamic Client Registration (RFC 7591) en mode public
        // pour pouvoir enregistrer des clients via le standard plutôt qu'en
        // écrivant directement dans la table (le format de `redirectUrls`
        // attendu par le plugin n'est pas trivial à reproduire à la main).
        // À durcir en prod (auth requise + rate limit).
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
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
