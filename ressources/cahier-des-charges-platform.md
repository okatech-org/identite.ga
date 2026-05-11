# Identité Numérique du Gabon — Plateforme

> **Cahier des charges — Plateforme `identite.ga`**
> Version 1.1 — 10 mai 2026

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Personas et niveaux de garantie](#2-personas-et-niveaux-de-garantie)
3. [Périmètre fonctionnel](#3-périmètre-fonctionnel)
4. [Écrans et parcours](#4-écrans-et-parcours)
5. [Architecture technique](#5-architecture-technique)
6. [Sécurité](#6-sécurité)
7. [Identité visuelle et accessibilité](#7-identité-visuelle-et-accessibilité)
8. [Internationalisation](#8-internationalisation)
9. [Phases de livraison](#9-phases-de-livraison)
10. [Critères d'acceptation MVP](#10-critères-dacceptation-mvp)
11. [Migration vers la cible souveraine](#11-migration-vers-la-cible-souveraine)

---

## 1. Présentation

### 1.1 Vision

**Identité Numérique du Gabon (IDN)** est la plateforme d'identité souveraine de l'État gabonais. Elle joue le rôle de **fournisseur d'identité unique** : tout citoyen, résident ou visiteur dispose d'un compte unique pour s'authentifier sur l'ensemble des services numériques gouvernementaux et tiers connectés.

À la différence d'un broker de fédération (modèle FranceConnect), IDN **détient lui-même** les identités — il n'y a pas de fournisseur d'identité tiers à fédérer.

### 1.2 Périmètre du présent document

Ce cahier des charges couvre **uniquement la plateforme `identite.ga`** :

- Site public (présentation, annuaire des services, FAQ, mentions légales, état du service, contact)
- Portail citoyen — Mon compte (web + responsive mobile)
- Application d'authentification fédérée (écrans déclenchés par redirection OIDC depuis les apps tierces)
- Console d'administration
- Espace contrôleur d'identité
- Portail développeur
- Serveur OIDC

Le SDK destiné aux applications consommatrices fait l'objet d'un **cahier des charges séparé** (`cahier-des-charges-sdk.md`).

### 1.3 Décomposition en applications

Pour des raisons de sécurité, de lisibilité UX et de scalabilité, la plateforme est livrée sous la forme de **deux applications Next.js distinctes** déployées sur des sous-domaines séparés :

| Application     | Sous-domaine            | Périmètre                                                                                                                                                      |
| :-------------- | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`apps/web`**  | `identite.ga`           | Site public · Mon compte (portail citoyen) · Console admin · Espace contrôleur · Portail développeur                                                           |
| **`apps/auth`** | `connexion.identite.ga` | Écrans déclenchés par redirection OIDC : connexion, inscription, OTP, sélection de profil, identité pivot, PIN, démarrage KYC, **écran de consentement OAuth** |

Cette séparation reproduit le pattern utilisé par Google (`accounts.google.com`), Apple (`appleid.apple.com`), Microsoft (`login.microsoftonline.com`) ou FranceConnect (`app.franceconnect.gouv.fr`). Elle garantit :

- **Frontière de sécurité claire** : `apps/auth` est lockée (CSP très stricte, zéro script tiers, zéro analytics, rate limits dédiés)
- **Lisibilité UX** : le citoyen redirigé depuis une app tierce voit clairement `connexion.identite.ga` dans la barre d'adresse — discrimine l'officiel du phishing
- **Isolation des cookies** : la session d'auth est `Domain=.identite.ga` ; `identite.ga` (site public) ne porte pas le cookie sensible
- **Scalabilité indépendante** : l'auth scale à part pendant les pics
- **Better Auth backend** : centralisé dans `apps/auth` (source de vérité de l'identité), `apps/web` le consomme via le client cross-domain

### 1.4 Objectifs

- Permettre à tout citoyen de créer un compte unique et de l'utiliser sur tous les services connectés
- Délivrer une expérience **100 % maîtrisée** (UI/UX entièrement contrôlée côté IDN)
- Construire dès la première version sur des bases **migrables** vers une stack souveraine auto-hébergée
- Respecter les standards internationaux (OpenID Connect, eIDAS, RGPD-équivalent)

---

## 2. Personas et niveaux de garantie

### 2.1 Les six personas

| Persona                    | Famille           | Niveau cible | Objectif principal                                                    |
| :------------------------- | :---------------- | :----------- | :-------------------------------------------------------------------- |
| **Citoyen Gabonais**       | Utilisateur final | Niveau 3     | Accéder aux services administratifs, gérer ses documents officiels    |
| **Résident**               | Utilisateur final | Niveau 2     | Renouveler sa carte de séjour, accéder aux services dédiés résidents  |
| **Visiteur Temporaire**    | Utilisateur final | Niveau 1     | Consulter son e-Visa, informations touristiques                       |
| **Administrateur Système** | Opérateur         | —            | Superviser la plateforme, gérer comptes/apps OAuth/logs               |
| **Contrôleur d'Identité**  | Opérateur         | —            | Vérifier l'authenticité des identités et documents (agent assermenté) |
| **Développeur**            | Intégrateur       | —            | Enregistrer des applications OAuth et consommer l'API                 |

### 2.2 Niveaux de garantie (Levels of Assurance — LoA)

Inspirés d'eIDAS. Chaque application cliente peut exiger un niveau minimum via le scope `acr_values`.

| Niveau       | Nom         | Vérifications                                            | Persona type        | Couleur badge |
| :----------- | :---------- | :------------------------------------------------------- | :------------------ | :------------ |
| **Niveau 1** | Faible      | Email vérifié                                            | Visiteur Temporaire | Neutre (gris) |
| **Niveau 2** | Substantiel | Niveau 1 + KYC document + selfie + liveness + face match | Résident            | Bleu          |
| **Niveau 3** | Élevé       | Niveau 2 + croisement état civil ou présentiel           | Citoyen Gabonais    | Vert          |

Le niveau atteint est **persistant** dans le profil et présenté en clair à l'utilisateur via le badge `LoABadge` (cf. design tokens).

### 2.3 Documents acceptés par profil

| Profil                      | Documents (Niveau 2/3)              |
| :-------------------------- | :---------------------------------- |
| Citoyen Gabonais            | CNI gabonaise, acte de naissance    |
| Résident                    | Carte de séjour, passeport étranger |
| Visiteur Temporaire         | Passeport, visa en cours            |
| Développeur (entité morale) | Registre du commerce, demande d'API |

---

## 3. Périmètre fonctionnel

### 3.1 Site public (`identite.ga`, sans authentification)

Pages accessibles à tous, indexables, optimisées SEO et performance. Servies par `apps/web`.

| Page                         | Route               | Contenu                                                                                                                     |
| :--------------------------- | :------------------ | :-------------------------------------------------------------------------------------------------------------------------- |
| **À propos**                 | `/` ou `/a-propos`  | Vision IDN, mission, valeurs, gouvernance, statistiques publiques (nombre de comptes, services connectés)                   |
| **Annuaire des services**    | `/services`         | Liste des applications gouvernementales et tierces utilisant IDN, recherche/filtres par domaine (santé, éducation, fiscal…) |
| **Pour les administrations** | `/administrations`  | Page B2G : comment intégrer IDN dans son service, processus d'enrôlement, contacts, ressources                              |
| **Aide & FAQ**               | `/aide`             | Questions fréquentes par persona (citoyen, résident, visiteur, développeur), recherche, articles                            |
| **Mentions légales**         | `/mentions-legales` | Éditeur, hébergeur, propriété intellectuelle, conditions d'utilisation, politique de confidentialité, cookies               |
| **État du service**          | `/etat`             | Disponibilité temps réel des composants (auth, OIDC, KYC, console), historique d'incidents, fenêtres de maintenance         |
| **Contact**                  | `/contact`          | Formulaire (citoyen, administration, presse, sécurité), coordonnées, adresse postale officielle                             |

Toutes ces pages partagent un header public (logo IDN, navigation, lien « Se connecter »/« Mon compte ») et un footer institutionnel.

### 3.2 Portail citoyen — onboarding

- **Sélection de profil** : citoyen / résident / visiteur / développeur (étape 1, conditionne la suite)
- **Inscription** : email + mot de passe ≥ 12 caractères, force mesurée par zxcvbn (score ≥ 3)
- **Vérification email** : OTP 6 chiffres, expiration 15 min, cooldown renvoi 60 s, max 5 tentatives
- **Identité pivot** : nom, prénom, date de naissance, genre, lieu de naissance, nationalité, photo (optionnelle)
- **Création de PIN** : 6 chiffres, utilisé pour les actions sensibles et l'accès rapide

### 3.3 Portail citoyen — espace connecté (Mon compte)

Routes sous `/portail/*` (ou `/mon-compte/*`) dans `apps/web`. Accessible après authentification IDN.

- **Tableau de bord** : badge LoA, identité résumée, accès rapides (profil, consentements, sécurité, documents)
- **Profil** : consultation et édition des champs pivot, changement de mot de passe / email avec re-vérification
- **Consentements** : liste des apps autorisées, scopes détaillés, révocation en un clic
- **Connexion rapide** : email + mot de passe, ou PIN sur appareil enrôlé _(post-MVP : passkey/WebAuthn)_

### 3.4 Paramètres et gestion du compte

Sous-section du portail citoyen, accessible via une barre latérale dédiée. Routes sous `/portail/parametres/*`.

| Page                          | Contenu                                                                                                                                                           |
| :---------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sécurité**                  | Mot de passe (changement, force), MFA (TOTP, WebAuthn — phase 2), PIN (modification), suppression de compte (double confirmation)                                 |
| **Appareils & sessions**      | Liste des sessions actives (navigateur, OS, IP, ville approximative, dernière activité, badge « session actuelle »), révocation par session ou globale            |
| **Mes documents**             | Photo de profil, documents KYC uploadés (statuts, dates), téléchargement de mes attestations (PDF signé par IDN)                                                  |
| **Notifications**             | Préférences par canal (email, in-app), par type (sécurité, KYC, consentements, communications)                                                                    |
| **Historique d'activité**     | Journal personnel des événements : connexions, changements de profil, consentements accordés/révoqués, contrôles d'identité subis (transparence). Export CSV/JSON |
| **Données & confidentialité** | Téléchargement de mes données (export RGPD-équivalent), demande d'effacement, gestion des cookies, audit des partages avec apps tierces                           |
| **Langue & accessibilité**    | Choix de la langue (fr/en), thème (clair/sombre/auto), préférences d'accessibilité (taille de police, contrastes renforcés, animations réduites)                  |

### 3.5 KYC Niveau 2

- **Capture document** : recto/verso, OCR + lecture MRZ
- **Selfie vivant** : détection de présence (liveness), face match contre le document
- **Statut** : `en attente` → `en cours d'examen` → `approuvé` / `rejeté` (avec motif)
- Notification email à chaque transition de statut
- Revue manuelle par un Contrôleur d'Identité si la confiance automatique est insuffisante

### 3.6 KYC Niveau 3 _(Phase ultérieure)_

- KYC vidéo (entretien à distance) ou rendez-vous présentiel
- Croisement avec le registre national d'état civil
- Authentification renforcée obligatoire (passkey ou MFA)

### 3.7 Serveur OIDC

- **OpenID Connect 1.0 + OAuth 2.1**
- Authorization Code Flow + **PKCE obligatoire**
- Endpoints publics : `/authorize`, `/token`, `/userinfo`, `/.well-known/openid-configuration`, `/jwks.json`, `/logout`
- Signature des ID tokens en **RS256** (clés asymétriques RSA), JWKS publié
- Claims standards (`sub`, `name`, `given_name`, `family_name`, `email`, `email_verified`, `birthdate`, `gender`, `nationality`)
- Claim custom `acr` indiquant le niveau LoA atteint
- Scope custom `idn:loa:<n>` pour exiger un niveau minimum
- **Trusted clients** (skip consent) pour apps first-party
- Back-channel logout pour les RP qui le supportent

### 3.8 Application d'authentification fédérée (`connexion.identite.ga`)

Application Next.js dédiée (`apps/auth`) hébergeant l'ensemble des écrans déclenchés par une **redirection OIDC** depuis une app tierce, ou par un accès direct au login.

| Écran                   | Route                                         | Déclenchement                                                                                             |
| :---------------------- | :-------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Connexion**           | `/`                                           | Redirect OIDC d'une app tierce, ou clic « Se connecter » sur identite.ga                                  |
| **Sélection de profil** | `/inscription/profil`                         | Premier pas du signup                                                                                     |
| **Inscription**         | `/inscription`                                | Email + mot de passe                                                                                      |
| **Vérification OTP**    | `/inscription/otp`                            | Suite signup, ou changement d'email                                                                       |
| **Identité pivot**      | `/inscription/identite`                       | Suite OTP                                                                                                 |
| **Création PIN**        | `/inscription/pin`                            | Suite identité pivot                                                                                      |
| **Démarrage KYC**       | `/kyc/document`, `/kyc/selfie`, `/kyc/statut` | Demande de montée en niveau, déclenchée depuis le portail ou par un RP exigeant un `acr_values` supérieur |
| **Consentement OAuth**  | `/consentement`                               | Pendant un flow OIDC, après auth réussie, si app non-trusted                                              |
| **Mot de passe oublié** | `/recuperation`                               | Lien « mot de passe oublié »                                                                              |
| **Réinitialisation**    | `/recuperation/nouveau`                       | Suite email de récupération                                                                               |

Cette app est **lockée** par configuration : CSP très stricte, aucun script tiers, aucun analytics, rate limits dédiés. Elle ne contient que les flows critiques d'authentification.

À l'issue du flow, l'utilisateur est redirigé soit vers l'app cliente (`redirect_uri`), soit vers `identite.ga/portail` (cas d'accès direct).

### 3.9 Console d'administration

7 onglets, accès restreint au rôle `admin` :

1. **Tableau de bord** : KPIs (comptes totaux, vérifiés par niveau, connexions 24h/7j, apps actives), alertes
2. **Applications OAuth** : liste avec filtres, recherche, statut enabled/disabled
3. **Détail d'une app** : config, redirect URIs, scopes, statistiques d'usage, liste des consentements
4. **Comptes IDN** : recherche, filtres (niveau, statut), pagination, accès au détail compte
5. **Logs & audit** : événements de sécurité chronologiques, filtres par type/utilisateur/date
6. **Rôles & habilitations** : gestion des admins et des contrôleurs d'identité
7. **Providers email/SMS** : configuration multi-provider (Resend, SendGrid, AWS SES, SMTP custom ; SMS phase 2)

### 3.10 Espace Contrôleur d'Identité

4 onglets, accès restreint au rôle `identity_controller` :

1. **File de demandes KYC** : queue priorisée, assignation, action approuver/rejeter avec motif
2. **Scanner identité** : lecture QR/NFC d'une preuve présentée par un citoyen
3. **Vérifier signature** : contrôle cryptographique d'un document signé par IDN (via JWKS)
4. **Historique de contrôles** : traçabilité des vérifications (horodatage, agent, résultat)

Chaque action laisse une trace côté citoyen (transparence). MFA obligatoire pour ce rôle.

### 3.11 Portail développeur

4 onglets, accès `developer` (compte utilisateur étendu) :

1. **Mes applications** : liste des apps OAuth créées par le développeur
2. **Clés & secrets** : `client_id` permanent, `client_secret` généré et affiché **une seule fois**, rotation
3. **Documentation** : OIDC discovery, exemples d'intégration via SDK ou OIDC standard
4. **Quotas & usage** : statistiques d'appels, limites, demande d'augmentation

Création d'app soumise à validation `admin` avant activation en production.

---

## 4. Écrans et parcours

Les maquettes haute-fidélité sont disponibles dans `ressources/interfaces/project/idn.html`. Ce qui suit est l'inventaire exhaustif des écrans à implémenter, regroupés par application cible.

### 4.1 `apps/web` — Site public + Mon compte + Consoles

#### Pages publiques (`/*`, sans authentification)

| Écran                    | Route               | Source                            |
| :----------------------- | :------------------ | :-------------------------------- |
| À propos                 | `/`                 | `CitizenPublic screen="about"`    |
| Annuaire des services    | `/services`         | `CitizenPublic screen="services"` |
| Pour les administrations | `/administrations`  | `CitizenPublic screen="admins"`   |
| Aide & FAQ               | `/aide`             | `CitizenPublic screen="help"`     |
| Mentions légales         | `/mentions-legales` | `CitizenPublic screen="legal"`    |
| État du service          | `/etat`             | `CitizenPublic screen="status"`   |
| Contact                  | `/contact`          | `CitizenPublic screen="contact"`  |

#### Mon compte — espace connecté (`/portail/*`)

| Écran                              | Source                                 |
| :--------------------------------- | :------------------------------------- |
| Tableau de bord (Niveau 3 / 2 / 1) | `CitizenWeb screen="home"` avec `user` |
| Mon profil                         | `CitizenWeb screen="profile"`          |
| Consentements                      | `CitizenWeb screen="consents"`         |
| Démarrer la vérification KYC       | `CitizenWeb screen="kyc"`              |
| Demande KYC envoyée                | `CitizenWeb screen="kyc-status"`       |

#### Mon compte — paramètres (`/portail/parametres/*`)

| Écran                     | Source                                   |
| :------------------------ | :--------------------------------------- |
| Sécurité                  | `CitizenSettings screen="security"`      |
| Appareils & sessions      | `CitizenSettings screen="sessions"`      |
| Mes documents             | `CitizenSettings screen="documents"`     |
| Notifications             | `CitizenSettings screen="notifications"` |
| Historique d'activité     | `CitizenSettings screen="activity"`      |
| Données & confidentialité | `CitizenSettings screen="privacy"`       |
| Langue & accessibilité    | `CitizenSettings screen="preferences"`   |

#### Console d'administration (`/admin/*`)

7 écrans (cf. §3.9) : Tableau de bord · Applications OAuth · Détail d'une app · Comptes IDN · Logs & audit · Rôles & habilitations · Providers email/SMS.

#### Espace Contrôleur (`/controleur/*`, desktop + mobile pour scan terrain)

4 écrans (cf. §3.10) : File de demandes KYC · Scanner identité · Vérifier signature · Historique contrôles.

#### Portail Développeur (`/dev/*`)

4 écrans (cf. §3.11) : Mes applications · Clés & secrets · Documentation · Quotas & usage.

### 4.2 `apps/auth` — Authentification fédérée (`connexion.identite.ga`)

App Next.js dédiée. Tous les écrans sont mobile-first (les redirections OIDC arrivent souvent depuis un mobile).

| Écran                    | Route                   | Source mobile                       | Source desktop                |
| :----------------------- | :---------------------- | :---------------------------------- | :---------------------------- |
| Accueil / point d'entrée | `/`                     | `MobilePrototype initial="welcome"` | `CitizenWeb screen="welcome"` |
| Sélection de profil      | `/inscription/profil`   | `screen="profil"`                   | `screen="profil"`             |
| Inscription              | `/inscription`          | `screen="signup"`                   | `screen="signup"`             |
| Vérification OTP         | `/inscription/otp`      | `screen="otp"`                      | `screen="otp"`                |
| Identité pivot           | `/inscription/identite` | `screen="pivot"`                    | `screen="pivot"`              |
| Création PIN             | `/inscription/pin`      | `screen="pin"`                      | `screen="pin"`                |
| Connexion                | `/connexion`            | `screen="login"`                    | `screen="login"`              |
| KYC — pièce d'identité   | `/kyc/document`         | `screen="kyc-doc"`                  | (invitation continuer mobile) |
| KYC — selfie vivant      | `/kyc/selfie`           | `screen="kyc-selfie"`               | —                             |
| KYC — demande envoyée    | `/kyc/statut`           | `screen="kyc-status"`               | `screen="kyc-status"`         |
| Consentement OAuth       | `/consentement`         | `screen="oidc"`                     | `OidcDesktop`                 |
| Mot de passe oublié      | `/recuperation`         | _à designer_                        | _à designer_                  |

### 4.3 Mobile responsive

`apps/web` et `apps/auth` sont **responsive mobile-first**. Les artboards mobiles 360×740 du canvas sont la référence visuelle pour les viewports ≤ 480 px.

### 4.4 États transverses obligatoires

Pour chaque écran : **chargement** (skeletons), **vide** (illustration + CTA), **erreur** (messages explicites en français), **succès** (toast / inline).

---

## 5. Architecture technique

### 5.1 Monorepo

```
identite.ga/
├── apps/
│   ├── web/         Next.js 16 — identite.ga
│   │                Site public · Mon compte · Console admin ·
│   │                Espace contrôleur · Portail développeur (port 3000)
│   ├── auth/        Next.js 16 — connexion.identite.ga
│   │                Login, signup, OTP, identité pivot, PIN, KYC,
│   │                consentement OAuth (port 3002)
│   │                Better Auth backend vit ici
│   └── docs/        Next.js 16 — documentation publique du SDK (port 3001)
├── packages/
│   ├── ui/          Composants partagés (design system IDN)
│   ├── eslint-config/
│   └── typescript-config/
└── ressources/
    ├── interfaces/  Maquettes HTML/JSX de référence
    ├── cahier-des-charges-platform.md   ← ce document
    └── cahier-des-charges-sdk.md
```

`apps/web` lit la session via le client Better Auth pointant vers `apps/auth` (cookie cross-subdomain `Domain=.identite.ga`).

### 5.2 Stack — Phase 1 (MVP)

| Couche            | Choix                                                                                     |
| :---------------- | :---------------------------------------------------------------------------------------- |
| Build             | **Turborepo + Bun**                                                                       |
| Frontend          | **Next.js 16** (App Router) + **React 19**                                                |
| UI                | Composants `@repo/ui` basés sur les design tokens IDN                                     |
| Auth backend      | **Better Auth 1.4+** avec plugins `oidcProvider`, `jwt`, `emailOtp`, `admin`, `twoFactor` |
| Backend données   | **Convex** (schema, queries, mutations, actions)                                          |
| Email             | **Resend** pour le MVP, abstraction multi-provider                                        |
| Stockage fichiers | Convex storage pour photos profil, documents KYC chiffrés                                 |

### 5.3 Stack — Phase 2 (cible souveraine)

| Couche          | Choix                                                                                                              |
| :-------------- | :----------------------------------------------------------------------------------------------------------------- |
| OIDC issuer     | **Ory Hydra** (Go, Apache 2.0, headless)                                                                           |
| Identity engine | **Ory Kratos** (signup, login, MFA, profile, sessions)                                                             |
| Base de données | **PostgreSQL 16+** auto-hébergé                                                                                    |
| Service KYC     | Service Node/Python custom — **PaddleOCR** + **InsightFace** + **Regula on-prem** pour détection de faux documents |
| Secrets / clés  | **OpenBao** (fork OSS de Vault) ou **HashiCorp Vault**                                                             |
| HSM             | **YubiHSM 2** ou Nitrokey HSM                                                                                      |
| Audit log       | PostgreSQL + **pgAudit** + export WORM                                                                             |
| Observabilité   | Grafana + Prometheus + Loki + Tempo                                                                                |
| SIEM            | Wazuh                                                                                                              |
| Hébergement     | Datacenters au Gabon (Raxio Gabon, ANINF)                                                                          |

> [!IMPORTANT]
> La Phase 1 est livrée sur Better Auth + Convex pour itérer rapidement. La Phase 2 bascule sur Ory + PostgreSQL souverain. **Le frontend Next.js et le SDK ne changent pas** pendant cette migration : seul le backend OIDC change, et OIDC est un standard.

### 5.4 Flux d'authentification (Phase 1)

```
App cliente tierce (consulat.ga, e-visa.ga…)
  utilise @idn-ga/better-auth → genericOAuth
   │
   │  1. redirect OIDC → connexion.identite.ga/api/auth/oauth2/authorize
   ▼
apps/auth (Next.js, connexion.identite.ga)
   ├── Better Auth backend (/api/auth/*)
   ├── Pages /connexion, /inscription/*, /consentement, /kyc/*
   └── Convex pour la persistance
   │
   │  2. Auth réussie + consentement → redirect vers redirect_uri
   ▼
App cliente reçoit le code, échange contre token

────────────────────────────────────────────────────────

Citoyen sur identite.ga qui veut Mon compte
   │
   │  Clic « Se connecter » → redirect vers connexion.identite.ga
   ▼
apps/auth — auth ceremony
   │
   │  Cookie de session posé sur Domain=.identite.ga
   │  Redirect vers identite.ga/portail
   ▼
apps/web (identite.ga) — lit la session via Better Auth client
   └── Affiche Mon compte
```

### 5.5 Flux d'authentification (Phase 2 cible)

```
App cliente
   │  redirect OIDC → identite.ga/oauth2/auth
   ▼
Ory Hydra
   │  login_challenge → redirect vers /connexion (UI Next.js IDN)
   ▼
Frontend IDN
   │  authenticate via Ory Kratos API
   │  KYC checks via service custom
   │  accept login_challenge côté Hydra
   ▼
Hydra émet le code → app cliente échange contre token
```

### 5.6 Modèle de données (extrait Phase 1)

| Table / collection | Champs clés                                                                                                                                                            |
| :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`            | id, email, emailVerified, profile (citizen/resident/visitor/developer), pivot (nom, prénom, dob, genre, lieu, nationalité), photo, **loa** (1/2/3), pinHash, createdAt |
| `accounts`         | userId, providerId, password (Better Auth)                                                                                                                             |
| `sessions`         | userId, token, deviceInfo, ip, userAgent, expiresAt, lastActivityAt                                                                                                    |
| `oauthApplication` | clientId, clientSecret (hashé), name, logo, redirectUris[], scopes[], trusted, ownerId, status                                                                         |
| `oauthConsent`     | userId, clientId, scopes[], grantedAt                                                                                                                                  |
| `kycRequests`      | userId, status, documentType, documentImages (refs), selfieImage (ref), score, reviewerId, reviewedAt, motif                                                           |
| `roles`            | userId, role (admin / identity_controller / developer)                                                                                                                 |
| `auditLogs`        | actorId, action, target, ip, userAgent, metadata, signature, createdAt                                                                                                 |
| `notifications`    | userId, channel (email/in-app), category (security/kyc/consent/comms), title, body, readAt, createdAt                                                                  |
| `userPreferences`  | userId, language, theme, accessibility (fontSize, reducedMotion, highContrast), notificationOpts                                                                       |
| `userDocuments`    | userId, type (profilePhoto / kycDocFront / kycDocBack / selfie / attestation), storageRef, mimeType, sha256, createdAt, expiresAt                                      |

---

## 6. Sécurité

### 6.1 Cryptographie

- ID tokens : **RS256** obligatoire dès la première version (pas de HS256)
- Clés RSA 2048+ rotées tous les 90 jours, chevauchement de 7 jours
- JWKS endpoint public, cache 24h max côté RP
- Mots de passe : **scrypt** (Better Auth par défaut) ou **argon2id** en Phase 2

### 6.2 Authentification

- Politique de mot de passe : ≥ 12 caractères, zxcvbn ≥ 3, vérification breached passwords (HIBP k-anonymity)
- Lockout : 5 échecs en 10 min → blocage 15 min + alerte email
- **MFA obligatoire** pour les rôles `admin` et `identity_controller` (TOTP ou WebAuthn)
- MFA recommandée puis obligatoire pour Niveau 3 citoyen
- PIN à 6 chiffres dérivé via PBKDF2 (jamais en clair, jamais transmis non hashé)

### 6.3 Sessions

- Durée par défaut : 14 jours, renouvelée à chaque activité
- Idle timeout configurable
- Notification email à toute nouvelle connexion sur un device inconnu
- Révocation par session ou globale
- Maximum 10 sessions simultanées par utilisateur

### 6.4 Refresh tokens

- Rotation automatique
- **Détection de réutilisation** (replay) → révocation de la chaîne entière + alerte

### 6.5 OAuth / OIDC hardening

- `redirect_uri` exact match obligatoire (pas de wildcard)
- HTTPS obligatoire en production (HTTP toléré en dev local uniquement)
- PKCE obligatoire pour tous les clients (publics et confidentiels)
- State + nonce vérifiés
- `client_secret` jamais re-affiché après création — rotation par révocation+régénération

### 6.6 Rate limiting

| Endpoint                     | Limite                      |
| :--------------------------- | :-------------------------- |
| `/api/auth/sign-in`          | 10 / IP / minute            |
| `/api/auth/sign-up`          | 5 / IP / heure              |
| `/api/auth/email-otp/send`   | 3 / utilisateur / heure     |
| `/api/auth/email-otp/verify` | 10 / utilisateur / heure    |
| `/oauth2/token`              | 60 / client / minute        |
| Tous endpoints sensibles     | rate limit applicatif + WAF |

CAPTCHA (Turnstile/hCaptcha) sur signup, password reset, OTP request en cas de seuil franchi.

### 6.7 Audit log

Toute action sensible journalisée avec horodatage, acteur, IP, UA, cible et métadonnées :

- Login (succès, échec, lockout)
- OTP envoyé / vérifié / expiré
- Création / modification / désactivation de compte
- KYC : envoyé, en revue, approuvé, rejeté
- Consentement OAuth accordé / révoqué
- Session révoquée
- Action admin / contrôleur
- Création / modification d'app OAuth

**Append-only** côté DB (Phase 1 via convention, Phase 2 via WORM réel). Chaque entrée signée pour intégrité.

### 6.8 Confidentialité

- Documents KYC chiffrés au repos (clés gérées par OpenBao en Phase 2)
- PII minimisée dans les claims OIDC (les apps ne reçoivent que les scopes autorisés)
- Suppression de compte : effacement des PII conformément au RGPD-équivalent gabonais (loi 001/2011), conservation des logs d'audit anonymisés
- Pas de partage avec des tiers hors du périmètre OIDC

### 6.9 Headers et configuration HTTP

| Application                         | CSP                                                                                          | Scripts tiers                   | Analytics                                 | X-Frame-Options |
| :---------------------------------- | :------------------------------------------------------------------------------------------- | :------------------------------ | :---------------------------------------- | :-------------- |
| `apps/web` (identite.ga)            | Stricte (pas de `unsafe-inline`/`unsafe-eval`)                                               | Polices Google Fonts uniquement | Analytics interne (auto-hébergé) autorisé | `DENY`          |
| `apps/auth` (connexion.identite.ga) | **Maximale** : self uniquement, pas de polices externes (auto-hébergées), aucun script tiers | **Aucun**                       | **Aucun**                                 | `DENY`          |

Communs aux deux apps :

- HSTS `max-age=31536000; includeSubDomains; preload`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` minimale (camera/microphone autorisés sur `apps/auth` pour le KYC, refusés sur `apps/web`)
- Cookie de session : `Domain=.identite.ga`, `Secure`, `HttpOnly`, `SameSite=Lax`, scope partagé entre `apps/web` et `apps/auth`

### 6.10 Conformité

- Loi gabonaise 001/2011 sur la protection des données
- Désignation d'un DPO
- Registre des traitements
- Étude d'impact (PIA) avant production
- Audit de sécurité externe annuel + pentest

---

## 7. Identité visuelle et accessibilité

### 7.1 Design tokens

Définis dans `ressources/interfaces/project/idn-tokens.jsx`, à transposer en CSS variables / Tailwind theme dans `packages/ui`.

| Token         | Valeur    | Usage                                            |
| :------------ | :-------- | :----------------------------------------------- |
| `green`       | `#0E7C3A` | Primary, niveau 3, CTA principaux                |
| `greenDk`     | `#0A5C2C` | Hover primary                                    |
| `yellow`      | `#F2C811` | Accents institutionnels (drapeau), pas décoratif |
| `blue`        | `#2563AC` | Niveau 2, liens secondaires                      |
| Light bg      | `#FAFAF8` | Fond clair                                       |
| Light surface | `#FFFFFF` | Cartes                                           |
| Light ink     | `#16170F` | Texte principal                                  |
| Dark bg       | `#0E110D` | Fond sombre                                      |
| Dark surface  | `#181C16` | Cartes sombre                                    |
| Dark ink      | `#F2F0E8` | Texte sombre                                     |

Polices : **IBM Plex Sans** (texte) + **IBM Plex Mono** (code, identifiants, secrets).

Radius : `sm: 6 / md: 10 / lg: 14 / xl: 20 / pill: 9999`.

### 7.2 Mode clair et sombre

Tous les écrans doivent être livrés dans les deux modes. Couleurs Gabon (vert/jaune/bleu) **inchangées** entre les modes — seuls les neutres s'inversent.

### 7.3 Accessibilité

- Conformité **WCAG 2.1 AA** / **RGAA 4.1.2**
- Contraste ≥ 4.5:1 pour le texte, 3:1 pour les éléments graphiques
- Navigation clavier complète sur tous les écrans
- Focus visible sur tous les éléments interactifs (anneau vert IDN sur fond clair, équivalent sur fond sombre)
- ARIA labels sur les icônes interactives, `aria-live` pour les toasts et statuts
- Lecteurs d'écran : tous les flows critiques (signup, login, OTP, KYC) testés avec VoiceOver / NVDA
- Tailles cliquables ≥ 44×44 px sur mobile
- Pas de couleur seule pour transmettre une information (badges accompagnés d'icônes/texte)

### 7.4 Ton institutionnel

- Sobre, factuel, rassurant — ce n'est pas une startup, c'est l'État
- Pas d'emojis dans l'UI
- Pas de gradients flashy, pas de glassmorphism
- Pas de copie marketing exagérée
- Sur les consentements : option « Refuser » de poids visuel **égal** à « Autoriser »

---

## 8. Internationalisation

- **Français** : langue principale (toutes les chaînes)
- **Anglais** : langue secondaire dès le MVP (au moins onboarding + connexion)
- _Phase ultérieure_ : portugais (Guinée Équatoriale, Angola voisins), langues nationales gabonaises (fang, etc.) sur sélection
- Toutes les chaînes externalisées (i18n keys), pas de texte en dur dans les composants
- Format dates / nombres localisés
- Direction LTR uniquement (pas de RTL prévu)

---

## 9. Phases de livraison

| Phase | Périmètre                                                                 | Stack                              | Priorité     |
| :---- | :------------------------------------------------------------------------ | :--------------------------------- | :----------- |
| **1** | Onboarding L1, OIDC RS256, portail citoyen, console admin de base         | Better Auth + Convex               | 🔴 MVP       |
| **2** | KYC L2 (Smile ID ou intégration interne basique), espace contrôleur       | Better Auth + Convex + service KYC | 🔴 MVP       |
| **3** | Portail développeur self-service, MFA TOTP, audit log complet             | Better Auth + Convex               | 🟠 Post-MVP  |
| **4** | Migration backend Ory Kratos + Hydra + PostgreSQL souverain               | Ory + PG                           | 🟠 Post-MVP  |
| **5** | KYC L3 (entretien vidéo, registre état civil), HSM, WebAuthn              | Stack souveraine                   | 🟢 Évolution |
| **6** | App mobile native, Verifiable Credentials W3C, mode hors-ligne contrôleur | iOS + Android                      | 🟢 Évolution |

---

## 10. Critères d'acceptation MVP

### 10.1 Fonctionnel

**Site public et navigation**

- [ ] Les 7 pages publiques (à propos, services, administrations, aide, mentions, état, contact) sont en ligne, indexables, performantes
- [ ] Le formulaire de contact est opérationnel (4 catégories : citoyen, administration, presse, sécurité)
- [ ] La page « État du service » reflète la disponibilité réelle des composants

**Onboarding et identité**

- [ ] Un utilisateur peut sélectionner son profil et créer un compte au Niveau 1 avec email vérifié + PIN, depuis `connexion.identite.ga`
- [ ] Un utilisateur peut se connecter et est redirigé soit vers `identite.ga/portail`, soit vers l'app cliente d'origine

**Mon compte (identite.ga/portail)**

- [ ] Tableau de bord avec badge LoA visible
- [ ] Profil : consultation et édition, changement mot de passe / email avec re-vérification
- [ ] Consentements : liste et révocation
- [ ] Paramètres — Sécurité : MFA, PIN, suppression de compte
- [ ] Paramètres — Sessions : liste avec géoloc approximative, révocation par session ou globale
- [ ] Paramètres — Documents : visualisation des fichiers uploadés et attestations téléchargeables
- [ ] Paramètres — Notifications : préférences fonctionnelles
- [ ] Paramètres — Activité : journal personnel exportable
- [ ] Paramètres — Confidentialité : export RGPD opérationnel, demande d'effacement
- [ ] Paramètres — Langue & accessibilité : changement de langue et de thème persistés

**KYC et niveaux**

- [ ] Un utilisateur peut lancer un KYC Niveau 2 et suivre son statut
- [ ] Un Contrôleur d'Identité peut traiter une demande KYC en file

**Consoles**

- [ ] Un Administrateur peut lister les comptes, les apps OAuth, les consentements
- [ ] Un Développeur peut enregistrer une app OAuth et obtenir `client_id` + `client_secret`

**OIDC**

- [ ] Une app cliente peut s'authentifier via OIDC standard (Authorization Code + PKCE) en passant par `connexion.identite.ga`
- [ ] Une app cliente peut exiger un `acr_values` minimum et le voir respecté
- [ ] Tokens signés en RS256, JWKS public et vérifiable
- [ ] L'écran de consentement OAuth est conforme (pas de dark pattern)

### 10.2 Non-fonctionnel

- [ ] Tous les écrans des maquettes implémentés en mode clair et sombre
- [ ] WCAG 2.1 AA validé sur les flows critiques (signup, login, OTP, consentement OIDC)
- [ ] Rate limiting actif sur tous les endpoints sensibles
- [ ] Audit log opérationnel sur les événements listés en 6.7
- [ ] CSP, HSTS et autres headers de sécurité configurés
- [ ] Politique de mot de passe ≥ 12 + zxcvbn + HIBP appliquée
- [ ] MFA TOTP opérationnel pour `admin` et `identity_controller`
- [ ] Performance : LCP < 2.5 s en 4G simulé sur les pages publiques
- [ ] Disponibilité cible : 99.5 % en MVP, 99.9 % en cible souveraine

### 10.3 Sécurité

- [ ] Audit de sécurité externe avant mise en production
- [ ] Pentest rapport délivré et findings critiques fermés
- [ ] Programme de divulgation responsable publié
- [ ] Backups chiffrés quotidiens, restauration testée

---

## 11. Migration vers la cible souveraine

La migration de la Phase 1 (Better Auth + Convex) vers la Phase 4 (Ory + PostgreSQL) doit être planifiée dès la conception. Principes :

1. **Le frontend Next.js ne change pas** — toute la logique métier est dans des composants UI et des hooks, pas dans des appels propriétaires Convex spécifiques aux flows d'auth.
2. **Le SDK ne change pas** — c'est le contrat OIDC qui prime, pas l'implémentation backend.
3. **Les données sont migrables** — schéma utilisateur, sessions, OAuth apps, consents, audit log doivent avoir un export JSON propre vers PostgreSQL.
4. **Période de double-run** : pendant 30 jours minimum, les deux backends tournent en parallèle, comparaison des résultats sur les mêmes requêtes, bascule progressive par ring.
5. **Reversibilité** : la bascule doit pouvoir être annulée sans perte de données les 14 premiers jours.

---

## Annexes

### A. Références

- Cahier des charges SDK : `ressources/cahier-des-charges-sdk.md`
- Maquettes : `ressources/interfaces/project/idn.html`
- Design tokens : `ressources/interfaces/project/idn-tokens.jsx`
- OpenID Connect Core 1.0 : https://openid.net/specs/openid-connect-core-1_0.html
- OAuth 2.1 (draft) : https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/
- eIDAS Levels of Assurance : Règlement (UE) n° 910/2014
- WCAG 2.1 : https://www.w3.org/TR/WCAG21/
- RGAA 4.1.2 : https://accessibilite.numerique.gouv.fr/
