# apps/admin — Console super-administrateur IDN

Application Next.js 16 destinée au sous-domaine `admin.identite.ga`.
Backend Convex partagé avec `apps/web` (mêmes comptes Better Auth).

## Développement local

```bash
# 1. Variables d'env (apps/admin/.env.local)
cp .env.example .env.local
# Renseigner NEXT_PUBLIC_CONVEX_URL + NEXT_PUBLIC_CONVEX_SITE_URL
# (mêmes valeurs que apps/web/.env.local)

# 2. Backend Convex (depuis la racine du monorepo)
bun --filter @repo/backend dev

# 3. App admin (port 3001)
bun --filter admin dev
```

Ouverture : <http://localhost:3001>

## Créer un compte super-administrateur de test

Le rôle `admin` ne peut pas être obtenu via inscription publique
(cf. ADR-0005). Pour le premier compte de test, utilisez le script :

```bash
bunx convex run scripts/createAdminUser:run \
  '{"email":"admin@test.identite.ga","password":"Admin1234!@#$","name":"Admin Système"}'
```

Idempotent — relancer la commande sur un email existant ne crée pas de
doublon et garantit simplement la présence du rôle `admin` actif.

> ⚠️ La mutation est protégée : elle refuse de s'exécuter quand
> `NODE_ENV === "production"`.

## Architecture

- `app/(auth)/sign-in` — page de connexion super-admin.
- `app/(console)/*`    — espace authentifié (RoleGate admin via layout).
- `app/_components/`   — `OpShell`, `OpHeader`, icônes, sparkline…
- `app/_content/fr.ts` — tous les textes (verbatim des maquettes).
- `app/_mocks/*.ts`    — jeux de données issus des maquettes (V1 : pas de
  câblage Convex pour les listings ; le câblage interviendra dans une
  prochaine phase).

Sources de design (haute fidélité) :
`ressources/interfaces/project/idn-desktop.jsx` lignes 518 → 1822.
