# ADR-0003 — Convex comme backend Phase 1 + composants officiels

- **Statut** : Accepté
- **Date** : 2026-05-10
- **Décideurs** : équipe IDN

## Contexte

Phase 1 du cahier (§5.2, §9) : livrer rapidement un MVP avec onboarding L1, OIDC RS256, portail citoyen et console admin de base. Phase 4 (§9, §11) : migration vers une cible souveraine **Ory Kratos + Hydra + PostgreSQL 16 auto-hébergé** au Gabon.

Contraintes Phase 1 :
- Itération rapide, peu de devops à gérer
- Schéma typé fort, mutations transactionnelles
- Real-time pour le dashboard admin (KPI live), workflow durable pour le KYC, file d'emails durable, rate-limiting, agrégats O(log N) pour les comptes
- Migrabilité préservée : exports JSON propres, pas de logique métier verrouillée à un fournisseur

## Décision

Adopter **Convex** comme backend Phase 1, avec **5 composants officiels** déclarés dans `packages/backend/convex/convex.config.ts` :

| Composant | Rôle |
| :--- | :--- |
| `@convex-dev/better-auth` | Tables auth (user, session, oauthApplication, jwks…) isolées dans son namespace, adapter Better Auth |
| `@convex-dev/resend` | File durable d'envoi d'emails, idempotency keys, batching, webhooks delivery / bounce |
| `@convex-dev/rate-limiter` | Quotas transactionnels (8 buckets configurés selon §6.6 : signIn 10/min/IP, signUp 5/h/IP, OTP 3/h/user, oauthToken 60/min/client, etc.) |
| `@convex-dev/aggregate` | KPIs admin O(log N) : `usersByLoa`, `usersByProfile`, `kycByStatus`, `auditByCategory` |
| `@convex-dev/workflow` | Pipeline KYC L2 durable (OCR → biométrie → décision auto / revue manuelle) avec retry exponentiel |

Schéma applicatif IDN dans `packages/backend/convex/schema.ts` — 9 tables métier qui complètent celles de Better Auth :

`userProfile`, `kycRequest`, `kycReview`, `auditLog`, `notification`, `notificationPreference`, `userPreference`, `userDocument`, `userRole`, `contactRequest`.

Toutes les tables Better Auth (`user`, `session`, `account`, `oauthApplication`, `oauthConsent`, `oauthAccessToken`, `verification`, `twoFactor`, `jwks`) sont **isolées dans le composant `betterAuth`** — pas redéfinies dans le schéma applicatif. On y accède via `authComponent.getAuthUser(ctx)`.

## Alternatives envisagées

1. **Démarrer directement sur Ory + PostgreSQL** — rejeté : trop d'infra à monter avant de pouvoir itérer (Hydra, Kratos, PG, OpenBao, observabilité). On perdrait 2-3 mois de dev frontend / fonctionnel pendant que l'équipe assemble la stack.
2. **Supabase** — bon DX mais l'écosystème de composants intégrés (workflow durable, rate limiter, aggregate, mailing typé) est moins riche qu'avec Convex.
3. **Firebase + Cloud Functions** — verrouillage Google, pas de SSR-friendly Convex-style, et les exports sont moins propres pour la migration vers PG.
4. **Stack maison (Node + PG + Redis + BullMQ)** — réinvente la roue ; le cahier dit explicitement de cibler une « livraison rapide » Phase 1.

## Conséquences

**Positives**
- Onboarding citoyen (5 étapes) opérationnel en quelques heures grâce aux composants tout-prêts.
- Audit log signé HMAC-SHA256 avec primitives Convex `crypto.subtle`.
- Workflow KYC déjà câblé en scaffold (Phase 1 stubs OCR / biométrie ; Phase 2 = Smile ID).
- Convex Dashboard pour inspecter les tables, requêtes, logs en dev.
- Rate-limiter transactionnel : si une mutation échoue, le quota n'est pas consommé.

**Négatives**
- Couplage à Convex côté code applicatif. Pour préserver la migrabilité, on s'astreint à :
  - Aucun appel `useQuery` directement dans la logique métier ; toujours via mutations / queries déclarées.
  - Aucune dépendance à des features Convex sans équivalent SQL standard (ex : transactions cross-tables OK ; subscriptions live = à découpler avec un adapter).
- Apprentissage de la frontière composant : les IDs traversent en `v.string()`, pas de `ctx.auth` ni `process.env` dans les composants — discipline à tenir.
- Tarification SaaS Convex versus auto-hébergé. Acceptable Phase 1 (volume MVP) ; Phase 4 bascule sur PG souverain.

**Suivi**
- À chaque migration Phase 4 : exports JSON par table, scripts de remise en forme vers le schéma PG/Kratos. Préparer un dossier `migrations-phase4/` avec un mapping table-à-table commenté.
- Mesurer les coûts Convex au-delà de 10 000 utilisateurs et anticiper la bascule.
- ADR de migration à écrire au moment T (ce sera l'ADR « Migration backend vers Ory + PG »).

## Références

- Cahier des charges §5.2 (Stack Phase 1), §5.6 (Modèle de données), §9 (Phases), §11 (Migration souveraine)
- `ressources/stack-technique.md` (détails composants Convex)
- ADR-0004 (Better Auth)
- ADR-0005 (RBAC via userRole)
