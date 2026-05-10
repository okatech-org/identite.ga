# ADR-0004 — Better Auth comme moteur d'authentification et OIDC

- **Statut** : Accepté
- **Date** : 2026-05-10
- **Décideurs** : équipe IDN

## Contexte

IDN doit être **fournisseur d'identité OIDC** (cf. cahier §3.7) : authorization code flow + PKCE obligatoire, ID tokens RS256, JWKS public, claims standards + custom (`acr`, `idn:loa:<n>`), scopes, écran de consentement, back-channel logout.

En plus de l'OIDC pour les apps tierces, il faut gérer en interne : email + password, OTP email 6 chiffres, 2FA TOTP (admin et contrôleur obligatoire), récupération de mot de passe, sessions multi-appareils (max 10/user, 14 jours), audit log. Le tout en respectant la politique mots de passe §6.2 (≥12 chars, zxcvbn ≥3, vérification HIBP) et le rate limiting §6.6.

L'objectif est de livrer Phase 1 sans réinventer ces primitives, tout en gardant le frontend et le SDK **agnostiques du backend** pour permettre la migration Phase 4 vers Ory Kratos + Hydra (cf. ADR-0003).

## Décision

Adopter **Better Auth 1.6+** comme moteur d'auth, intégré à Convex via le composant officiel **`@convex-dev/better-auth`**.

Configuration dans `packages/backend/convex/auth.ts` :

```ts
betterAuth({
  appName: "IDN",
  database: authComponent.adapter(ctx),
  emailAndPassword: { enabled: true, requireEmailVerification: false, minPasswordLength: 12 },
  session: { expiresIn: 14 * 24 * 3600, updateAge: 24 * 3600 },
  plugins: [
    emailOTP({ otpLength: 6, expiresIn: 15 * 60, sendVerificationOnSignUp: true, ... }),
    twoFactor({ issuer: "IDN" }),
    haveIBeenPwned({ ... }),
    oauthProvider({ loginPage: "/sign-in", consentPage: "/consent", requirePKCE: true }),
    jwt({ jwks: { keyPairConfig: { alg: "RS256", modulusLength: 2048 } } }),
    convex({ authConfig }),
  ],
})
```

**Le serveur OIDC** est fourni par `@better-auth/oauth-provider` (paquet npm séparé) — successeur officiel du plugin `oidcProvider` de `better-auth/plugins` qui est déprécié depuis Better Auth 1.6.10.

**RS256 + JWKS** : assurés par le plugin `jwt`. Les clés RSA 2048 sont générées automatiquement, stockées dans la table `jwks` du composant Better Auth, et exposées via `/api/auth/convex/jwks`.

**Côté `apps/web`** :
- `lib/auth-client.ts` — `createAuthClient` avec `convexClient()` plugin.
- `lib/auth-server.ts` — `convexBetterAuthNextJs({ convexUrl, convexSiteUrl })` qui expose `handler.GET/POST` et `isAuthenticated()`.
- `app/api/auth/[...all]/route.ts` — proxy Next.js vers les routes Better Auth montées sur Convex.
- `providers.tsx` — `ConvexBetterAuthProvider` (au lieu de `ConvexProvider`) qui synchronise le JWT Better Auth avec le client Convex.

## Alternatives envisagées

1. **Implémenter un serveur OIDC maison sur Convex** — réinvente la roue, sécurité difficile à valider, écran de consentement et JWKS rotation à coder à la main. Rejeté.
2. **Auth.js (NextAuth)** — bon pour login web mais pas conçu comme serveur OIDC. Le projet sœur authjs n'est pas un OAuth Provider.
3. **Démarrer Phase 1 directement sur Ory Hydra + Kratos** — cf. ADR-0003 : trop d'infra à monter avant d'itérer.
4. **Clerk / Auth0** — solutions payantes opaques, pas migrables vers une stack souveraine sans réécrire tout l'auth. Et coûts qui scalent mal avec un identifiant national.
5. **Plugin `oidcProvider` de `better-auth/plugins`** — utilisé initialement, mais déprécié dès 1.6.x avec un warning explicite : « Use `@better-auth/oauth-provider` instead. This plugin will be removed in the next major version. » Migration faite immédiatement.

## Conséquences

**Positives**
- OIDC standard end-to-end : authorize, token, userinfo, JWKS, well-known. Une app tierce peut s'authentifier dès Phase 1.
- HIBP nativement (plugin `haveIBeenPwned`) → conforme §6.2 sans helper custom.
- 2FA TOTP via plugin `twoFactor` — il restera à câbler l'UI Mon profil → Sécurité, le backend est prêt.
- L'OIDC contract (PKCE, RS256, scopes) ne change pas en Phase 4 : le SDK ne sera pas impacté par la migration.
- Sessions, refresh tokens, OAuth applications gérés par Better Auth — pas de code maison à maintenir.

**Négatives**
- Couplage à Better Auth côté serveur. Migrer vers Ory implique de remapper les tables (`user`, `session`, `oauthApplication`) → Kratos/Hydra. Pas trivial mais documenté (cf. cahier §11).
- Le plugin `admin` de Better Auth ajoute des colonnes (`role`, `banned`, `banExpires`) que l'adapter `@convex-dev/better-auth` ne reconnaît pas encore (validator schéma fixe). On a contourné en gérant les rôles dans une table séparée — cf. ADR-0005.
- `requireEmailVerification: true` natif Better Auth empêche la création de session avant vérification, ce qui interrompt notre tunnel d'inscription. On a choisi `false` + gating métier — cf. ADR-0006.
- Better Auth est encore en évolution rapide (1.6.10 au moment de l'écriture) — il faut surveiller les release notes.

**Suivi**
- Câbler le cron de rotation JWKS 90 jours avec chevauchement 7 jours (§6.1).
- Implémenter l'écran de consentement OAuth (`/consent`) pour les apps non-trusted.
- Documenter le mapping Better Auth → Ory Kratos pour la Phase 4 (ADR de migration au moment T).
- Quand Better Auth `1.7` sortira, vérifier que `oidcProvider` du paquet de base est définitivement retiré.

## Références

- Cahier des charges §3.7 (OIDC), §6.1–6.5 (Sécurité auth), §9 (Phases), §11 (Migration)
- [Better Auth docs](https://better-auth.com/docs)
- [@convex-dev/better-auth](https://github.com/get-convex/better-auth) ([guide Next.js](https://labs.convex.dev/better-auth/framework-guides/next))
- [@better-auth/oauth-provider](https://www.better-auth.com/docs/plugins/oauth-provider)
- ADR-0003 (Convex backend)
- ADR-0005 (RBAC via userRole)
- ADR-0006 (Session au sign-up)
