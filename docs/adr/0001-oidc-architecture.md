# ADR 0001 — Architecture OIDC IDN

**Status** : Accepted
**Date** : 2026-05-24
**Authors** : @okafrancois

## Contexte

IDN (Identité Numérique Gabonaise) est un fournisseur OIDC pour des
relying parties (Gabon Connect, et apps tierces qui s'enregistrent via
le portail développeur). Le backend tourne sur Convex + Better Auth
(`@convex-dev/better-auth` 0.12 + `better-auth` 1.6).

L'intégration met en jeu plusieurs contraintes non triviales qui
nécessitent des décisions explicites.

### Contraintes techniques

1. **Convex sépare deux hosts par déploiement** :
   - `*.convex.cloud` (API client : queries/mutations/actions via SDK)
   - `*.convex.site` (HTTP actions : routes déclarées via `http.route`)

   Toutes les routes OIDC (`/api/auth/*`) sont des HTTP actions →
   uniquement servies par le host `.convex.site`.

2. **`@convex-dev/better-auth` namespace ses routes sous
   `/api/auth/convex/*`** (préfixe forcé, non configurable) :
   - Discovery exposé sous `/api/auth/convex/.well-known/openid-configuration`
   - JWKS exposé sous `/api/auth/convex/jwks`
   - **NB** : les routes `oidcProvider` standards (`/oauth2/*`) restent à
     la racine `/api/auth/oauth2/*`, donc on a un mélange asymétrique
     qu'il faut documenter pour les RP.

3. **Better Auth marque le discovery endpoint comme `HIDE_METADATA = { scope: "server" }`** :
   l'endpoint `getOpenIdConfig` existe mais n'est pas routé HTTP par
   défaut. C'est `@convex-dev/better-auth` qui re-expose le discovery
   via son propre wrapper… mais avec une instance interne d'`oidcProvider`
   **sans `useJWTPlugin: true`**, ce qui annonçait `HS256` alors qu'on
   signe en RS256 via le plugin `jwt`.

4. **Better Auth `getMetadata`** suppose `issuer = ctx.context.options.baseURL`,
   donc tend à publier des paths internes plutôt que le host racine.
   On veut le host racine (`https://site.identite.ga`).

5. **Le NIP** (Numéro d'Identification Personnel, 14 chiffres) est stocké
   dans notre table `userProfile.pivot.nip` (côté Convex applicatif), pas
   dans la table `user` du composant Better Auth. Les claims standards
   Better Auth (`name`, `email`, `picture`) ne suffisent donc pas — il
   faut un mécanisme pour enrichir `/userinfo`.

6. **Better Auth dérive `given_name`/`family_name` via
   `name.split(" ")`** dans le handler `/userinfo`. Faux dès qu'il y a
   un nom composé ("Aïssatou Mboumba Ndong") — on veut les vraies valeurs
   pivot.

### Contraintes produit

- Les apps tierces doivent pouvoir intégrer IDN en deux lignes
  via `@idn-ga/better-auth` (helper genericOAuth).
- Le discovery doit être 100 % conforme RFC pour permettre l'usage de
  clients OIDC autres que Better Auth (jose, oidc-client-ts, etc.).
- Les RP doivent pouvoir typer les claims étendus IDN
  (`given_name`, `family_name`, `birthdate`, `nationality`, `profile_type`,
  `acr`, `loa`, `nip`).
- Le NIP doit être exposé pour permettre aux RP de prouver l'identité
  RBPP (cf. cahier §3.2 — collecte au signup).

## Décision

### D1 — Custom domains Convex prod, split api/site

Configuration dans le dashboard Convex (déploiement `harmless-chameleon-734`) :

| Sous-domaine | Cible Convex | Rôle |
|---|---|---|
| `api.identite.ga` | `*.convex.cloud` | Convex API client (SDK) |
| `site.identite.ga` | `*.convex.site` | HTTP actions (OIDC + webhooks) |

Override d'env vars Convex pour que `CONVEX_CLOUD_URL = https://api.identite.ga`
et `CONVEX_SITE_URL = https://site.identite.ga`. Better Auth dérive
ainsi `baseURL` correctement.

### D2 — Custom handler discovery dans `http.ts`

`http.route({ path: "/api/auth/convex/.well-known/openid-configuration", method: "GET", handler })`
prend la priorité sur le `pathPrefix: "/api/auth/"`. Le handler :

1. Call `auth.api.getOpenIdConfig({ asResponse: false })` pour obtenir
   le JSON généré par l'instance interne `oidcProvider` du composant
   Convex.
2. Patche les champs incorrects :
   - `id_token_signing_alg_values_supported: ["RS256"]` (la signature
     est en RS256 via le plugin `jwt`).
   - `acr_values_supported: ["eidas1", "eidas2", "eidas3"]` (au lieu
     des URN incommon par défaut).
   - `claims_supported` étendu avec les claims IDN.
3. Re-sert le JSON patché.

L'instance externe `oidcProvider({ useJWTPlugin: true })` qu'on déclare
dans `auth.ts` reste utile pour les routes `/oauth2/*` (authorize, token,
userinfo, register, consent, endsession).

### D3 — Custom handler `/oauth2/userinfo` dans `http.ts`

Pour exposer les claims étendus IDN (incluant le NIP) :

1. Délègue la validation Bearer à Better Auth (`auth.api.oAuth2userInfo({
   request, headers, asResponse: true })`). Tout 401/403 est renvoyé tel
   quel — pas de logique d'auth en double.
2. Si 200, parse le JSON, lookup `userProfile` via
   `internal.profile.getForUserinfo(userId)` (internalQuery dédiée qui
   n'expose que les champs nécessaires).
3. Enrichit les claims sous scope `profile` :
   - `given_name` = `pivot.firstName`
   - `family_name` = `pivot.lastName`
   - `birthdate` = `pivot.dateOfBirth`
   - `nationality` = `pivot.nationality`
   - `profile_type` = profil IDN (citizen / resident / visitor / developer)
   - `loa` = niveau LoA numérique (1/2/3)
   - `acr` = `eidas{loa}` (mapping standard eIDAS)
   - `nip` = `pivot.nip` (uniquement si présent)
4. Re-sert.

### D4 — Issuer = host racine (pas le baseURL Better Auth)

Le discovery annonce `issuer: "https://site.identite.ga"` (forcé par
`@convex-dev/better-auth` via son `metadata.issuer` override interne).

### D5 — NIP exposé sous scope `profile`, sans scope dédié pour la V1

**Pas** de scope `nip` séparé pour le moment. Toute app OAuth approuvée
qui demande le scope standard `profile` recevra le NIP dans `/userinfo`
si le citoyen en a un.

**À reconsidérer** si feedback négatif côté RGPD (citoyens qui veulent
un consent screen séparé pour le NIP). Migration possible : introduire
un scope `nip`, déprécier l'exposition automatique, faire migrer les RP.

## Conséquences

### Positives

- **Discovery 100 % conforme RFC** : un client OIDC générique (Better Auth
  ou autre) peut consommer IDN sans hack.
- **Claims étendus découvrables** : les RP voient dans `claims_supported`
  ce qu'ils peuvent attendre de `/userinfo`.
- **Source de vérité unique pour le NIP** : `userProfile.pivot.nip`,
  pas de duplication entre tables Better Auth et applicatives.
- **`given_name`/`family_name` corrects** même pour les noms composés
  (qui sont la règle au Gabon).

### Négatives / dette

- **Bypass partiel de `@convex-dev/better-auth`** : on intercepte deux
  routes (`/convex/.well-known/openid-configuration`, `/oauth2/userinfo`)
  que le composant Convex est censé servir. À re-évaluer si une release
  upstream corrige (a) la propagation `useJWTPlugin: true` au discovery,
  (b) l'accès au `ctx` côté `getAdditionalUserInfoClaim`.
- **Lecture DB supplémentaire** à chaque `/userinfo` (lookup
  `userProfile`). Acceptable : `/userinfo` n'est pas un hot path (appelé
  une fois par session côté RP), et la query est indexée
  (`by_userId`).
- **Le NIP est largement exposé** : tout client OAuth approuvé voit le
  NIP du citoyen. Si Apple / l'autorité de protection des données
  flagge, prévoir migration vers scope `nip` (cf. D5).
- **Mélange asymétrique** des préfixes (`/api/auth/convex/.well-known/...`
  pour le discovery mais `/api/auth/oauth2/...` pour les autres routes
  OIDC). Documenté à destination des RP dans le portail développeur.

## Alternatives écartées

- **A1 : Repointer `api.identite.ga` sur `*.convex.site`**
  Aurait évité l'introduction de `site.identite.ga`, mais aurait cassé
  toutes les apps internes qui appellent l'API Convex via le SDK
  (websocket inclus). Refusé.

- **A2 : Reverse-proxy Cloudflare Worker** qui forward
  `identite.ga/api/auth/*` vers `*.convex.site/api/auth/*`
  Préserve l'apparence "même domaine" pour les RP mais ajoute une couche
  fragile et un coût Cloudflare. Refusé pour la V1.

- **A3 : Ajouter `nip` aux `user.additionalFields` Better Auth**
  Permettrait à `getAdditionalUserInfoClaim` d'y accéder via `user.nip`
  sans lookup. Mais nécessite de synchroniser le NIP entre la table user
  Better Auth et `userProfile` à chaque update. Risque de drift.
  Refusé au profit du lookup direct via `userProfile`.

- **A4 : Patcher Better Auth en monkey-patch**
  Force la propagation de `useJWTPlugin: true` au getMetadata interne du
  composant. Sale, dépendant des internes Better Auth, casse à chaque
  release upstream. Refusé.

- **A5 : Scope `nip` dédié dès la V1**
  Plus RGPD-friendly, mais nécessite que tous les RP (à commencer par
  Digitalium / Gabon Connect) mettent à jour leur intégration en
  ajoutant `"nip"` à `scopes`. Reporté à la V2 (après feedback prod).

## Suivi

- Discovery prod : `https://site.identite.ga/api/auth/convex/.well-known/openid-configuration`
- Code : [`packages/backend/convex/http.ts`](../../packages/backend/convex/http.ts), [`packages/backend/convex/auth.ts`](../../packages/backend/convex/auth.ts), [`packages/backend/convex/profile.ts`](../../packages/backend/convex/profile.ts)
- SDK npm : `@idn-ga/better-auth@^0.2.0`, `@idn-ga/core@^0.2.0`
- Commits initiaux : `743e7f8` (D1+D2 RS256), commit suivant (D3+D5 userinfo)
