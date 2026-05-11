# IDN SDK — Kit d'intégration

> **Cahier des charges — SDK `@idn-ga/*`**
> Version 1.0 — 10 mai 2026

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Périmètre et packages](#2-périmètre-et-packages)
3. [`@idn-ga/core` — Client OIDC vanilla](#3-idncore--client-oidc-vanilla)
4. [`@idn-ga/react` — Hooks et composants](#4-idnreact--hooks-et-composants)
5. [`@idn-ga/better-auth` — Helper genericOAuth](#5-idnbetter-auth--helper-genericoauth)
6. [`@idn-ga/next-auth` — Provider NextAuth](#6-idnnext-auth--provider-nextauth)
7. [Documentation et exemples](#7-documentation-et-exemples)
8. [Sécurité](#8-sécurité)
9. [Tests et qualité](#9-tests-et-qualité)
10. [Distribution](#10-distribution)
11. [Versioning et compatibilité](#11-versioning-et-compatibilité)
12. [Phases de livraison](#12-phases-de-livraison)
13. [Critères d'acceptation](#13-critères-dacceptation)

---

## 1. Présentation

### 1.1 Objet

Le **SDK IDN** est l'ensemble des packages npm qui permettent à n'importe quelle application — gouvernementale, privée, partenaire — d'intégrer **« Se connecter avec IDN »** en quelques lignes de code.

Le SDK est **strictement séparé** de la plateforme : il ne sait rien des internals de `identite.ga`, il dialogue uniquement via le **standard OpenID Connect**. Cela garantit :

- Indépendance vis-à-vis du backend OIDC retenu (Better Auth aujourd'hui, Ory Hydra demain)
- Possibilité d'usage par toute app qui n'utilise pas la stack IDN
- Interopérabilité avec tous les clients OIDC du marché

### 1.2 Périmètre du présent document

Ce cahier des charges couvre **uniquement les packages SDK** distribués sur npm. La plateforme `identite.ga` fait l'objet du document `cahier-des-charges-platform.md`.

### 1.3 Stratégie d'intégration — deux chemins

```
┌─────────────────────────────────────────────────────────────┐
│                  Apps consommatrices                        │
└─────────────────────────────────────────────────────────────┘
              │                                  │
   Chemin A : app utilise            Chemin B : app utilise
   Better Auth ou NextAuth           son propre code OIDC
              │                                  │
              ▼                                  ▼
   ┌─────────────────────┐           ┌─────────────────────────┐
   │ @idn-ga/better-auth    │           │ @idn-ga/react (hooks/UI)   │
   │ @idn-ga/next-auth      │           │       │                 │
   │       │             │           │       ▼                 │
   │       └─── helper ──┼───────────┤  @idn-ga/core (vanilla JS) │
   │                     │           │                         │
   └──────────┬──────────┘           └────────────┬────────────┘
              │                                   │
              └─────────── OIDC standard ─────────┘
                              ▼
                     ┌─────────────────┐
                     │  identite.ga    │
                     │  (OIDC issuer)  │
                     └─────────────────┘
```

---

## 2. Périmètre et packages

| Package | Rôle | Dépendances clés |
| :--- | :--- | :--- |
| **`@idn-ga/core`** | Client OIDC vanilla, framework-agnostic | aucune (zéro dépendance lourde) |
| **`@idn-ga/react`** | Hooks React + composants pré-stylés | `@idn-ga/core`, react ≥ 18 |
| **`@idn-ga/better-auth`** | Helper `genericOAuth` pour Better Auth | `better-auth` (peer) |
| **`@idn-ga/next-auth`** | Provider NextAuth.js | `next-auth` (peer) |

**Tous les packages** :

- Écrits en **TypeScript**, build avec **tsup**
- Exports dual ESM + CJS
- Types `.d.ts` complets
- Licence **MIT**
- Distribués sous le scope **`@idn`** sur npm public

---

## 3. `@idn-ga/core` — Client OIDC vanilla

### 3.1 Objectif

Client OIDC pur JavaScript, utilisable dans tout environnement (browser, Node, Bun, Deno, React Native via shim). C'est la fondation de tout le reste.

### 3.2 API publique

```typescript
import { createIDNClient } from "@idn-ga/core";

const idn = createIDNClient({
  // Obligatoires
  clientId: "your-client-id",
  redirectUri: "https://yourapp.com/auth/callback",

  // Optionnels
  issuer: "https://identite.ga",                 // défaut
  scopes: ["openid", "profile", "email"],         // défaut
  acrValues: ["eidas2"],                          // niveau LoA exigé
  storage: "localStorage",                        // ou "sessionStorage" | "memory" | custom
  pkce: true,                                     // défaut, ne pas désactiver
  refreshThreshold: 60,                           // refresh si exp < N secondes
});
```

### 3.3 Méthodes

| Méthode | Description |
| :--- | :--- |
| `idn.signIn(opts?)` | Démarre le flow OIDC, redirige vers IDN |
| `idn.handleCallback()` | Traite le retour, échange le code contre les tokens |
| `idn.signOut(opts?)` | Clear local + back-channel logout |
| `idn.getSession()` | Session courante (user + tokens) ou null |
| `idn.getUser()` | Profil utilisateur depuis `/userinfo` |
| `idn.getAccessToken()` | Access token, refresh auto si expirant |
| `idn.refreshToken()` | Force un refresh |
| `idn.isAuthenticated()` | Booléen synchrone |
| `idn.on(event, cb)` | Écoute d'événements |
| `idn.off(event, cb)` | Désinscription |

### 3.4 Événements

| Event | Émis lors de |
| :--- | :--- |
| `signIn` | Authentification réussie |
| `signOut` | Déconnexion |
| `session:expired` | Session expirée et non rafraîchie |
| `token:refreshed` | Refresh réussi |
| `error` | Erreur OIDC |

### 3.5 Implémentation OIDC

- **Authorization Code Flow + PKCE obligatoire** (S256)
- `state` aléatoire 32 bytes URL-safe vérifié au callback
- `nonce` aléatoire vérifié dans l'ID token
- Lecture de la **discovery** au premier appel, mise en cache 1h
- Vérification de l'**ID token** : signature via JWKS, claims (`iss`, `aud`, `exp`, `iat`, `nonce`)
- Refresh token rotation gérée
- Stockage tokens : par défaut `localStorage`, alternatives `sessionStorage`, `memory`, ou custom storage adapter

### 3.6 Type safety

L'objet `User` est typé avec les claims standards IDN :

```typescript
interface IDNUser {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  birthdate?: string;
  gender?: "male" | "female" | "other";
  nationality?: string;
  profile_type?: "citizen" | "resident" | "visitor" | "developer";
  acr?: "eidas1" | "eidas2" | "eidas3";
  loa?: 1 | 2 | 3;
  picture?: string;
  updated_at?: number;
}
```

### 3.7 Bundle size cible

- ESM minifié + gzip : **≤ 12 KB**
- Zéro dépendance runtime hors WebCrypto (browser natif)

---

## 4. `@idn-ga/react` — Hooks et composants

### 4.1 Objectif

Couche React **headless-first** : hooks pour construire son propre UI, plus quelques composants pré-stylés (style Gabon) optionnels et 100 % overridables.

### 4.2 Provider racine

```tsx
import { IDNProvider } from "@idn-ga/react";

<IDNProvider
  clientId="your-client-id"
  redirectUri="https://yourapp.com/auth/callback"
  scopes={["openid", "profile", "email"]}
  acrValues={["eidas2"]}
>
  <App />
</IDNProvider>
```

### 4.3 Hooks (headless)

| Hook | Retour |
| :--- | :--- |
| `useIDN()` | `{ isAuthenticated, isLoading, signIn, signOut, error }` |
| `useUser()` | `{ user, isLoading, error }` — claims du profil |
| `useSession()` | `{ session, accessToken, isLoading }` |
| `useAccessToken()` | Access token actuel, auto-refresh |
| `useLoA()` | `{ loa, hasMinimum(level) }` — utilitaire de niveau |

### 4.4 Composants pré-stylés (optionnels)

Tous overridables via `className`, `style`, et slots `render*`.

| Composant | Description |
| :--- | :--- |
| `<IDNSignInButton>` | Bouton « Se connecter avec IDN » |
| `<IDNUserButton>` | Avatar + dropdown (profil, déconnexion, lien vers identite.ga) |
| `<IDNUserProfile>` | Affichage profil (nom, badge LoA, email) |
| `<IDNCallback>` | Composant à monter sur la page callback, gère le retour OIDC |
| `<SignedIn>` | Render conditionnel — visible si authentifié |
| `<SignedOut>` | Render conditionnel — visible si non authentifié |
| `<RequireLoA>` | Render conditionnel — exige un niveau minimum |
| `<IDNLoading>` | Skeleton pendant le chargement initial |

### 4.5 Composants : style et tokens

- Les composants pré-stylés utilisent les **design tokens IDN** (couleurs Gabon, IBM Plex Sans)
- Mode clair / sombre détecté automatiquement (`prefers-color-scheme`) ou forcé par prop `theme="light" | "dark"`
- Aucune dépendance à Tailwind ou autre — CSS-in-JS minimal ou CSS modules
- Build CSS exposé en fichier séparé pour les apps qui veulent le charger sans surcharge JS

### 4.6 SSR et frameworks

- Compatible **Next.js 14+** (App Router et Pages Router)
- Compatible **Remix**, **TanStack Start**, **Vite SSR**
- Hooks side-effect-safe : pas d'accès à `window` au render serveur
- Composant `<IDNCallback>` server-side ready

### 4.7 Bundle size cible

- ESM minifié + gzip : **≤ 25 KB** (hors `@idn-ga/core`)
- CSS extrait : ≤ 8 KB

---

## 5. `@idn-ga/better-auth` — Helper genericOAuth

### 5.1 Objectif

S'utilise **exactement comme** les helpers officiels Better Auth (`auth0()`, `keycloak()`, `okta()`).

### 5.2 API

```typescript
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { idn } from "@idn-ga/better-auth";

export const auth = betterAuth({
  plugins: [
    genericOAuth({
      config: [
        idn({
          clientId: process.env.IDN_CLIENT_ID!,
          clientSecret: process.env.IDN_CLIENT_SECRET!,

          // Optionnel — par défaut https://identite.ga
          issuer: "https://identite.ga",

          // Optionnel — niveau LoA minimum exigé
          acrValues: ["eidas2"],

          // Optionnel — scopes additionnels au-delà de openid/profile/email
          scopes: ["openid", "profile", "email", "idn:civil_status"],
        }),
      ],
    }),
  ],
});
```

Côté client :

```typescript
await authClient.signIn.oauth2({ providerId: "idn" });
```

### 5.3 Implémentation

Le helper retourne une configuration `genericOAuth` pré-remplie :

- `discoveryUrl` : `${issuer}/.well-known/openid-configuration`
- `pkce: true`
- `scopes` : `["openid", "profile", "email"]` par défaut (extensible)
- `mapProfileToUser` : transforme les claims IDN en utilisateur Better Auth
- `acrValues` propagé en query param `acr_values`

### 5.4 Mapping profil

```typescript
mapProfileToUser: (profile: IDNUser) => ({
  email: profile.email,
  emailVerified: profile.email_verified,
  name: profile.name ?? `${profile.given_name} ${profile.family_name}`,
  image: profile.picture,
  // Custom fields persistés dans Better Auth user
  idnSub: profile.sub,
  idnLoA: profile.loa,
  idnProfileType: profile.profile_type,
  idnNationality: profile.nationality,
})
```

### 5.5 Compatibilité

- Better Auth ≥ **1.4.0** (peer dep)
- Plugin `genericOAuth` requis côté Better Auth

---

## 6. `@idn-ga/next-auth` — Provider NextAuth

### 6.1 Objectif

Helper équivalent pour les apps **NextAuth.js** v5+.

```typescript
import NextAuth from "next-auth";
import { IDN } from "@idn-ga/next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    IDN({
      clientId: process.env.IDN_CLIENT_ID!,
      clientSecret: process.env.IDN_CLIENT_SECRET!,
      acrValues: ["eidas2"],
    }),
  ],
});
```

### 6.2 Implémentation

Provider OIDC NextAuth standard, pré-configuré pour `identite.ga`. Discovery URL pointée, claims mappés sur la session NextAuth.

### 6.3 Compatibilité

- **NextAuth.js v5+** (Auth.js)

---

## 7. Documentation et exemples

### 7.1 Site de documentation

Servi par `apps/docs` (Next.js, port 3001) :

- **Quick start** par stack (Better Auth, NextAuth, vanilla React, vanilla JS)
- **API reference** auto-générée depuis les types TypeScript
- **Guides** :
  - Authentification basique
  - Demander un niveau LoA spécifique
  - Gérer la déconnexion fédérée
  - Personnaliser les composants
  - SSR avec Next.js
  - Migration depuis Clerk / Auth0 / Keycloak vers IDN
  - Tester en local avec un IDN sandbox
- **Playground** interactif (sandbox IDN dédié)

### 7.2 Exemples (`examples/`)

Au moins quatre apps minimales déployables :

| Exemple | Stack |
| :--- | :--- |
| `examples/next-better-auth` | Next.js 16 + Better Auth + `@idn-ga/better-auth` |
| `examples/next-nextauth` | Next.js 16 + NextAuth v5 + `@idn-ga/next-auth` |
| `examples/react-vite` | Vite SPA + `@idn-ga/react` |
| `examples/vanilla-js` | HTML statique + `@idn-ga/core` |

Chacun déployable sur Vercel/Netlify avec un README pas-à-pas.

### 7.3 Migration guides

Documents dédiés pour migrer depuis :

- **Clerk** vers IDN (cas concret de `consulat.ga`)
- **Auth0** vers IDN
- **Keycloak** standalone vers IDN
- **Better Auth** (auth locale) vers IDN délégué

---

## 8. Sécurité

### 8.1 Implémentation OIDC

- **PKCE S256 obligatoire**, pas d'option pour le désactiver
- **State** vérifié strictement au callback (rejet si manquant ou non-matching)
- **Nonce** vérifié dans l'ID token
- **`redirect_uri`** doit matcher exactement celui enregistré
- Vérification stricte de la **signature ID token** via JWKS (algos autorisés : `RS256`, `ES256`)
- Vérification des claims `iss`, `aud`, `exp`, `iat`, `nbf`
- Refus des tokens HS256 (la plateforme IDN n'en émet pas)

### 8.2 Stockage des tokens

- **Browser** : `localStorage` par défaut, `sessionStorage` recommandé pour les apps sensibles
- **Server (Node)** : memory ou storage adapter custom (cookie httpOnly + signed conseillé en SSR)
- Adapter `cookie` fourni pour Next.js avec cookies `httpOnly`, `secure`, `sameSite=lax`

### 8.3 Refresh token

- Rotation gérée automatiquement
- Détection de réutilisation côté SDK : si un refresh token est rejeté, le SDK déclenche `session:expired` et nettoie le storage
- Pas de stockage du refresh token côté client public sans cookie httpOnly

### 8.4 Logout

- **Front-channel logout** par redirection vers `${issuer}/oauth2/sessions/logout`
- **Back-channel logout** géré via webhook côté serveur (apps Better Auth/NextAuth)
- Local cleanup garanti même en cas d'échec réseau

### 8.5 Protection contre les fuites de secret

- `clientSecret` n'apparaît jamais côté client (réservé aux helpers serveur Better Auth/NextAuth)
- `@idn-ga/core` et `@idn-ga/react` ne demandent **jamais** de `clientSecret` (apps publiques, PKCE seulement)

### 8.6 Audit de sécurité

- Audit externe avant la version 1.0
- Programme de bug bounty / divulgation responsable
- CI : `npm audit`, `bun audit`, dependabot, scan SAST (CodeQL ou Semgrep)

---

## 9. Tests et qualité

### 9.1 Couverture

- **Unitaires** : ≥ 90 % pour `@idn-ga/core` (logique OIDC critique)
- **Intégration** : tests end-to-end sur un sandbox IDN, par stack (Better Auth, NextAuth, vanilla)
- **Visuels** : Playwright + screenshots pour les composants pré-stylés
- **Conformité OIDC** : tests vs OpenID Connect Conformance Suite

### 9.2 CI

- GitHub Actions
- Matrice Node 18 / 20 / 22, Bun latest
- Build, lint, typecheck, test, audit sur chaque PR
- Pas de release sans CI verte

### 9.3 Linting et style

- ESLint + Prettier partagés via `@repo/eslint-config`
- TypeScript `strict: true`
- Pas de `any` non justifié

---

## 10. Distribution

### 10.1 Registres

- **npm public** sous le scope `@idn`
- Mirror **JSR** (Deno-friendly) pour `@idn-ga/core`
- CDN : esm.sh, jsdelivr, unpkg auto-disponibles

### 10.2 Build

- **tsup** pour bundling
- Sortie : `dist/index.js` (CJS), `dist/index.mjs` (ESM), `dist/index.d.ts`
- Source maps publiées
- `package.json` `exports` map propre
- `sideEffects: false` pour tree-shaking
- Tag `provenance` activé pour npm provenance attestation

### 10.3 Tailles

| Package | Bundle gzip cible |
| :--- | :--- |
| `@idn-ga/core` | ≤ 12 KB |
| `@idn-ga/react` | ≤ 25 KB (hors core) |
| `@idn-ga/better-auth` | ≤ 5 KB |
| `@idn-ga/next-auth` | ≤ 5 KB |

CI échoue si la taille dépasse de plus de 10 % (size-limit).

---

## 11. Versioning et compatibilité

### 11.1 SemVer

Tous les packages suivent **Semantic Versioning** strict :

- **Major** : breaking changes API publique
- **Minor** : nouvelles fonctionnalités rétrocompatibles
- **Patch** : corrections, sécurité

### 11.2 Synchronisation des versions

Les quatre packages partagent la **même version majeure et mineure** (publication groupée via Changesets).

### 11.3 Politique de support

- Version majeure courante : **maintenue 18 mois** après la sortie de la suivante
- Vulnérabilités critiques : patch sur les **deux** dernières majeures

### 11.4 Compatibilité IDN

Le SDK reste compatible avec la plateforme IDN tant que celle-ci respecte le contrat **OpenID Connect 1.0**. Les claims custom (`loa`, `profile_type`) sont optionnels côté SDK : leur absence ne casse pas l'authentification de base.

---

## 12. Phases de livraison

| Phase | Périmètre | Priorité |
| :--- | :--- | :--- |
| **1** | `@idn-ga/core` + `@idn-ga/react` (hooks uniquement) — version `0.x` interne | 🔴 MVP |
| **2** | `@idn-ga/better-auth` — pour intégration `consulat.ga` | 🔴 MVP |
| **3** | Composants pré-stylés `@idn-ga/react` (boutons, dropdown, etc.) | 🟠 Post-MVP |
| **4** | `@idn-ga/next-auth` | 🟠 Post-MVP |
| **5** | Site de docs `apps/docs` complet + 4 exemples runnables | 🟠 Post-MVP |
| **6** | Audit de sécurité externe + version `1.0.0` publique | 🟢 Évolution |
| **7** | Outils annexes : CLI `idn-cli` (gestion d'apps OAuth en local), playground, migration tools | 🟢 Évolution |

---

## 13. Critères d'acceptation

### 13.1 Fonctionnel

- [ ] Une app Better Auth + Convex peut intégrer IDN en moins de 10 lignes de code via `@idn-ga/better-auth`
- [ ] Une app NextAuth peut intégrer IDN via `@idn-ga/next-auth`
- [ ] Une app React standalone peut intégrer IDN via `<IDNProvider>` + hooks
- [ ] Une app vanilla JS peut intégrer IDN via `@idn-ga/core`
- [ ] Une app peut exiger un niveau LoA via `acrValues` et le hook `useLoA()` reflète le niveau atteint
- [ ] La déconnexion locale + back-channel fonctionne sur Better Auth et NextAuth
- [ ] Les composants `<SignedIn>`, `<SignedOut>`, `<RequireLoA>` rendent correctement
- [ ] Le `consulat.ga` de production fonctionne avec IDN au lieu de Clerk

### 13.2 Non-fonctionnel

- [ ] Tailles de bundle respectées
- [ ] Tests OIDC Conformance Suite passent
- [ ] Documentation publiée et déployée sur `docs.identite.ga`
- [ ] 4 exemples déployés et fonctionnels
- [ ] Couverture tests ≥ 90 % sur `@idn-ga/core`
- [ ] Audit de sécurité externe sans findings critiques ouverts
- [ ] Compatible Node 18, 20, 22 et Bun latest

### 13.3 Documentation

- [ ] Quick start ≤ 5 minutes pour chaque stack
- [ ] API reference complète et à jour
- [ ] Guide de migration depuis Clerk publié
- [ ] FAQ et troubleshooting documentés

---

## Annexes

### A. Références

- Cahier des charges plateforme : `ressources/cahier-des-charges-platform.md`
- OpenID Connect Core 1.0 : https://openid.net/specs/openid-connect-core-1_0.html
- OAuth 2.1 (draft) : https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/
- Better Auth : https://www.better-auth.com
- NextAuth.js : https://authjs.dev
- OIDC Conformance Suite : https://openid.net/certification/

### B. Inspirations API

- Clerk SDK (DX, composants conditionnels)
- Better Auth (helpers OAuth, modularité)
- Auth.js (provider pattern)
- `oidc-client-ts` (client OIDC vanilla mature)

### C. Décisions ouvertes

- Faut-il un package `@idn-ga/express` pour Express/Hono côté serveur ? — à arbitrer après MVP
- Faut-il un package mobile `@idn-ga/react-native` ? — Phase 6 (app native plateforme)
- Verifiable Credentials W3C (présentation hors-ligne) côté SDK — Phase 6
