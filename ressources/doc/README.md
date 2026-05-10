# Documentation IDN — Décisions techniques (ADR)

Ce dossier rassemble les **Architecture Decision Records (ADR)** de la plateforme **Identité Numérique du Gabon**. Chaque ADR documente une décision structurante, son contexte, les alternatives envisagées, et ses conséquences.

## Format

Les ADR suivent un gabarit léger inspiré de Michael Nygard :

```
# ADR-NNNN — Titre
- Statut : Proposé / Accepté / Déprécié / Remplacé par ADR-XXXX
- Date : YYYY-MM-DD
- Décideurs : équipe IDN

## Contexte
## Décision
## Alternatives envisagées
## Conséquences (positives / négatives / suivi)
## Références
```

## Index

| ID | Titre | Statut |
| :--- | :--- | :--- |
| [ADR-0001](./adr-0001-monorepo-turborepo-bun.md) | Structure monorepo (Turborepo + Bun) | Accepté |
| [ADR-0002](./adr-0002-stack-frontend.md) | Stack frontend (Next.js 16 + Tailwind v4 + shadcn) | Accepté |
| [ADR-0003](./adr-0003-convex-backend-phase1.md) | Convex comme backend Phase 1 + composants officiels | Accepté |
| [ADR-0004](./adr-0004-better-auth-oidc.md) | Better Auth comme moteur d'authentification et OIDC | Accepté |
| [ADR-0005](./adr-0005-rbac-userrole-table.md) | RBAC via table `userRole` (plugin admin Better Auth retiré) | Accepté |
| [ADR-0006](./adr-0006-session-au-signup.md) | Session créée au sign-up + `requireVerifiedAuth` côté métier | Accepté |
| [ADR-0007](./adr-0007-urls-anglais-contenu-francais.md) | URLs en anglais, contenu en français | Accepté |
| [ADR-0008](./adr-0008-design-tokens-sans-shadows.md) | Design tokens IDN sans ombres portées | Accepté |
| [ADR-0009](./adr-0009-accessibilite-rgaa.md) | Accessibilité conforme RGAA 4.1.2 / WCAG 2.1 AA | Accepté |

## Quand écrire un nouvel ADR

- Choix d'une technologie ou d'un framework (front, back, infra)
- Pattern architectural transversal (auth, RBAC, i18n, observabilité…)
- Convention qui s'applique à plusieurs équipes / repos
- Décision avec contraintes légales ou de sécurité
- Tout choix dont la réversibilité serait coûteuse

## Source d'inspiration

- [Michael Nygard — Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [adr.github.io](https://adr.github.io/)
