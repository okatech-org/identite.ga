---
"@idn-ga/better-auth": minor
"@idn-ga/core": minor
"@idn-ga/react": patch
---

Fix : URL discovery OIDC par défaut pointait sur `https://identite.ga` (site vitrine, sans serveur OIDC) → toute intégration sans override `discoveryUrl` plantait au démarrage du flow OAuth.

Le défaut pointe désormais sur `https://site.identite.ga/api/auth/convex/.well-known/openid-configuration` — custom domain HTTP Actions du déploiement Convex prod IDN, avec le namespace `/api/auth/convex/*` du composant `@convex-dev/better-auth`.

`DEFAULT_ISSUER` passe de `https://identite.ga` à `https://site.identite.ga`. Les apps qui overrident déjà `issuer` + `discoveryUrl` ne sont pas impactées.
