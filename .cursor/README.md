# Configuration Cursor — IDENTITE.GA (IDN)

Installee le 2026-09-07. Ouvrir par l'espace de travail commun :
`/Users/okatech/okatech-projects/administration-ga.code-workspace`.

⚠️ **Le `README.md` et le `CLAUDE.md` de la racine ne decrivent pas ce projet** :
le premier est le starter Turborepo par defaut, le second un gabarit generique de
12 regles. La connaissance projet vit dans ces regles, dans `ressources/`, et
dans `apps/admin/README.md` / `apps/mobile/README.md`.

## Regles (`.cursor/rules/`)

| Fichier | Se charge |
|---|---|
| `00-socle.mdc` — structure reelle, ports, ce qui n'existe pas | **toujours** |
| `01-memoire-cortex.mdc` — vault Obsidian | **toujours** |
| `10-convex-backend.mdc` — schema, composants, tests | sur `packages/backend/**` |
| `20-auth-oidc.mdc` — Better Auth, les 11 plugins, OIDC | sur les fichiers d'auth |
| `30-sdk-publics.mdc` — les 3 paquets npm `@idn-ga/*` | sur `packages/sdk/**` |

## Commandes — a taper `/nom`

`/verifier` · `/dev` · `/memoire` · `/memoire-maj` · `/publier-sdk`

## Le fait le plus structurant

**Ce depot est un fournisseur d'identite OIDC**, et il publie trois paquets npm
**publics**. `@idn-ga/better-auth` est consomme par administration.ga
(`04_Socle_transition/administration_ga/convex/betterAuth/auth.ts`).

Le lien passe par une **version npm publiee**, pas par un lien local : une
modification du SDK n'est pas visible chez le consommateur tant qu'elle n'est pas
publiee **et** bumpee la-bas.

## Ce qui n'existe pas ici

Aucun script `test` a la racine, aucune tache `test` dans `turbo.json`, et **pas
de garde-fou automatique sur les PR**. La seule suite executee en CI est celle du
backend, **a l'interieur du job de deploiement**. La verification locale
(`/verifier`) est donc la seule qui existe avant le deploiement.
