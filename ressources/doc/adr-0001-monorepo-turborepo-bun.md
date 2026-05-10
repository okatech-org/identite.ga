# ADR-0001 — Structure monorepo (Turborepo + Bun)

- **Statut** : Accepté
- **Date** : 2026-05-09
- **Décideurs** : équipe IDN

## Contexte

La plateforme IDN doit livrer plusieurs surfaces : site public (`idn.ga`), application d'authentification fédérée (`connexion.idn.ga`), portail développeur, console admin, espace contrôleur, plus une documentation publique du SDK et le SDK lui-même destiné aux applications consommatrices. Le cahier (§5.1) prescrit une décomposition multi-app.

Plusieurs de ces surfaces partagent : design tokens IDN, composants UI, schéma Convex, types TypeScript, configuration ESLint / TypeScript, fonctions utilitaires.

## Décision

Adopter un **monorepo Turborepo géré par Bun**, avec deux espaces de travail :

```
apps/
├── web/      Next.js 16 — idn.ga (site public + portail + consoles)
├── auth/     Next.js 16 — connexion.idn.ga (futur)
└── docs/     Next.js 16 — documentation publique SDK
packages/
├── ui/                    Composants partagés (shadcn + primitives IDN)
├── backend/               Schéma + fonctions Convex
├── eslint-config/         Configurations ESLint (base, next, react-internal)
└── typescript-config/     tsconfig de base partagés
```

- **Bun** comme gestionnaire de paquets et runtime de scripts (workspace `apps/*` + `packages/*`).
- **Turborepo** pour l'orchestration des tâches (`dev`, `build`, `lint`, `check-types`) avec cache local et déduplication.
- **shadcn/ui** installé dans `packages/ui` (style `new-york`, base `neutral` puis tokens IDN), consommé via `@repo/ui/components/*`.
- **Convex** isolé dans `packages/backend` ; `apps/web` importe via `@repo/backend/convex/_generated/api`.

## Alternatives envisagées

1. **pnpm workspaces** — équivalent Turborepo + pnpm. Bun a été préféré pour sa vitesse d'install et l'unification gestionnaire/runtime (un seul outil).
2. **Polyrepo (un repo par app)** — rejeté : duplication des design tokens, divergence des composants UI entre site public et console admin, surcoût de coordination versions.
3. **Nx** — plus puissant mais plus lourd à apprendre ; Turborepo suffit pour la cardinalité actuelle (3 apps + 4 packages).
4. **Single Next.js app avec route groups** — rejeté : `apps/auth` doit avoir sa propre CSP très stricte (cf. cahier §6.9), des analytics indépendants et un cycle de déploiement séparé. Imposer une app monolithe est incompatible avec la frontière de sécurité.

## Conséquences

**Positives**
- Un seul `bun install` à la racine pour tout le monorepo.
- Cache Turborepo : `bun run check-types` ré-exécute uniquement les packages modifiés.
- Versions de dépendances unifiées (React 19, Next 16, Convex 1.38) — moins de drift.
- Refactor de l'UI partagée propagé instantanément aux apps consommatrices.
- Apps séparées en runtime → chacune peut avoir sa CSP, son sous-domaine, son analytics.

**Négatives**
- Build CI plus long que polyrepo (mais rattrapé par le cache Turborepo).
- Bun est un écosystème plus jeune que pnpm — quelques outils tiers ont des incompatibilités occasionnelles (résolues au cas par cas).
- Onboarding développeur : il faut comprendre `--filter=<workspace>` dès le départ.

**Suivi**
- Migrer vers Turborepo Cloud (cache distant) si le CI dépasse 2 min.
- Ajouter un workspace `apps/auth` dès qu'on bascule l'auth sur `connexion.idn.ga`.

## Références

- [Turborepo docs](https://turbo.build/repo/docs)
- [Bun workspaces](https://bun.sh/docs/install/workspaces)
- Cahier des charges §5.1 (Monorepo)
