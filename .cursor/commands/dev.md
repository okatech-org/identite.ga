Lance un serveur de developpement d'IDN.

| App | Commande | Port |
|---|---|---|
| portail citoyen | `bun run dev --filter=web` | 3000 |
| console admin | `bun run dev --filter=admin` | 3001 |
| portail developpeur | `bun run dev --filter=developer` | 3002 |
| controleur d'identite | `bun run dev --filter=controller` | 3003 |
| connexion federee OIDC | `bun run dev --filter=connect` | 3004 |
| backend Convex | `bun run dev --filter=@repo/backend` | — |
| mobile (Expo) | `bun run dev --filter=mobile` | — |

⚠️ **`bun run dev` sans filtre lance tout** — sur une machine 16 Go, s'en tenir a
une ou deux apps plus le backend.

⚠️ **`apps/web` est la seule app en Webpack** (`--webpack`) : ses temps de
compilation et ses messages d'erreur ne ressemblent pas a ceux des quatre autres.
Ne pas conclure a une regression sur cette seule base.

## Un flux OIDC complet a besoin de deux surfaces

La page de connexion et la page de consentement sont servies par **`apps/connect`**
(`/sign-in` et `/oauth/authorize`). Tester une connexion depuis `web` ou une app
tierce sans `connect` en vie donne une redirection qui n'aboutit nulle part.

Le backend Convex doit tourner en parallele — sans lui, les fonctions sont
introuvables, ce qui **signifie un deploiement perime, pas une faute de frappe**.

## Variables d'origine

Les origines acceptees viennent de la variable Convex **`TRUSTED_ORIGINS`** (CSV).
En developpement, `localhost`, `127.0.0.1` et `*.local` sont acceptes
dynamiquement — inutile de les declarer.
