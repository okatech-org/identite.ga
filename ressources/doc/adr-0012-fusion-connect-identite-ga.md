# ADR-0012 — Fusion de `connect.identite.ga` dans `identite.ga`

- **Statut** : Accepté
- **Date** : 2026-08-21
- **Décideurs** : équipe IDN
- **Remplace** : [ADR-0010](./adr-0010-multi-apps-auth-cross-domain.md) (topologie à cinq sous-domaines, `connect.identite.ga` retiré)

## Contexte

[ADR-0010](./adr-0010-multi-apps-auth-cross-domain.md) avait posé une topologie à cinq apps Next.js sur cinq sous-domaines (`identite.ga`, `admin.identite.ga`, `developers.identite.ga`, `controllers.identite.ga`, `connect.identite.ga`), toutes rattachées au même déploiement Convex Better Auth. `apps/connect` hébergeait deux écrans sur `connect.identite.ga` : le formulaire de connexion et l'écran de consentement OAuth/OIDC (`/oauth/authorize`) présenté aux applications partenaires. Le choix d'un domaine dédié pour ces deux écrans visait à séparer l'espace « citoyen » (`identite.ga`) de l'espace « autorisation d'accès tiers ».

Ce découpage entrait en collision avec le protocole OAuth/OIDC lui-même. L'étape `/authorize` de l'Authorization Code Flow est atteinte par une **navigation plein écran** du navigateur (redirection HTTP suivie d'un `GET`), pas par un appel `fetch`/XHR : elle ne transporte que les cookies posés sur le domaine visé, jamais de `localStorage` ni d'en-tête `Authorization: Bearer` d'une autre origine. Le mécanisme `crossDomain` mis en place par l'ADR-0010 (session répliquée en `localStorage` + Bearer token) fonctionne pour les appels applicatifs faits en JavaScript, mais ne peut rien pour une navigation top-level : un usager déjà connecté sur `identite.ga` qui atterrissait sur `connect.identite.ga` lors d'un `/authorize` n'y avait **aucune session visible**, et `oidcProvider` le renvoyait systématiquement vers l'écran de connexion malgré une session `identite.ga` parfaitement valide. Ce comportement dégradait l'expérience à chaque connexion via une app partenaire.

Un mécanisme de transfert de session cross-domaine (pages `/sso` et `/session-handoff`, jetons de handoff à usage unique et courte durée de vie) avait été construit pour contourner ce problème, ainsi qu'un aller-retour dédié pour le step-up KYC. Ce contournement fonctionnait mais ajoutait de la latence perceptible, du code, et une surface d'attaque supplémentaire (émission/consommation de jetons), sans traiter la cause racine.

## Décision

**Fusionner `connect.identite.ga` dans `identite.ga`.** `apps/connect` est supprimée. Ses deux écrans migrent dans `apps/web` :
- le formulaire de connexion, dans `apps/web/app/(auth)/sign-in/page.tsx` (existant, enrichi du flux fédéré) ;
- l'écran de consentement OAuth, dans `apps/web/app/oauth/authorize/page.tsx`.

Le pivot technique est la réécriture de `authorization_endpoint` dans le document de discovery OIDC. `packages/backend/convex/http.ts` (handler `oidcDiscoveryHandler`) intercepte la réponse de l'`oidcProvider` interne de Better Auth et remplace uniquement ce champ :

```ts
authorization_endpoint: `${siteUrl()}/api/auth/oauth2/authorize`,
```

où `siteUrl()` lit `SITE_URL` (désormais `https://identite.ga`). Les variables Convex sont alignées en conséquence : `IDN_LOGIN_PAGE=https://identite.ga/sign-in`, `IDN_CONSENT_PAGE=https://identite.ga/oauth/authorize`, `SITE_URL=https://identite.ga`, `TRUSTED_ORIGINS` sans `connect.identite.ga`.

**Seul `authorization_endpoint` est réécrit.** C'est le seul endpoint OIDC traversé par une navigation de navigateur porteuse de cookie — c'est donc le seul qui doit se trouver sur le domaine qui porte la session. `token_endpoint`, `jwks_uri` et `userinfo_endpoint` sont back-channel : appelés serveur à serveur par l'application partenaire (ou par le SDK, qui détient déjà le code ou l'access token), authentifiés par `client_secret` ou par Bearer token — jamais par un cookie de navigateur. Les déplacer n'aurait aucun effet correctif et casserait sans raison les intégrations qui les appellent directement.

**`issuer` reste `https://site.identite.ga`, inchangé.** C'est la valeur du claim `iss` de tous les ID tokens déjà émis, et chaque partenaire intégré la valide (souvent en dur ou via une copie mise en cache de la discovery). La faire pointer vers `identite.ga` invaliderait la vérification d'`iss` chez tous les partenaires en production sans le moindre bénéfice, puisqu'aucune navigation de navigateur ne cible jamais `issuer` directement — l'URL de discovery elle-même reste également sur l'origine Convex.

**Passkeys : un seul domaine d'authentification, `identite.ga`.** `PASSKEY_RP_ID` reste `identite.ga` (déjà le cas avant cette bascule). `PASSKEY_RP_ORIGINS` (Convex) et `associatedDomains` (`apps/mobile/app.json`) ne listent plus `connect.identite.ga`.

Le mécanisme de transfert cross-domaine (`/sso`, `/session-handoff`, jetons de handoff) est supprimé — un seul domaine porte la session, il n'y a plus rien à transférer. Le step-up KYC devient une navigation interne classique vers `/kyc`.

## Alternatives envisagées

1. **Conserver deux domaines et fiabiliser le handoff de session** (cookies cross-subdomain `Domain=.identite.ga`, déjà écarté en Phase 1 par l'ADR-0010 pour sa complexité DNS/certs/dev). Rejeté : même avec des cookies partagés, le problème de fond — un `authorization_endpoint` sur un domaine distinct de celui qui vient d'authentifier l'usager — persiste tant que le navigateur doit naviguer physiquement d'un domaine à l'autre au milieu du flux.
2. **Garder le mécanisme de handoff par jeton comme solution pérenne.** Il fonctionnait, mais contourne le problème au prix d'un aller-retour réseau visible à chaque connexion OAuth, y compris pour un usager déjà connecté, et d'un état supplémentaire à sécuriser (jetons courte durée). Rejeté au profit de la suppression de la cause racine.
3. **Réécrire aussi `issuer`, `token_endpoint`, `jwks_uri` et `userinfo_endpoint` vers `identite.ga`** pour uniformiser toutes les URLs OIDC sous un seul nom. Rejeté : casserait la validation `iss` de tous les partenaires déjà intégrés pour un gain nul, ces endpoints n'étant jamais atteints par une navigation de navigateur.

## Conséquences

**Positives**
- SSO effectif : un usager déjà connecté sur `identite.ga` ne revoit plus l'écran de connexion lors d'un `/authorize` initié par une app partenaire.
- Suppression du mécanisme de handoff (`/sso`, `/session-handoff`, jetons courte durée) : moins de code, moins de surface d'attaque.
- Step-up KYC simplifié en navigation interne vers `/kyc`.
- Un domaine et un service Cloud Run de moins à opérer, certifier et monitorer (cf. [ADR-0011](./adr-0011-deploiement-gcp-cloud-run.md), tableau de mapping des domaines mis à jour).
- Les partenaires qui consomment la discovery OIDC (cas normal, y compris via le SDK `@idn-ga/*`) n'ont **rien** à changer.
- **Les passkeys déjà enrôlées restent valides, sans ré-enrôlement.** Un identifiant WebAuthn est lié au `rpID`, pas à l'origine de la cérémonie : `PASSKEY_RP_ID` valait déjà `identite.ga` avant la bascule, y compris pour les enrôlements effectués depuis `connect.identite.ga` (un `rpID` peut être un suffixe enregistrable du domaine visité). Retirer `connect.identite.ga` de `PASSKEY_RP_ORIGINS` interdit seulement de *démarrer* une cérémonie depuis cette origine — laquelle n'existe plus.

**Négatives**
- Rupture pour les partenaires ayant codé en dur une URL `connect.identite.ga` au lieu de lire `authorization_endpoint` depuis la discovery : ils doivent la remplacer par `identite.ga`.
- Le service Cloud Run `connect` est supprimé : toute automatisation encore branchée dessus (monitoring, DNS, alerting) doit être nettoyée.

**Suivi**
- Vérifier dans les logs 404 applicatifs qu'aucun partenaire sandbox/production n'appelle plus `connect.identite.ga` un mois après bascule ; contacter directement les intégrations repérées.
- Vérifier au premier déploiement que `SITE_URL` est bien positionnée côté Convex : elle pilote désormais `authorization_endpoint`, une valeur absente ferait basculer la discovery sur `http://localhost:3000`.

## Références

- [ADR-0004](./adr-0004-better-auth-oidc.md) — Better Auth comme moteur d'authentification et OIDC
- [ADR-0010](./adr-0010-multi-apps-auth-cross-domain.md) — Auth multi-apps : `crossDomain` + checks 100 % client
- [ADR-0011](./adr-0011-deploiement-gcp-cloud-run.md) — Déploiement Phase 1 sur GCP Cloud Run
- [`packages/backend/convex/http.ts`](../../packages/backend/convex/http.ts) — réécriture de `authorization_endpoint` (`oidcDiscoveryHandler`)
- [`packages/backend/convex/auth.ts`](../../packages/backend/convex/auth.ts) — `loginPage` / `consentPage` / configuration passkey
- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)
