# IDN — Stack technique

> **Document technique : outils, technologies et services**
> Version 1.2 — 10 mai 2026

Ce document décrit l'ensemble de la stack technique utilisée pour faire fonctionner la plateforme **Identité Numérique du Gabon** : applications, authentification, vérification d'identité, cryptographie, stockage, observabilité, déploiement.

Il est structuré en **trois phases** :

- **Phase 1 — MVP itératif** : stack moderne sur services managés pour livrer vite (Convex Cloud + Better Auth + Resend + Smile ID)
- **Phase 2 — Souveraineté pragmatique** : **Convex self-hosted** (Docker, backend PostgreSQL) sur infra gabonaise + Better Auth + KYC interne. Migration légère, frontend et schéma de données inchangés
- **Phase 3 — Souveraineté maximale** _(optionnelle, pilotée par la traction et la charge)_ : remplacement de Better Auth par **Ory Kratos + Ory Hydra**, PostgreSQL natif HA, observabilité complète. Justifiée si Convex single-node ne tient plus la charge

> [!IMPORTANT]
> Toute la conception est faite pour que le **frontend Next.js et le SDK ne changent jamais** entre les phases. Les migrations Phase 1 → 2 → 3 sont des changements d'hébergement et de moteur, pas de réécriture applicative.

> [!NOTE]
> **Convex est self-hostable** depuis fin 2024 (Apache 2.0, image Docker officielle, backend PostgreSQL supporté). Cela rend la **Phase 2** beaucoup plus économique qu'une migration vers Ory : on garde Better Auth, le schéma, les queries/mutations, le storage. La Phase 3 reste en réserve si la limite single-node de Convex self-hosted devient bloquante.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Monorepo et outillage de build](#2-monorepo-et-outillage-de-build)
3. [Frontend et système de design](#3-frontend-et-système-de-design)
4. [Authentification — Phase 1](#4-authentification--phase-1)
5. [Backend de données — Phase 1](#5-backend-de-données--phase-1)
6. [Communications (email, SMS)](#6-communications-email-sms)
7. [Vérification d'identité (KYC)](#7-vérification-didentité-kyc)
8. [Cryptographie et gestion des secrets](#8-cryptographie-et-gestion-des-secrets)
9. [Stockage de fichiers](#9-stockage-de-fichiers)
10. [Observabilité, logs et audit](#10-observabilité-logs-et-audit)
11. [Sécurité opérationnelle](#11-sécurité-opérationnelle)
12. [CI/CD et déploiement](#12-cicd-et-déploiement)
13. [Phases souveraines (Phase 2 et Phase 3)](#13-phases-souveraines)
14. [Décisions techniques structurantes](#14-décisions-techniques-structurantes)
15. [Tableau récapitulatif](#15-tableau-récapitulatif)

---

## 1. Vue d'ensemble

### 1.1 Architecture Phase 1 (MVP)

```
                            ┌──────────────────────────────────────────┐
                            │   Apps tierces (consulat.ga, e-visa…)    │
                            │   ▷ @idn-ga/better-auth                     │
                            │   ▷ @idn-ga/next-auth                       │
                            │   ▷ @idn-ga/react / @idn-ga/core               │
                            └───────────────┬──────────────────────────┘
                                            │ OIDC RS256 + PKCE
                                            ▼
            ┌───────────────────────────────────────────────────────────┐
            │  apps/auth — Next.js 16  (connexion.identite.ga)               │
            │  ┌─────────────────────────────────────────────────────┐  │
            │  │  Better Auth                                        │  │
            │  │  • emailAndPassword  • emailOtp  • twoFactor        │  │
            │  │  • oidcProvider (RS256, JWKS)  • admin              │  │
            │  └─────────────────────────────────────────────────────┘  │
            │  Pages : connexion / inscription / OTP / pivot / PIN /    │
            │  KYC / consentement OAuth                                 │
            └─────────────────────┬─────────────────────────────────────┘
                                  │
                                  │ Cookie .identite.ga (session SSO)
                                  │
            ┌─────────────────────▼─────────────────────────────────────┐
            │  apps/web — Next.js 16  (identite.ga)                          │
            │  ▷ Site public  ▷ Mon compte  ▷ Console admin             │
            │  ▷ Espace contrôleur  ▷ Portail développeur               │
            └───────────────┬───────────────────────────────────────────┘
                            │
                            ▼
            ┌──────────────────────────────────────────┐  ┌──────────┐
            │  Convex                                  │  │ Resend   │
            │  Schema · Queries · Mutations · Actions  │  │ (email)  │
            │  Storage (fichiers chiffrés)             │  └──────────┘
            │  Adapter Better Auth                     │
            └──────────────────────────────────────────┘
                            │
                            ▼
            ┌──────────────────────────────────────────┐
            │  Service KYC (Convex action / Hono)      │
            │  • OCR document (PaddleOCR via API)      │
            │  • Liveness + face match (Smile ID)      │
            │  • Signature des attestations           │
            └──────────────────────────────────────────┘
```

### 1.2 Objectifs de la Phase 1

- Itérer rapidement sur l'expérience produit (UI, parcours, KYC L2)
- Valider la traction (intégrations consulat.ga, e-visa, etc.)
- Mettre en place les **fondamentaux de sécurité non négociables** dès le MVP : RS256, JWKS, PKCE, audit log, rate limiting
- Garder une **architecture migrable** vers la cible souveraine sans réécriture massive

---

## 2. Monorepo et outillage de build

### 2.1 Gestionnaire de paquets et runtime

| Outil           | Rôle                                | Justification                                            |
| :-------------- | :---------------------------------- | :------------------------------------------------------- |
| **Bun 1.3+**    | Package manager + runtime + bundler | Vitesse > pnpm/npm, compatible Node, intégré au monorepo |
| **Node 22 LTS** | Runtime serveur de référence        | Cible CI et compat des packages SDK                      |

### 2.2 Monorepo

| Outil              | Rôle                                                                         |
| :----------------- | :--------------------------------------------------------------------------- |
| **Turborepo 2.x**  | Orchestration des tâches (build, lint, test, typecheck) avec cache distribué |
| **Workspaces Bun** | Liaison locale `@repo/*` et `@idn-ga/*`                                         |

Structure :

```
identite.ga/
├── apps/
│   ├── web/         Next.js — identite.ga
│   ├── auth/        Next.js — connexion.identite.ga
│   └── docs/        Next.js — documentation SDK
├── packages/
│   ├── ui/          Composants partagés
│   ├── eslint-config/
│   └── typescript-config/
└── ressources/      Spécifications, maquettes, ce document
```

### 2.3 Qualité de code

| Outil                      | Rôle                                                 |
| :------------------------- | :--------------------------------------------------- |
| **TypeScript 5.9+**        | Typage strict (`strict: true`) sur tous les packages |
| **ESLint 9** (flat config) | Linting via `@repo/eslint-config`                    |
| **Prettier 3**             | Formatage cohérent                                   |
| **Knip** _(optionnel)_     | Détection de code mort                               |

---

## 3. Frontend et système de design

### 3.1 Framework

| Outil                       | Rôle                                                     |
| :-------------------------- | :------------------------------------------------------- |
| **Next.js 16** (App Router) | SSR/SSG, routing, middleware sécurité, server components |
| **React 19**                | UI                                                       |
| **TypeScript**              | Typage de tous les composants                            |

### 3.2 Styling

| Outil               | Rôle                  | Justification                                                                  |
| :------------------ | :-------------------- | :----------------------------------------------------------------------------- |
| **Tailwind CSS v4** | Styling utility-first | Performance, cohérence avec design tokens, build CSS-natif                     |
| **CSS Variables**   | Thème clair/sombre    | Switch dynamique sans rerender JS                                              |
| **`packages/ui`**   | Composants partagés   | Boutons, inputs, cartes, badges (`LoABadge`), etc. dérivés de `idn-tokens.jsx` |

### 3.3 Polices et typographie

| Police            | Usage                                                | Source                                                                     |
| :---------------- | :--------------------------------------------------- | :------------------------------------------------------------------------- |
| **IBM Plex Sans** | Texte UI                                             | Auto-hébergée (subsetted, woff2) — pas de Google Fonts CDN sur `apps/auth` |
| **IBM Plex Mono** | Identifiants techniques (client_id, secrets, claims) | Auto-hébergée                                                              |

### 3.4 Composants et primitives

- Pas de bibliothèque tierce de composants (ni Radix, ni shadcn) côté `apps/auth` pour minimiser la surface d'attaque
- Sur `apps/web`, **Radix UI Primitives** autorisés pour l'accessibilité (dropdowns, dialogs, tooltips) — composants headless audités
- Animations : **Motion** (anciennement Framer Motion) avec `prefers-reduced-motion` respecté

### 3.5 Accessibilité

| Outil                      | Rôle                                      |
| :------------------------- | :---------------------------------------- |
| **eslint-plugin-jsx-a11y** | Détection statique des problèmes a11y     |
| **axe-core** (en CI)       | Tests automatisés sur les pages critiques |
| **Playwright + axe**       | Tests e2e d'accessibilité                 |

Conformité visée : **WCAG 2.1 AA / RGAA 4.1.2**.

### 3.6 Internationalisation

| Outil                           | Rôle                                |
| :------------------------------ | :---------------------------------- |
| **next-intl**                   | i18n native pour Next.js App Router |
| Catalogues `fr.json`, `en.json` | Strings externalisées               |

---

## 4. Authentification — Phase 1

### 4.1 Cœur d'authentification

**Better Auth 1.4+** est le moteur d'authentification central, hébergé dans `apps/auth`.

### 4.2 Plugins Better Auth activés

| Plugin                                | Rôle                                                                                             |
| :------------------------------------ | :----------------------------------------------------------------------------------------------- |
| **`emailAndPassword`**                | Login/signup email + mot de passe (scrypt)                                                       |
| **`emailOtp`**                        | OTP 6 chiffres pour vérification email, reset password, changement d'email                       |
| **`twoFactor`**                       | TOTP (Google Authenticator) — obligatoire pour `admin` et `identity_controller`, optionnel sinon |
| **`oidcProvider`**                    | Serveur OIDC : endpoints `/authorize`, `/token`, `/userinfo`, écran de consentement              |
| **`jwt`**                             | Émission ID tokens **RS256** + JWKS public + rotation de clés                                    |
| **`admin`**                           | Rôles, permissions, gestion administrative                                                       |
| **`organization`** _(optionnel)_      | Si on veut grouper les développeurs en équipes                                                   |
| **`bearer`**                          | Auth API par bearer token (portail dev)                                                          |
| **`crossDomain`** _(côté `apps/web`)_ | Lecture de session cross-subdomain (`Domain=.identite.ga`)                                       |

### 4.3 Adapter de persistance

| Adapter                       | Rôle                                                                                                                                                                   |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`@convex-dev/better-auth`** | **Composant officiel maintenu par Convex.** Stocke users, sessions, OAuth apps, consents dans Convex via le pattern de composant local (cf. doc Better Auth × Convex). |

#### Setup en composant local (recommandé par Better Auth)

Plutôt qu'une simple installation npm, Better Auth × Convex utilise le pattern de **composant local** pour exposer pleinement l'API Better Auth via Convex :

```
convex/
├── betterAuth/
│   └── convex.config.ts    ← définit le composant local
├── convex.config.ts        ← enregistre betterAuth + resend
├── auth.ts                 ← createAuth(ctx) avec plugins
├── auth.config.ts          ← provider OIDC pour Convex
└── http.ts                 ← monte les routes auth sur le HTTP router
```

Les variables d'environnement sensibles (`BETTER_AUTH_SECRET`, OAuth credentials, JWKS) sont stockées dans Convex (CLI / dashboard), **pas dans `.env.local`**.

Côté Next.js (`apps/auth`), un proxy `app/api/auth/[...all]/route.ts` route vers le HTTP router Convex.

### 4.4 Côté frontend Better Auth

```typescript
// apps/web/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "https://connexion.identite.ga",
  plugins: [
    crossDomainClient({ cookieDomain: ".identite.ga" }),
    twoFactorClient(),
  ],
});
```

### 4.5 Configuration sécurité

```typescript
// apps/auth/lib/auth.ts (extrait)
betterAuth({
  appName: "IDN",
  trustedOrigins: ["https://identite.ga", "https://connexion.identite.ga"],
  database: convexAdapter(),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 12,
    passwordValidator: zxcvbnMinScore(3),
    breachedPasswordCheck: true, // HIBP k-anonymity
  },

  rateLimit: {
    window: 60,
    max: 10,
    storage: "convex",
  },

  plugins: [
    emailOtp({ otpLength: 6, expiresIn: 15 * 60, sendVerificationOTP }),
    twoFactor({ issuer: "IDN" }),
    oidcProvider({
      loginPage: "/connexion",
      consentPage: "/consentement",
      useJWTPlugin: true, // RS256 obligatoire
      requirePKCE: true,
    }),
    jwt({ jwks: { alg: "RS256" } }),
    admin({ roles: ["admin", "identity_controller", "developer"] }),
    crossDomain({
      siteUrl: "https://identite.ga",
      cookieDomain: ".identite.ga",
    }),
  ],
});
```

---

## 5. Backend de données — Phase 1

### 5.1 Convex

**Convex** est le backend de données principal en Phase 1 :

- Schema typé en TypeScript (`convex/schema.ts`)
- Queries réactives, mutations transactionnelles, actions (effets externes)
- Indexes et search built-in
- Storage pour fichiers (photos profil, KYC documents) avec URLs signées
- Crons pour tâches planifiées (purge des sessions expirées, rotation des clés)
- Component `betterAuth` officiel pour la persistance d'auth

### 5.2 Modèles principaux gérés par Convex

| Domaine       | Tables / collections                                                              |
| :------------ | :-------------------------------------------------------------------------------- |
| Identité      | `user`, `account`, `session` (gérés par Better Auth component)                    |
| Profil étendu | `userProfile` (loa, profileType, pivot étendu, pinHash)                           |
| OIDC          | `oauthApplication`, `oauthAccessToken`, `oauthConsent`, `oidcToken` (Better Auth) |
| KYC           | `kycRequest`, `kycDocument`, `kycReview`                                          |
| RBAC          | `role` (Better Auth admin plugin)                                                 |
| Audit         | `auditLog`                                                                        |
| Notifications | `notification`, `notificationPreference`                                          |
| Paramètres    | `userPreference`                                                                  |

### 5.3 Composants Convex utilisés

L'écosystème de **composants Convex officiels** couvre la plupart des besoins infrastructure d'un IdP. On en utilise quatre :

| Composant                      | Usage IDN                                                                            |
| :----------------------------- | :----------------------------------------------------------------------------------- |
| **`@convex-dev/better-auth`**  | Persistance Better Auth (users, sessions, OAuth apps, consents, OIDC tokens)         |
| **`@convex-dev/resend`**       | Envoi d'emails fiable (file durable, idempotency, batching, webhooks) — cf. §6       |
| **`@convex-dev/rate-limiter`** | Rate limiting applicatif transactionnel sur tous les endpoints sensibles — cf. §11.1 |
| **`@convex-dev/aggregate`**    | Agrégations efficaces (count/sum/max) en O(log N) pour le dashboard admin — cf. §5.6 |
| **`@convex-dev/workflow`**     | Durable execution pour le pipeline KYC — cf. §7.5                                    |

Tous ces composants sont **officiellement maintenus par Convex**, transactionnels avec le reste de la base, et survivent à la migration self-hosted (Phase 2).

### 5.4 Pourquoi Convex en Phase 1

- **Vitesse de développement** : schema + queries + sync temps réel en quelques minutes
- **Réactivité** : les listes de consentements, sessions actives, file KYC se mettent à jour live
- **Storage natif chiffré** pour documents KYC
- **Composabilité avec Better Auth** via le composant officiel
- **Écosystème de composants** qui couvre rate-limiting, queues d'email, agrégations, workflows — sans assembler 5 services tiers
- **TypeScript end-to-end** : pas de désynchronisation backend/frontend

### 5.5 Convex en Phase 2 — self-hosted sur infra gabonaise

**Bonne nouvelle** : Convex est distribué en **OSS (Apache 2.0)** depuis fin 2024, avec image Docker officielle et **backend PostgreSQL supporté** en alternative à SQLite. Cela permet une migration souveraine **sans réécriture du backend** :

| Aspect                              | Phase 1 (Cloud)       | Phase 2 (self-hosted)                              |
| :---------------------------------- | :-------------------- | :------------------------------------------------- |
| Hébergement                         | Convex Cloud (AWS US) | Conteneur Docker sur infra Gabon                   |
| Backend de stockage                 | SQLite-like Convex    | **PostgreSQL** managé par nous                     |
| Schema, queries, mutations, actions | inchangés             | inchangés                                          |
| Better Auth + adapter               | inchangé              | inchangé                                           |
| Storage de fichiers                 | Convex Storage        | Convex Storage (sur volume local ou S3-compatible) |
| Dashboard d'admin                   | dashboard.convex.dev  | dashboard self-hosted                              |
| Crons, search, indexes              | OK                    | OK                                                 |

**Limites assumées du Convex self-hosted :**

- **Single-node uniquement** — le scaling horizontal nécessiterait de forker le code Rust. Pour un IdP national, c'est viable jusqu'à plusieurs centaines de milliers d'utilisateurs actifs avec une machine correctement dimensionnée (32-64 GB RAM, NVMe), mais pas au-delà.
- **Pas de support officiel** côté self-hosted (community + GitHub issues uniquement)
- **Réplication / HA** : à monter nous-mêmes au niveau PostgreSQL (Patroni + etcd) et au niveau du conteneur Convex (active/passive avec basculement)
- **Backups** : pgbackrest sur le PostgreSQL backend, snapshots du volume Convex storage

**Quand basculer vers Phase 3** (Ory + PostgreSQL natif) :

- Si la charge dépasse les capacités d'un nœud Convex unique (> ~500k MAU avec patterns d'usage typiques d'un IdP)
- Si on a besoin de fonctionnalités OIDC avancées que Better Auth ne fournit pas (CIBA, FAPI 2.0, federation)
- Si l'absence de support entreprise devient bloquante pour des audits gouvernementaux

### 5.6 Agrégations pour le dashboard admin

Le dashboard admin (§3.9 du cahier des charges plateforme) affiche des KPIs sur des tables qui peuvent atteindre **plusieurs millions de lignes** (comptes, sessions, événements d'audit). Une agrégation naïve (`.collect().length`) deviendrait inutilisable.

**`@convex-dev/aggregate`** maintient un B-tree indexé qui rend les opérations `count`, `sum`, `min`, `max`, `at`, `paginate`, `random` en **O(log N)** :

```typescript
// Aggregate par niveau LoA pour le dashboard admin
const usersByLoA = new TableAggregate<{
  Key: number;
  DataModel: DataModel;
  TableName: "users";
}>(components.aggregate, { sortKey: (doc) => doc.loa });

// Dans une query du dashboard
export const dashboardStats = query({
  handler: async (ctx) => ({
    total: await usersByLoA.count(ctx),
    niveau1: await usersByLoA.count(ctx, { bounds: { lower: 1, upper: 1 } }),
    niveau2: await usersByLoA.count(ctx, { bounds: { lower: 2, upper: 2 } }),
    niveau3: await usersByLoA.count(ctx, { bounds: { lower: 3, upper: 3 } }),
  }),
});
```

Usages dans IDN :

| Aggregate             | Usage                                                          |
| :-------------------- | :------------------------------------------------------------- |
| `usersByLoA`          | KPI dashboard : répartition des comptes par niveau de garantie |
| `usersByProfile`      | Répartition citoyen/résident/visiteur/dev                      |
| `sessionsByDay`       | Connexions 24h/7j/30j                                          |
| `consentsByApp`       | Top apps OAuth par nombre d'utilisateurs                       |
| `kycRequestsByStatus` | File KYC par statut                                            |
| `auditByCategory`     | Volume d'événements de sécurité par type                       |

L'**inconvénient connu** : il faut maintenir l'aggregate à chaque insert/delete/update. Le pattern utilisé est de wrapper les mutations critiques dans des helpers ou via des **triggers convex-helpers** pour éviter d'oublier la synchronisation.

---

## 6. Communications (email, SMS)

### 6.1 Provider email — Phase 1

| Outil                    | Rôle                                                                         |
| :----------------------- | :--------------------------------------------------------------------------- |
| **Resend**               | Provider email principal MVP — bon DX, prix correct, réputation propre       |
| **`@convex-dev/resend`** | **Composant Convex officiel** qui wrappe Resend dans une couche de fiabilité |

#### Pourquoi le composant Convex Resend plutôt que le SDK Resend direct

Pour un IdP gouvernemental, la fiabilité de l'envoi (OTP, alertes sécurité) est critique. Le composant `@convex-dev/resend` apporte des garanties que le SDK seul n'a pas :

| Capacité                                         | SDK Resend brut | `@convex-dev/resend` |
| :----------------------------------------------- | :-------------- | :------------------- |
| **File d'attente durable** (workpool Convex)     | ❌              | ✅                   |
| **Idempotency keys** — exactly-once              | ❌              | ✅                   |
| **Batching** automatique via `/emails/batch`     | ❌              | ✅                   |
| **Rate limiting** respecté                       | manuel          | ✅                   |
| **Retries** sur erreurs transitoires             | manuel          | ✅                   |
| **Webhooks** delivery/bounce/open/click intégrés | manuel          | ✅                   |
| **Persistance** des événements en base           | ❌              | ✅                   |
| **Test mode** (par défaut)                       | ❌              | ✅                   |

Usage type :

```typescript
// convex/emails.ts
import { Resend } from "@convex-dev/resend";
import { components } from "./_generated/api";

const resend = new Resend(components.resend, {
  testMode: process.env.NODE_ENV !== "production",
});

export async function sendVerificationOTP(ctx, { to, code, locale }) {
  await resend.sendEmail(ctx, {
    from: process.env.RESEND_FROM,
    to,
    subject: locale === "fr" ? "Votre code de vérification" : "Your verification code",
    react: <OtpEmail code={code} locale={locale} />,
  });
}
```

Le composant écoute les webhooks Resend et met à jour la table `emailEvents` ; on peut requêter le statut d'un email directement depuis le frontend.

### 6.2 Abstraction multi-provider

Une couche d'abstraction `EmailProvider` est implémentée par-dessus le composant Convex Resend pour pouvoir basculer vers SendGrid, AWS SES ou un SMTP local en Phase 2/3 sans changer le code applicatif :

```typescript
interface EmailProvider {
  sendVerificationOTP(
    to: string,
    code: string,
    locale: "fr" | "en",
  ): Promise<EmailRef>;
  sendPasswordReset(
    to: string,
    link: string,
    locale: "fr" | "en",
  ): Promise<EmailRef>;
  sendNewDeviceAlert(
    to: string,
    deviceInfo: DeviceInfo,
    locale: "fr" | "en",
  ): Promise<EmailRef>;
  getStatus(ref: EmailRef): Promise<EmailStatus>;
}
```

Implémentations :

- `ResendProvider` (via `@convex-dev/resend`) — Phase 1 et 2
- `SesProvider` (AWS SES) — option Phase 2 si déploiement AWS
- `SmtpProvider` (Nodemailer) — Phase 3 si SMTP local sur infra Gabon

Switch via config console admin (§3.9 du cahier des charges plateforme).

### 6.3 Templates email

- **React Email** pour la composition (composants typés, preview en dev)
- Compilation en HTML + version texte pour chaque template
- Templates : OTP, password reset, nouveau device, KYC approuvé/rejeté, consentement révoqué, alerte connexion suspecte
- Localisés FR/EN dès le MVP

### 6.4 SMS — Phase 2

| Provider             | Note                             |
| :------------------- | :------------------------------- |
| **Twilio**           | Standard mondial, fallback       |
| **Africa's Talking** | Spécialiste Afrique, prix locaux |
| **Vonage (Nexmo)**   | Bon rapport qualité/prix         |

Même abstraction `SmsProvider`, switch via console admin.

---

## 7. Vérification d'identité (KYC)

### 7.1 Niveau 1 — Faible

Aucune vérification documentaire. Email vérifié uniquement.

### 7.2 Niveau 2 — Substantiel (Phase 2 du roadmap produit)

Pipeline de vérification avec **deux options** selon les contraintes de souveraineté :

#### Option A — Service tiers spécialisé Afrique

| Service      | Pays  | Notes                                                                                                                                |
| :----------- | :---- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Smile ID** | Kenya | **Recommandé** : modèles entraînés sur visages africains, couvre 50+ pays africains, prix abordable, API simple, conformité PCI/SOC2 |

API utilisée :

- `submit_job` avec photos document + selfie
- `liveness_check` (anti-spoofing ISO/IEC 30107-3 niveau 2)
- `document_verification` (OCR + détection de faux)
- `biometric_kyc` (face match doc ↔ selfie)
- Webhook → Convex action → mise à jour `kycRequest.status`

#### Option B — Pipeline interne (préparation Phase 2 souveraine)

| Brique                          | Outil                                                                             | Rôle                                                             |
| :------------------------------ | :-------------------------------------------------------------------------------- | :--------------------------------------------------------------- |
| **OCR document**                | **PaddleOCR** (Apache 2.0)                                                        | Extraction texte recto/verso, multilingue (FR + EN)              |
| **MRZ passport**                | **mrz** (Python lib)                                                              | Lecture zone lisible machine ICAO 9303                           |
| **Face detection + embedding**  | **InsightFace** (modèle `buffalo_l`)                                              | Détection visage + embedding pour comparaison                    |
| **Face match**                  | InsightFace cosine similarity                                                     | Score ≥ 0.6 = match                                              |
| **Liveness**                    | **Silent-Face-Anti-Spoofing** (MiniVision)                                        | Anti-spoofing OSS — Phase 2 mais non-certifié iBeta, à évaluer   |
| **Détection de faux documents** | **Regula Document Reader SDK** (on-prem, propriétaire mais déployable localement) | Hologrammes, UV, micro-textes — partie où l'OSS n'est pas mature |

Le pipeline interne est encapsulé dans un **service KYC dédié** (Hono ou Fastify, déployé en conteneur) appelé via Convex action.

### 7.3 Niveau 3 — Élevé (Phase 5)

- KYC vidéo (entretien à distance via LiveKit / WebRTC)
- Revue et décision manuelles par un **Contrôleur d'Identité** habilité
- Croisement avec le **registre national d'état civil** reporté à une phase
  ultérieure (l'intégration gouvernementale reste à spécifier)
- Authentification renforcée obligatoire (passkey ou TOTP)

### 7.4 Recommandation MVP

Commencer en **Option A (Smile ID)** pour livrer le KYC L2 rapidement en Phase 2 produit, et préparer la migration vers l'**Option B (pipeline interne)** dès la Phase 4 (souveraineté). L'API publique du service KYC reste la même, seule l'implémentation change.

### 7.5 Orchestration du pipeline KYC via `@convex-dev/workflow`

Le KYC L2 est un parcours multi-étapes asynchrone qui peut prendre **de quelques secondes à plusieurs heures** (revue manuelle par un Contrôleur d'Identité). C'est exactement le cas d'usage de **`@convex-dev/workflow`** — durable execution, sleep illimité sans consommer de ressources, retry par étape, replay déterministe.

```typescript
// convex/kyc/workflow.ts
import { workflow } from "./setup";

export const kycLevel2 = workflow.define({
  args: {
    userId: v.id("users"),
    documentId: v.id("documents"),
    selfieId: v.id("documents"),
  },
  handler: async (step, { userId, documentId, selfieId }) => {
    // 1. OCR + lecture MRZ (action externe)
    const ocr = await step.runAction(
      internal.kyc.runOcr,
      { documentId },
      { retry: { maxAttempts: 3, initialBackoffMs: 1000 } },
    );

    // 2. Liveness check + face match
    const biometric = await step.runAction(
      internal.kyc.runBiometric,
      { documentId, selfieId },
      { retry: { maxAttempts: 3 } },
    );

    // 3. Décision automatique
    if (
      ocr.confidence > 0.95 &&
      biometric.match > 0.6 &&
      biometric.liveness === "real"
    ) {
      await step.runMutation(internal.kyc.approveAuto, { userId });
      await step.runMutation(internal.kyc.upgradeLoA, { userId, level: 2 });
      await step.runAction(internal.emails.sendKycApproved, { userId });
      return { status: "approved", auto: true };
    }

    // 4. Sinon, mise en file pour revue manuelle (sleep jusqu'à décision)
    await step.runMutation(internal.kyc.enqueueForReview, { userId });
    const decision = await step.awaitEvent(`kyc-decision-${userId}`, {
      timeoutMs: 7 * 24 * 60 * 60 * 1000,
    }); // 7 jours max

    if (decision.approved) {
      await step.runMutation(internal.kyc.upgradeLoA, { userId, level: 2 });
      await step.runAction(internal.emails.sendKycApproved, { userId });
    } else {
      await step.runAction(internal.emails.sendKycRejected, {
        userId,
        reason: decision.reason,
      });
    }
    return { status: decision.approved ? "approved" : "rejected", auto: false };
  },
});
```

**Pourquoi un workflow et pas une chaîne d'actions** :

- **Durabilité** : si le serveur Convex redémarre, le workflow reprend là où il était
- **Sleep illimité gratuit** : la revue manuelle peut durer 5 minutes ou 5 jours, le workflow ne consomme rien pendant l'attente
- **Replay déterministe** : on peut rejouer un workflow pour debugging sans réémettre les effets
- **Retry par étape** avec backoff exponentiel
- **`onComplete` garanti** : nettoyage et notifications guaranties même en cas d'incident

Autres workflows IDN candidats à terme :

- **Onboarding L3** (entretien vidéo planifié, croisement état civil, validation finale)
- **Suppression de compte RGPD** (cooldown de 30 jours, anonymisation par étapes, export de données préalable, journalisation)
- **Rotation périodique des clés RS256** (génération, publication parallèle, drainage des anciennes, suppression)
- **Onboarding développeur** (vérification entité morale, validation admin, provisionnement client_id/secret, email de bienvenue)

---

## 8. Cryptographie et gestion des secrets

### 8.1 Algorithmes

| Usage                             | Algorithme                                                     |
| :-------------------------------- | :------------------------------------------------------------- |
| Signature ID tokens OIDC          | **RS256** (RSA-SHA256, clé 2048 bits minimum, 4096 recommandé) |
| Hash mots de passe                | **scrypt** (Better Auth par défaut) ou **argon2id** (Phase 2)  |
| Hash PIN                          | **PBKDF2-SHA256** avec sel par utilisateur, 600k itérations    |
| Stockage tokens longs             | **AES-256-GCM** au repos                                       |
| Hash sensibles (email pour audit) | **SHA-256** avec sel global                                    |

### 8.2 JWKS (JSON Web Key Set)

- Endpoint public `/jwks.json` servi par `apps/auth`
- Contient toutes les clés publiques actives + en transition (chevauchement)
- Cache HTTP `Cache-Control: max-age=3600`
- **Rotation automatique** : nouvelle clé tous les 90 jours, ancienne maintenue 7 jours
- Géré par le plugin `jwt` de Better Auth en Phase 1

### 8.3 Stockage des secrets

#### Phase 1

| Secret                      | Stockage                    |
| :-------------------------- | :-------------------------- |
| Clé privée RS256            | Convex env vars (chiffrées) |
| Better Auth secret          | Convex env vars             |
| API keys (Resend, Smile ID) | Convex env vars             |
| Cookies signing secret      | Convex env vars             |

#### Phase 2

| Secret           | Stockage                                                 |
| :--------------- | :------------------------------------------------------- |
| Clé privée RS256 | **HSM** (YubiHSM 2 ou Nitrokey HSM) ou **Vault Transit** |
| Tous secrets     | **OpenBao** (fork OSS de HashiCorp Vault)                |
| Rotation         | Cronjob Vault + redéploiement automatique                |

### 8.4 PKI

- Certificats TLS via **Let's Encrypt** en Phase 1 (cert-manager)
- Phase 2 : possibilité d'une **AC souveraine** gabonaise pour les certificats internes

---

## 9. Stockage de fichiers

### 9.1 Phase 1 — Convex Storage

| Type de fichier    | Notes                                                                                                  |
| :----------------- | :----------------------------------------------------------------------------------------------------- |
| Photo de profil    | URL signée, taille max 2 Mo, formats JPEG/PNG/WebP                                                     |
| Documents KYC      | **Chiffrés au repos**, accès restreint (utilisateur + contrôleurs assignés), URL signée éphémère 5 min |
| Attestations PDF   | Générées à la volée, signées RS256, téléchargeables par l'utilisateur                                  |
| Logos d'apps OAuth | Public, taille max 500 Ko                                                                              |

### 9.2 Phase 2 — Stockage souverain

| Outil                                                            | Usage                                           |
| :--------------------------------------------------------------- | :---------------------------------------------- |
| **MinIO** (Apache 2.0)                                           | S3-compatible, auto-hébergé sur infra gabonaise |
| **Garage** _(alternatif)_                                        | Storage distribué OSS, plus léger que MinIO     |
| **PostgreSQL Large Objects** _(pour les attestations critiques)_ | Backup transactionnel avec le reste des données |

Chiffrement côté client avant upload, clés gérées par OpenBao.

### 9.3 Génération de PDF (attestations, justificatifs)

| Outil                     | Rôle                                              |
| :------------------------ | :------------------------------------------------ |
| **`@react-pdf/renderer`** | Composition PDF en React                          |
| **PAdES** _(Phase 5)_     | Signature électronique avancée pour valeur légale |

---

## 10. Observabilité, logs et audit

### 10.1 Phase 1

| Domaine              | Outil                                               |
| :------------------- | :-------------------------------------------------- |
| Logs applicatifs     | Convex logs + **Better Stack** (Logtail)            |
| Métriques            | Convex dashboard                                    |
| Erreurs frontend     | **Sentry** (auto-hébergé optionnel en Phase 2)      |
| Uptime monitoring    | **Better Stack** ou **UptimeRobot**                 |
| Real User Monitoring | **Vercel Speed Insights** ou **Sentry Performance** |

### 10.2 Audit log

- Table `auditLog` dans Convex (Phase 1) → PostgreSQL `pgAudit` + WORM (Phase 2)
- Append-only par convention (mutations refusent l'update sur cette table)
- Chaque entrée signée RS256 (chaînage Merkle pour intégrité)
- Export quotidien chiffré vers stockage cold (S3 souverain en Phase 2)

### 10.3 Événements journalisés

| Événement                                                          | Détail                       |
| :----------------------------------------------------------------- | :--------------------------- |
| `auth.signin.success` / `.failed` / `.lockout`                     | + IP, UA, device fingerprint |
| `auth.signup.completed`                                            | + profile_type               |
| `auth.email.verified`                                              |                              |
| `auth.otp.sent` / `.verified` / `.expired`                         |                              |
| `auth.mfa.enabled` / `.verified` / `.failed`                       |                              |
| `auth.password.changed` / `.reset`                                 |                              |
| `auth.session.revoked`                                             | + raison                     |
| `oauth.app.created` / `.updated` / `.disabled`                     |                              |
| `oauth.consent.granted` / `.revoked`                               |                              |
| `oauth.token.issued` / `.revoked`                                  |                              |
| `kyc.request.submitted` / `.in_review` / `.approved` / `.rejected` |                              |
| `admin.user.viewed` / `.disabled` / `.role_changed`                |                              |
| `controller.identity.verified`                                     |                              |

### 10.4 Phase 2 — Stack observabilité souveraine

| Outil                   | Rôle                             |
| :---------------------- | :------------------------------- |
| **Grafana**             | Dashboards                       |
| **Prometheus**          | Métriques                        |
| **Loki**                | Logs                             |
| **Tempo**               | Tracing distribué                |
| **OpenTelemetry**       | Instrumentation standard         |
| **Wazuh**               | SIEM                             |
| **Falco** _(optionnel)_ | Détection runtime sur Kubernetes |

---

## 11. Sécurité opérationnelle

### 11.1 Rate limiting applicatif — `@convex-dev/rate-limiter`

Pour tous les endpoints sensibles, le rate limiting est implémenté **dans l'application** via le composant Convex officiel, en complément du WAF en bordure.

Pourquoi pas seulement le WAF :

- Le rate limit Convex est **transactionnel** : il rollback si la mutation échoue, donc on ne consomme pas de quota par erreur
- **Per-user / per-IP / global** scoping fin
- **Token bucket** (bursty) ou **fixed window** selon l'endpoint
- **Visibilité** : on peut requêter `check()` côté client pour afficher un compte à rebours UX
- Survit à un changement de WAF en bordure

```typescript
// convex/rateLimits.ts
import { RateLimiter, MINUTE, HOUR, SECOND } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  signIn: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 10 },
  signUp: { kind: "fixed window", rate: 5, period: HOUR },
  otpSend: { kind: "fixed window", rate: 3, period: HOUR },
  otpVerify: { kind: "token bucket", rate: 10, period: HOUR, capacity: 10 },
  passwordReset: { kind: "fixed window", rate: 3, period: HOUR },
  oauthToken: {
    kind: "token bucket",
    rate: 60,
    period: MINUTE,
    capacity: 60,
    shards: 4,
  },
  kycSubmit: { kind: "fixed window", rate: 3, period: HOUR },
});

// Usage dans une mutation
const status = await rateLimiter.limit(ctx, "signIn", { key: ipAddress });
if (!status.ok)
  throw new ConvexError({
    code: "RATE_LIMITED",
    retryAfter: status.retryAfter,
  });
```

Limites configurées (cohérentes avec §6.6 du cahier des charges plateforme) :

| Limite          | Algorithme              | Valeur     | Scope            |
| :-------------- | :---------------------- | :--------- | :--------------- |
| `signIn`        | token bucket            | 10 / min   | par IP           |
| `signUp`        | fixed window            | 5 / heure  | par IP           |
| `otpSend`       | fixed window            | 3 / heure  | par utilisateur  |
| `otpVerify`     | token bucket            | 10 / heure | par utilisateur  |
| `passwordReset` | fixed window            | 3 / heure  | par email        |
| `oauthToken`    | token bucket sharded ×4 | 60 / min   | par client OAuth |
| `kycSubmit`     | fixed window            | 3 / heure  | par utilisateur  |

**Reset après succès** : sur connexion réussie, on appelle `rateLimiter.reset(ctx, "signIn", { key: ip })` pour libérer immédiatement les tentatives consommées.

### 11.2 WAF et anti-DDoS

| Phase | Outil                                                                     |
| :---- | :------------------------------------------------------------------------ |
| 1     | **Cloudflare** (free tier ou Pro) en front, à confirmer côté souveraineté |
| 2     | **OpenResty + ModSecurity** + **CrowdSec** auto-hébergés                  |

### 11.3 CAPTCHA

| Outil                                            | Usage                                                             |
| :----------------------------------------------- | :---------------------------------------------------------------- |
| **Cloudflare Turnstile**                         | Phase 1 — sur signup, password reset, OTP request en cas de seuil |
| **hCaptcha self-hosted** _(alternative Phase 2)_ | Souverain                                                         |

### 11.4 Vérification des mots de passe

| Outil                      | Rôle                                                         |
| :------------------------- | :----------------------------------------------------------- |
| **zxcvbn-ts**              | Force du mot de passe côté client + serveur                  |
| **HIBP API** (k-anonymity) | Détection de breached passwords sans envoyer le mot de passe |

### 11.5 Headers de sécurité

Configurés dans Next.js middleware par app :

```typescript
// apps/auth/middleware.ts (extrait — CSP maximale)
"Content-Security-Policy":
  "default-src 'self'; " +
  "script-src 'self'; " +
  "style-src 'self'; " +
  "img-src 'self' data:; " +
  "font-src 'self'; " +
  "connect-src 'self'; " +
  "frame-ancestors 'none'; " +
  "form-action 'self'; " +
  "base-uri 'self'; " +
  "upgrade-insecure-requests;",
"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
"X-Frame-Options": "DENY",
"X-Content-Type-Options": "nosniff",
"Referrer-Policy": "strict-origin-when-cross-origin",
"Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
```

### 11.6 Scan de dépendances

| Outil                                                  | Rôle                                   |
| :----------------------------------------------------- | :------------------------------------- |
| **Dependabot**                                         | Mises à jour automatiques              |
| **Socket.dev**                                         | Détection de packages npm malveillants |
| **`bun audit`**                                        | Vulnérabilités connues                 |
| **CodeQL** _(GitHub Advanced Security)_ ou **Semgrep** | Scan SAST                              |

### 11.7 Pentests et bug bounty

- **Pentest annuel externe** obligatoire (organisme certifié)
- **Programme de divulgation responsable** publié dès la mise en production
- **Bug bounty** Phase 5 (HackerOne / YesWeHack)

---

## 12. CI/CD et déploiement

### 12.1 CI

| Outil              | Rôle                                                                      |
| :----------------- | :------------------------------------------------------------------------ |
| **GitHub Actions** | Pipelines build, test, lint, audit                                        |
| Matrice            | Node 22, Bun latest                                                       |
| Étapes             | install → typecheck → lint → test → build → audit deps → size-limit (SDK) |

### 12.2 Déploiement Phase 1

> Décision actée par [ADR-0011](./doc/adr-0011-deploiement-gcp-cloud-run.md) — bascule de Vercel vers **GCP Cloud Run** pour préparer la trajectoire Phase 2 (conteneurs Docker) et garantir la souveraineté EU dès le MVP.

| App                                                                           | Hébergement                                                                |
| :---------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| `apps/web`, `apps/admin`, `apps/controller`, `apps/developer`            | **Google Cloud Run** (région `europe-west1` — Belgique), 1 service par app |
| Images Docker                                                                 | **Artifact Registry** `identite-ga` (région `europe-west1`)                |
| Convex                                                                        | Convex Cloud                                                               |
| Resend                                                                        | Resend Cloud                                                               |

**CI/CD** : GitHub Actions, 1 workflow par app + 1 workflow Convex, déclenchés par `push` sur `main` avec filtres `paths:`. Auth GitHub → GCP via **Workload Identity Federation** (pas de clé JSON). Cf. ADR-0011 §2 pour le mapping workflows ↔ chemins.

### 12.3 Déploiement Phase 2 (souveraineté pragmatique)

| Composant                         | Cible                                                                  |
| :-------------------------------- | :--------------------------------------------------------------------- |
| Apps Next.js + Convex self-hosted | **Conteneurs Docker** orchestrés par **Docker Compose** ou **k3s**     |
| Reverse proxy                     | **Caddy** ou **Traefik**                                               |
| PostgreSQL (backend Convex)       | Patroni + etcd (HA active/passive suffit pour la phase)                |
| Backups                           | **pgbackrest** + snapshots Convex storage + stockage chiffré offsite   |
| Hébergeur cible                   | **Raxio Gabon** (Libreville), **ANINF**, ou autre datacenter souverain |
| DR / multi-zone                   | Au minimum 2 zones avec basculement automatique                        |

### 12.4 Déploiement Phase 3 (souveraineté maximale, conditionnel)

Cf. §13.2 pour la composition. Kubernetes complet, PostgreSQL HA Patroni, Ory Kratos + Hydra en pods avec autoscaling, observabilité de bout en bout.

### 12.5 Environnements

| Env                                    | Usage                                                            |
| :------------------------------------- | :--------------------------------------------------------------- |
| `dev` (local)                          | Bun + Convex dev + Mailcatcher                                   |
| `staging`                              | Vercel preview + Convex preview deployments + Smile ID sandbox   |
| `production`                           | Vercel + Convex prod + Smile ID prod                             |
| `production-souverain` _(Phase 2)_     | Convex self-hosted + PostgreSQL + KYC interne sur infra Gabon    |
| `production-souverain-max` _(Phase 3)_ | Ory + PostgreSQL HA + KYC interne — déclenché conditionnellement |

---

## 13. Phases souveraines

### 13.1 Phase 2 — Souveraineté pragmatique (Convex self-hosted)

#### Vue d'ensemble

```
┌────────────────────────────────────────────────────────────────────┐
│  Edge — Caddy/Traefik + ModSecurity + CrowdSec                     │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  apps/web + apps/auth — Next.js  (containers)                      │
│  (frontend inchangé depuis Phase 1)                                │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  Convex self-hosted (Docker, single-node)                          │
│  • Schema, queries, mutations, actions inchangés                   │
│  • Adapter Better Auth inchangé                                    │
│  • Storage local + sauvegarde S3                                   │
└─────────────────────────┬──────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐
        │  PostgreSQL 16+ (HA via Patroni)│
        │  backend de Convex              │
        │  + pgAudit                      │
        └─────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                   ▼
┌───────────────────┐           ┌────────────────────────┐
│  OpenBao          │           │  Service KYC interne   │
│  + HSM YubiHSM 2  │           │  PaddleOCR + InsightFace│
│  (clés RS256)     │           │  + Regula on-prem      │
└───────────────────┘           └────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────┐
        │  MinIO (S3-compatible)  │
        │  stockage objets        │
        └─────────────────────────┘
```

#### Composants Phase 2

| Composant               | Outil                                                          | Licence            |
| :---------------------- | :------------------------------------------------------------- | :----------------- |
| Auth engine             | **Better Auth** (inchangé)                                     | MIT                |
| Backend données         | **Convex self-hosted**                                         | Apache 2.0         |
| Database                | **PostgreSQL 16+** (backend Convex + queries directes)         | PostgreSQL License |
| Cache                   | Convex built-in + Redis si nécessaire                          | —                  |
| Audit log               | PostgreSQL + **pgAudit**                                       | PostgreSQL License |
| Secrets                 | **OpenBao**                                                    | MPL 2.0            |
| HSM                     | **YubiHSM 2** ou Nitrokey HSM                                  | matériel           |
| Stockage objets         | **MinIO**                                                      | AGPL / commercial  |
| Service KYC             | Service Hono custom (PaddleOCR + InsightFace + Regula on-prem) | mixte              |
| Container orchestration | **Docker Compose** (suffit) ou **k3s**                         | Apache 2.0         |
| Reverse proxy           | **Caddy** ou **Traefik**                                       | Apache 2.0         |
| WAF                     | **OpenResty + ModSecurity**                                    | Apache 2.0         |
| Anti-bot                | **CrowdSec**                                                   | MIT                |
| Observabilité           | **Grafana / Prometheus / Loki / Tempo**                        | AGPL / Apache 2.0  |
| SIEM                    | **Wazuh**                                                      | GPLv2              |

#### Migration Phase 1 → Phase 2

C'est la migration **simple** : on bouge l'hébergement, pas le code.

1. **Déploiement Convex self-hosted** sur infra Gabon avec backend PostgreSQL
2. **Export des données** depuis Convex Cloud via les outils officiels d'export
3. **Import** dans l'instance self-hosted
4. **Validation parallèle** : 7-14 jours de double-run en lecture pour comparer
5. **Bascule DNS** des apps Next.js vers la nouvelle URL Convex self-hosted
6. **Décommissionnement** Convex Cloud après 30 jours sans incident

**Le code applicatif (Better Auth config, schemas Convex, queries, mutations) est strictement inchangé.** Seule l'URL `CONVEX_URL` change dans les variables d'environnement.

#### Quand cette phase suffit

- IdP avec jusqu'à plusieurs centaines de milliers d'utilisateurs actifs
- Charge prévisible (pas de pic > 10× la moyenne)
- Budget infra modéré
- Équipe ops légère

---

### 13.2 Phase 3 — Souveraineté maximale (Ory Kratos + Hydra)

À envisager **uniquement** si l'une des conditions suivantes se présente :

- Limite single-node de Convex atteinte (> ~500k MAU sur le pic)
- Besoin de fonctionnalités OIDC avancées : **CIBA**, **FAPI 2.0**, federation, attestation device
- Exigence d'audit gouvernemental imposant un éditeur avec contrat de support entreprise (Ory propose une offre)
- Volonté politique de standardiser sur des composants Apache 2.0 maintenus par fondations indépendantes

#### Vue d'ensemble

```
┌────────────────────────────────────────────────────────────────────┐
│  Edge — Caddy/Traefik + ModSecurity + CrowdSec                     │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  apps/web + apps/auth — Next.js (containers Kubernetes)            │
│  (frontend inchangé depuis Phase 1)                                │
└────────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐  ┌───────────────────┐  ┌────────────────────────┐
│  Ory Kratos   │  │  Ory Hydra        │  │  Service KYC interne   │
│  (identity)   │  │  (OIDC)           │  │  PaddleOCR + InsightFace│
│  signup,      │  │  /authorize       │  │  + Regula on-prem      │
│  login, MFA,  │  │  /token /jwks     │  │                        │
│  recovery     │  │  /userinfo        │  │                        │
└───────┬───────┘  └─────────┬─────────┘  └────────────┬───────────┘
        │                    │                         │
        └──────────┬─────────┴─────────────────────────┘
                   ▼
        ┌─────────────────────────────────────┐
        │  PostgreSQL 16+ (HA, Patroni+etcd)  │
        │  pgAudit + WORM extension           │
        └─────────────────────────────────────┘
                   │
                   ▼
        ┌─────────────────────────┐  ┌────────────────────┐
        │  OpenBao (Vault fork)   │  │  HSM (YubiHSM 2)   │
        │  secrets management     │  │  clés RS256        │
        └─────────────────────────┘  └────────────────────┘
                   │
                   ▼
        ┌─────────────────────────┐
        │  MinIO (S3-compatible)  │
        └─────────────────────────┘
```

#### Composants Phase 3

| Composant       | Outil                                     | Licence            |
| :-------------- | :---------------------------------------- | :----------------- |
| OIDC issuer     | **Ory Hydra**                             | Apache 2.0         |
| Identity engine | **Ory Kratos**                            | Apache 2.0         |
| Base de données | **PostgreSQL 16+** (HA)                   | PostgreSQL License |
| Cache / queues  | **Redis / Valkey**                        | BSD / Apache 2.0   |
| Audit log       | PostgreSQL + **pgAudit** + WORM extension | PostgreSQL License |
| Secrets         | **OpenBao**                               | MPL 2.0            |
| HSM             | **YubiHSM 2**                             | matériel           |
| Stockage objets | **MinIO**                                 | AGPL / commercial  |
| Orchestration   | **Kubernetes** (k3s)                      | Apache 2.0         |
| Reverse proxy   | **Caddy** ou **Traefik**                  | Apache 2.0         |
| WAF             | **OpenResty + ModSecurity**               | Apache 2.0         |
| Anti-bot        | **CrowdSec**                              | MIT                |
| Observabilité   | **Grafana / Prometheus / Loki / Tempo**   | AGPL / Apache 2.0  |
| SIEM            | **Wazuh**                                 | GPLv2              |

#### Migration Phase 2 → Phase 3

1. **Déploiement parallèle** : Ory Kratos + Hydra + PostgreSQL natif sur infra existante
2. **Réécriture de la couche `apps/auth`** : remplacement des appels Better Auth par les API Kratos/Hydra (le frontend, lui, ne change pas — c'est la même UI, mais elle parle à Ory au lieu de Better Auth)
3. **Sync miroir** des utilisateurs et sessions depuis Convex vers PostgreSQL Ory
4. **Double-run** : 30 jours de production simultanée
5. **Bascule progressive par ring** : 1 % → 10 % → 50 % → 100 %
6. **Décommissionnement** Convex après 60 jours sans incident

Le **SDK reste inchangé** car il ne parle qu'OIDC standard.

---

## 14. Décisions techniques structurantes

### 14.1 Pourquoi Next.js et pas Vite + React Router

- **App Router** : middlewares de sécurité par segment, SSR pour SEO du site public
- **Server components** : pas de JS inutile sur les pages publiques
- **Cookies HTTP-only** server-side simples
- **Adoption massive** : recrutement plus facile

### 14.2 Pourquoi Better Auth en Phase 1 et pas Keycloak

- **DX TypeScript** : auth comme code, typé end-to-end
- **Vitesse d'itération** : changements rapides pendant le MVP
- **Plugin OIDC provider** suffisant pour publier en RS256 dès la version 0
- **Migration prévue** vers Ory en Phase 2 (Better Auth ne tient pas à long terme pour un IdP national)

### 14.3 Pourquoi Convex et pas PostgreSQL dès le départ

- **Vitesse de développement** sur le MVP (queries réactives, sync temps réel sans WebSocket à câbler)
- **Composabilité avec Better Auth** via le component officiel
- **Self-hosting officiel** disponible (Apache 2.0, Docker, backend PostgreSQL) — ce n'est plus un compromis souveraineté en Phase 2, juste un déménagement d'hébergement
- **Réversibilité** : si on bute sur les limites du single-node, on a toujours la Phase 3 (Ory + PostgreSQL natif)

### 14.4 Pourquoi deux apps (`apps/web` et `apps/auth`) plutôt qu'une

- **Frontière de sécurité** : `apps/auth` est lockée (CSP maximale, zéro tiers)
- **Scope cookies** : session sur `.identite.ga`, partagée mais isolée
- **UX** : le citoyen voit `connexion.identite.ga` dans la barre d'adresse pendant l'auth — pattern Google/Apple/FranceConnect
- **Scalabilité indépendante** lors des pics

### 14.5 Pourquoi Ory Kratos + Hydra (et pas Keycloak) si Phase 3

Si la Phase 3 est déclenchée :

- **Headless natif** : zéro UI imposée, on garde nos écrans React
- **Stack légère** (Go vs JVM)
- **API moderne** vs vieux Java
- **Souveraineté + OSS véritable** (Apache 2.0)
- **Migration plus naturelle** depuis Better Auth (les deux sont API-first) que vers Keycloak (template-server)

### 14.6 Pourquoi Smile ID et pas Onfido/Jumio en Phase 1 KYC

- **Modèles entraînés sur visages africains** (taux d'erreur 5-10× moindre que Onfido sur peau foncée)
- **Couverture pays africains** native
- **Prix adaptés** au marché africain
- **Conformité** SOC 2, GDPR, NDPR (Nigéria), POPIA (Afrique du Sud)

---

## 15. Tableau récapitulatif

| Domaine                                         | Phase 1 (MVP Cloud)                                                                          | Phase 2 (souveraineté pragmatique)                         | Phase 3 (souveraineté maximale)                                        |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------- | :--------------------------------------------------------- | :--------------------------------------------------------------------- |
| **Build**                                       | Bun + Turborepo + TypeScript                                                                 | inchangé                                                   | inchangé                                                               |
| **Frontend**                                    | Next.js 16 + React 19 + Tailwind v4                                                          | inchangé                                                   | inchangé                                                               |
| **UI**                                          | Tokens IDN + Radix Primitives + Motion                                                       | inchangé                                                   | inchangé                                                               |
| **SDK**                                         | `@idn-ga/*` packages                                                                            | inchangés                                                  | inchangés                                                              |
| **Auth engine**                                 | Better Auth 1.4+                                                                             | **Better Auth (inchangé)**                                 | Ory Kratos + Ory Hydra                                                 |
| **OIDC**                                        | Better Auth `oidcProvider` (RS256)                                                           | inchangé                                                   | Ory Hydra (RS256)                                                      |
| **DB engine**                                   | Convex Cloud + composants officiels (better-auth, resend, rate-limiter, aggregate, workflow) | **Convex self-hosted** + mêmes composants                  | PostgreSQL 16 natif                                                    |
| **DB backend**                                  | Convex (managé)                                                                              | PostgreSQL via Convex                                      | PostgreSQL HA (Patroni + etcd)                                         |
| **Email**                                       | `@convex-dev/resend` (file, idempotency, webhooks)                                           | inchangé                                                   | Resend / SES / SMTP local via abstraction                              |
| **SMS**                                         | —                                                                                            | Twilio / Africa's Talking                                  | idem                                                                   |
| **KYC**                                         | Smile ID                                                                                     | Service interne (PaddleOCR + InsightFace + Regula on-prem) | idem                                                                   |
| **Storage**                                     | Convex Storage                                                                               | Convex Storage self-hosted                                 | MinIO direct                                                           |
| **Secrets**                                     | Convex env vars                                                                              | OpenBao + HSM YubiHSM 2                                    | idem                                                                   |
| **Rate limiting**                               | `@convex-dev/rate-limiter` (transactionnel)                                                  | inchangé                                                   | Postgres + plugin natif Ory                                            |
| **Agrégations dashboard**                       | `@convex-dev/aggregate` (B-tree O(log N))                                                    | inchangé                                                   | Vues matérialisées Postgres                                            |
| **Workflows durables**                          | `@convex-dev/workflow`                                                                       | inchangé                                                   | Temporal ou similaire                                                  |
| **Cache**                                       | Convex (built-in)                                                                            | Convex + Redis si nécessaire                               | Redis / Valkey                                                         |
| **Observabilité**                               | Better Stack + Sentry                                                                        | Grafana + Prometheus + Loki + Tempo                        | idem                                                                   |
| **SIEM**                                        | Better Stack alerts                                                                          | Wazuh                                                      | idem                                                                   |
| **WAF**                                         | Cloudflare                                                                                   | OpenResty + ModSecurity + CrowdSec                         | idem                                                                   |
| **CAPTCHA**                                     | Cloudflare Turnstile                                                                         | hCaptcha self-hosted                                       | idem                                                                   |
| **CI**                                          | GitHub Actions                                                                               | GitHub Actions                                             | GitHub ou Forgejo Actions self-hosted                                  |
| **Déploiement apps**                            | Vercel                                                                                       | Docker Compose ou k3s                                      | Kubernetes (k3s ou full)                                               |
| **Hébergement**                                 | Vercel + Convex Cloud (US/EU)                                                                | Datacenter Gabon (Raxio / ANINF)                           | idem                                                                   |
| **Backup**                                      | Convex backup                                                                                | pgbackrest + offsite chiffré                               | idem                                                                   |
| **Effort de migration depuis phase précédente** | —                                                                                            | **Léger** : changement d'env vars + export/import data     | **Moyen** : réécriture couche auth dans `apps/auth`, frontend inchangé |
| **Capacité MAU recommandée**                    | illimitée (managé)                                                                           | jusqu'à ~500k MAU                                          | au-delà                                                                |

---

## Annexes

### A. Versions cibles à la mise en production MVP

| Outil                      | Version                           |
| :------------------------- | :-------------------------------- |
| Node                       | 22 LTS                            |
| Bun                        | 1.3+                              |
| Next.js                    | 16.x                              |
| React                      | 19.x                              |
| TypeScript                 | 5.9+                              |
| Tailwind                   | 4.x                               |
| Better Auth                | 1.4+                              |
| Convex                     | 1.27+                             |
| `@convex-dev/better-auth`  | 0.10+ (composant officiel Convex) |
| `@convex-dev/resend`       | dernière stable                   |
| `@convex-dev/rate-limiter` | dernière stable                   |
| `@convex-dev/aggregate`    | dernière stable                   |
| `@convex-dev/workflow`     | dernière stable                   |
| Turborepo                  | 2.9+                              |

### B. Liens utiles

- Cahier des charges plateforme : `cahier-des-charges-platform.md`
- Cahier des charges SDK : `cahier-des-charges-sdk.md`
- Better Auth : https://www.better-auth.com
- **Better Auth × Convex** : https://better-auth.com/docs/integrations/convex
- Convex : https://www.convex.dev
- **Convex self-hosted** : https://stack.convex.dev/self-hosted-develop-and-deploy
- **Composants Convex officiels utilisés** :
  - `@convex-dev/better-auth` : https://better-auth.com/docs/integrations/convex
  - `@convex-dev/resend` : https://www.convex.dev/components/resend · https://github.com/get-convex/resend
  - `@convex-dev/rate-limiter` : https://www.convex.dev/components/rate-limiter · https://github.com/get-convex/rate-limiter
  - `@convex-dev/aggregate` : https://stack.convex.dev/efficient-count-sum-max-with-the-aggregate-component
  - `@convex-dev/workflow` : https://www.convex.dev/components/workflow · https://github.com/get-convex/workflow
- Ory Kratos : https://www.ory.sh/kratos
- Ory Hydra : https://www.ory.sh/hydra
- Smile ID : https://www.smileidentity.com
- PaddleOCR : https://github.com/PaddlePaddle/PaddleOCR
- InsightFace : https://github.com/deepinsight/insightface
- Regula : https://regulaforensics.com
- OpenBao : https://openbao.org
- MOSIP _(référence non retenue)_ : https://www.mosip.io

### C. Décisions ouvertes / à arbitrer

- **Quand basculer vers Phase 2** ? Critère suggéré : dès que le MVP est validé fonctionnellement et avant la première charge réelle de production (avant la première campagne d'enrôlement massif)
- **Convex self-hosted vs managé** au-delà du MVP : la souveraineté impose self-hosted, mais la migration n'est pas urgente tant que la confidentialité des données n'est pas critique (pré-prod / pilote interne)
- **Phase 3 jamais** ou **Phase 3 conditionnelle** ? Suggestion : ne pas planifier la Phase 3 tant que la Phase 2 n'est pas en production et que ses limites ne sont pas mesurées. Évite l'over-engineering.
- **Rester sur Cloudflare** pour le WAF/anti-DDoS Phase 1, ou aller direct sur une solution souveraine ? Cloudflare apporte un anti-DDoS qu'aucun OSS ne remplace simplement — possible compromis : Cloudflare en bordure + ModSecurity en seconde ligne.
- **Hébergeur Phase 2** : Raxio Gabon, ANINF, ou autre ? — décision politique autant que technique
- **HSM matériel vs Vault Transit** pour la signature RS256 en Phase 2 : YubiHSM 2 (~650 €) suffit pour le MVP souverain, Thales Luna pour échelle nationale réelle
- **Quand activer Phase 3** : seulement si l'un des trois déclencheurs survient (cf. §13.2)
