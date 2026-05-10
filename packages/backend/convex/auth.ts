import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { betterAuth } from "better-auth/minimal";
import { emailOTP, haveIBeenPwned, jwt, twoFactor } from "better-auth/plugins";

import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import { sendOtpEmail } from "./email/provider";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

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
 */
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    appName: "IDN",
    baseURL: SITE_URL,
    database: authComponent.adapter(ctx),
    trustedOrigins: [
      "https://identite.ga",
      "https://connexion.identite.ga",
      "http://localhost:3000",
    ],
    emailAndPassword: {
      enabled: true,
      // Le sign-up crée immédiatement la session (sinon impossible d'appeler
      // les mutations IDN avant d'avoir signé séparément). La vérification
      // d'email reste obligatoire côté métier : nos mutations sensibles
      // passent par requireVerifiedAuth() qui contrôle `emailVerified`.
      requireEmailVerification: false,
      minPasswordLength: 12,
      maxPasswordLength: 256,
      // TODO(idn): brancher zxcvbn-ts + HIBP via before-hook Better Auth
      // avant signUp/changePassword. Helper prêt dans `convex/lib/password.ts`.
      // Phase 1 : validation côté formulaire (apps/web) ; serveur Phase 1.5.
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14, // 14 jours (§6.3)
      updateAge: 60 * 60 * 24, // refresh quotidien
    },
    plugins: [
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
      }),

      // Émission ID tokens RS256 + JWKS publique (§6.1)
      jwt({
        jwks: { keyPairConfig: { alg: "RS256", modulusLength: 2048 } },
      }),

      // RBAC — rôles IDN (§3.9, §3.10, §3.11) gérés via notre propre table
      // `roles` (cf. schema.ts) plutôt que via le plugin admin de Better Auth :
      // ce dernier ajoute des colonnes (banned, role, banExpires) que l'adapter
      // @convex-dev/better-auth ne reconnaît pas encore. requireAdmin /
      // requireController dans convex/lib/auth.ts lisent depuis notre table.

      // Plugin requis par @convex-dev/better-auth pour exposer l'auth à Convex
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
