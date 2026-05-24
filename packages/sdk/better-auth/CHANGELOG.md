# @idn-ga/better-auth

## 0.2.0

### Minor Changes

- [`743e7f8`](https://github.com/okatech-org/identite.ga/commit/743e7f82852755ec99855bb2407968127d9a7a7d) Thanks [@okafrancois](https://github.com/okafrancois)! - Fix : URL discovery OIDC par défaut pointait sur `https://identite.ga` (site vitrine, sans serveur OIDC) → toute intégration sans override `discoveryUrl` plantait au démarrage du flow OAuth.

  Le défaut pointe désormais sur `https://site.identite.ga/api/auth/convex/.well-known/openid-configuration` — custom domain HTTP Actions du déploiement Convex prod IDN, avec le namespace `/api/auth/convex/*` du composant `@convex-dev/better-auth`.

  `DEFAULT_ISSUER` passe de `https://identite.ga` à `https://site.identite.ga`. Les apps qui overrident déjà `issuer` + `discoveryUrl` ne sont pas impactées.

## 0.1.1

### Patch Changes

- [`8cd3f0d`](https://github.com/okatech-org/identite.ga/commit/8cd3f0d252fec149cb860a893796d290c2edf9fe) Thanks [@okafrancois](https://github.com/okafrancois)! - Setting up ci deploy
