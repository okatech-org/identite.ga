# ADR-0002 — Stack frontend (Next.js 16 + React 19 + Tailwind v4 + shadcn/ui)

- **Statut** : Accepté
- **Date** : 2026-05-09
- **Décideurs** : équipe IDN

## Contexte

Toutes les surfaces utilisateur d'IDN sont des applications web. Le cahier (§5.2, §7) impose : SSR/SEO sur le site public, performance LCP < 2.5 s en 4G simulé, mode clair / sombre obligatoire, identité visuelle gabonaise (vert / jaune / bleu, IBM Plex Sans / Mono), conformité WCAG 2.1 AA et RGAA 4.1.2.

Il faut un cadre productif qui livre vite tout en restant **migrable** vers une cible souveraine (cf. cahier §11) : la couche présentation ne doit pas être verrouillée à un fournisseur d'auth ou de base de données.

## Décision

- **Next.js 16** (App Router) + **React 19** : SSR / RSC / streaming, route groups pour isoler les frontières d'auth (`(public)` / `(auth)` / `(portal)`), type-safe routing. `next/font/google` pour IBM Plex.
- **Tailwind v4** avec `@theme inline` pour exposer les tokens IDN comme variables CSS et utilitaires Tailwind (`bg-idn-green`, `text-idn-blue`, `bg-loa-3`).
- **shadcn/ui** (style `new-york`, base `neutral` remplacée par les tokens IDN) installé dans `packages/ui`. On vendore les composants pour pouvoir les ajuster sans dépendre d'une bibliothèque externe.
- **next-themes** pour le toggle clair / sombre / système, exposé dans le footer.
- **react-hook-form + zod** pour les formulaires, **Sonner** pour les toasts.
- **lucide-react** pour les icônes, sourcées localement (zéro CDN tiers conformément à la CSP stricte de `apps/auth`).
- **IBM Plex Sans / Mono** chargées via `next/font/google` (auto-hébergement par Next.js, conforme à la CSP stricte de `apps/auth`).

## Alternatives envisagées

1. **Remix** — bonne séparation données/UI, mais Next.js a plus d'écosystème, RSC matures, et est plus aligné avec les développeurs gabonais en cours de formation.
2. **SvelteKit** — performance excellente mais le pool de développeurs maîtrisant React est plus large.
3. **Tailwind v3** — préféré v4 pour `@theme inline` (tokens en variables CSS pures), suppression de `tailwind.config.js`, et `@source` pour scanner les composants partagés (cf. ADR à venir sur le scan workspace).
4. **MUI / Chakra** — composants pré-faits mais difficiles à customiser pour respecter le ton institutionnel (pas de gradients, pas d'ombres, RGAA strict). shadcn vendoré donne le contrôle total sur le DOM et les classes.
5. **Polices personnalisées via CDN** — rejeté : la CSP de `apps/auth` interdit toute origine externe. IBM Plex via `next/font` est self-hosted automatiquement.

## Conséquences

**Positives**
- Tokens IDN et primitives (`IdnMark`, `IdnFlagBars`, `LoABadge`) factorisés une fois, consommés par toutes les apps.
- Shadcn vendoré → pas de breaking change forcé par une dépendance UI tierce.
- Light / dark mode + IBM Plex disponibles dès la première itération.
- Migrabilité conservée : les composants UI ne dépendent ni de Convex ni de Better Auth ; on pourra les réutiliser sur la cible Ory + PG (cf. cahier §11).

**Négatives**
- Vendoring shadcn = on hérite des choix de l'auteur (radix-ui, class-variance-authority) et il faut suivre les évolutions manuellement.
- React 19 + Next 16 sont récents — quelques ergonomies CLI / outils tiers ont des bugs occasionnels.
- Tailwind v4 a un scan de sources différent de v3 : il faut un `@source` explicite pour scanner les composants des packages workspace (sans ça, les utilitaires utilisés uniquement dans `packages/ui` ne sont pas générés). Câblé dans `packages/ui/src/styles/globals.css`.

**Suivi**
- Auditer la CSP avant prod (cf. cahier §6.9) — Next 16 inline scripts pour le streaming peuvent nécessiter `unsafe-inline` pour les nonces (à valider).
- Quand `apps/auth` sera créée, dupliquer la config Tailwind avec un set d'utilitaires plus restreint (lockdown).

## Références

- Cahier des charges §5.2 (Stack Phase 1), §7 (Identité visuelle), §10.2 (Performance)
- [Next.js 16 docs](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4)
- [shadcn/ui](https://ui.shadcn.com/)
- ADR-0008 (design tokens sans shadows)
- ADR-0009 (accessibilité)
