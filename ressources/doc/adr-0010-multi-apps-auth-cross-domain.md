# ADR-0010 — Auth multi-apps : `crossDomain` + checks 100 % client

- **Statut** : Remplacé par ADR-0012
- **Date** : 2026-05-11
- **Décideurs** : équipe IDN

## Contexte

L'IDN expose cinq apps Next.js sur des sous-domaines distincts en prod (`identite.ga`, `admin.identite.ga`, `developers.identite.ga`, `controllers.identite.ga`, `connect.identite.ga`) et des ports distincts en dev (3000 → 3003 + connect). Toutes ces apps partagent le **même** déploiement Convex Better Auth (`pleasant-platypus-379.eu-west-1.convex.site`).

La configuration initiale présentait deux problèmes :

1. **Configuration figée par app** — chaque `auth-client.ts` posait `baseURL: process.env.NEXT_PUBLIC_SITE_URL` et le backend hardcodait une liste de `trustedOrigins`. Conséquence : impossible de tester sur un nouveau port `.local` sans rebuild, et la liste devait être maintenue en deux endroits.
2. **Auth checks en Server Components** — les layouts protégés et plusieurs pages SSR appelaient `auth.isAuthenticated()` / `auth.fetchAuthQuery()` via le wrapper `convexBetterAuthNextJs`. Côté Convex, les requêtes auth sont proxifiées via un handler Next.js (`/api/auth/[...all]`) qui réécrit les cookies `__Secure-` pour permettre `http://localhost` en dev. Cette réécriture cassait la convention de nommage attendue par `convexBetterAuthNextJs.getToken()` côté serveur : `getToken()` retournait `undefined`, donc `isAuthenticated()` retournait `false`, donc l'utilisateur authentifié était systématiquement renvoyé sur `/sign-in?redirect_to=/dashboard` malgré une session côté client parfaitement valide.

Le projet sœur `gabon-diplomatie` (Convex + Better Auth, même topologie multi-apps) avait déjà résolu ces deux points en utilisant :
- Le plugin `crossDomain` côté backend + `crossDomainClient` côté apps (mécanisme officiel `@convex-dev/better-auth` pour les contextes où le client et Better Auth tournent sur des domaines différents).
- Des **layouts/pages 100 % Client Components** qui vérifient l'auth via `useConvexAuth()` (`convex/react`).

## Décision

### 1. Plugin `crossDomain` côté backend ([packages/backend/convex/auth.ts](../../packages/backend/convex/auth.ts))

```ts
plugins: [
  // 1. crossDomain — siteUrl dérivé du header Origin de la requête.
  //    Permet au crossDomainClient côté browser d'enregistrer la session
  //    via localStorage et de la renvoyer via Authorization: Bearer.
  crossDomain({ siteUrl: resolveSiteUrl(requestOrigin) }),

  // ...autres plugins (emailOTP, twoFactor, haveIBeenPwned, oauthProvider, jwt)...

  // En DERNIER : convex({ authConfig }) — expose /api/auth/convex/token
  //    consommé par ConvexBetterAuthProvider pour récupérer le JWT.
  convex({ authConfig }),
],
```

`baseURL` reste fixe (`process.env.CONVEX_SITE_URL`) — c'est lui qui fixe `iss` dans les JWT que Convex valide. Le `siteUrl` dynamique du plugin `crossDomain` sert uniquement à rewriter les redirects OAuth/OIDC vers l'origin de l'app appelante.

Le passage de l'origin se fait via `http.ts` qui enregistre manuellement le `pathPrefix /api/auth/` :

```ts
const authRequestHandler = httpAction(async (ctx, request) => {
  const origin = request.headers.get("origin")
  const auth = createAuth(ctx, origin)
  return await auth.handler(request)
})
```

**Ordre des plugins (important)** : avec `@convex-dev/better-auth@0.12.x`, `convex()` doit être enregistré **après** `crossDomain()`. Inverser l'ordre rend `/api/auth/convex/token` indisponible (404), ce qui casse `useConvexAuth()`.

### 2. `crossDomainClient` côté apps ([apps/*/lib/auth-client.ts](../../apps/web/lib/auth-client.ts))

```ts
const SITE_URL =
  typeof window !== "undefined" ? window.location.origin : undefined

export const authClient = createAuthClient({
  baseURL: SITE_URL || undefined,
  plugins: [convexClient(), crossDomainClient()],
})
```

- `baseURL` est dérivée de `window.location.origin` au runtime — plus de variable d'env `NEXT_PUBLIC_SITE_URL` par app.
- `crossDomainClient()` intercepte le `set-auth-jwt` retourné par Better Auth et stocke session + JWT dans `localStorage` (`better-auth_session_data`, `better-auth_cookie`). Sur les requêtes suivantes, le plugin renvoie le tout via `Authorization: Bearer`.

Strictement identique dans `web`, `admin`, `developer`, `controller`, `connect`.

### 3. Proxy manuel `/api/auth/[...all]/route.ts`

Remplace `convexBetterAuthNextJs(...).handler` par un proxy `fetch` direct vers `CONVEX_SITE_URL`. En dev, il strip le préfixe `__Secure-` et le flag `;Secure` des `Set-Cookie` pour que le navigateur les accepte sur `http://localhost`.

### 4. Auth checks 100 % côté client

**Tous** les layouts/pages qui gateaient l'accès via `isAuthenticated()` SSR ont été convertis en Client Components avec `useConvexAuth()` + `useQuery()` :

| Fichier | Garde |
|---|---|
| [apps/web/app/(citizen)/layout.tsx](../../apps/web/app/(citizen)/layout.tsx) | session active |
| [apps/admin/app/page.tsx](../../apps/admin/app/page.tsx) | redirige sign-in/dashboard |
| [apps/admin/app/(console)/layout.tsx](../../apps/admin/app/(console)/layout.tsx) | session + rôle `admin` |
| [apps/admin/app/(console)/{dashboard,users,apps,roles,providers,logs,apps/[id]}/page.tsx](../../apps/admin/app/(console)/dashboard/page.tsx) | `useQuery` à la place de `fetchAuthQuery` |
| [apps/controller/app/page.tsx](../../apps/controller/app/page.tsx) | session + rôle `identity_controller` |
| [apps/controller/app/(private)/layout.tsx](../../apps/controller/app/(private)/layout.tsx) | session + rôle `identity_controller` |
| [apps/developer/app/(developer)/layout.tsx](../../apps/developer/app/(developer)/layout.tsx) | session |
| [apps/developer/app/(public)/page.tsx](../../apps/developer/app/(public)/page.tsx) | redirect si déjà connecté |
| [apps/connect/app/oauth/authorize/page.tsx](../../apps/connect/app/oauth/authorize/page.tsx) | session + écran de consent OAuth |

Pattern type (extrait de [(citizen)/layout.tsx](../../apps/web/app/(citizen)/layout.tsx)) :

```tsx
"use client"
const { isAuthenticated, isLoading } = useConvexAuth()
const router = useRouter()

useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.replace("/sign-in?redirect_to=/dashboard")
  }
}, [isLoading, isAuthenticated, router])

if (isLoading || !isAuthenticated) return <div className="min-h-svh bg-background" />
return <ProtectedContent />
```

Les helpers `convex/nextjs#fetchQuery` côté serveur deviennent inutiles. Les fichiers `apps/*/lib/auth-server.ts` et `apps/admin/lib/data.ts` sont supprimés.

### 5. `TRUSTED_ORIGINS` en variable d'environnement Convex

Plus de liste hardcodée. La fonction `parseTrustedOrigins()` lit uniquement `process.env.TRUSTED_ORIGINS` (CSV). Set via :

```bash
bunx convex env set TRUSTED_ORIGINS "https://identite.ga,https://admin.identite.ga,https://connect.identite.ga,https://developers.identite.ga,https://controllers.identite.ga,http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003"
```

En dev (`NODE_ENV !== "production"`), la fonction `trustedOrigins` côté Better Auth accepte aussi dynamiquement tout `localhost` / `127.0.0.1` / `*.local` venant du header `Origin`.

## Alternatives envisagées

1. **Cookies cross-subdomain** (`Domain=.identite.ga`) pour partager une session unique entre toutes les apps — plus complexe (DNS, certs wildcard, dev en `*.local`), va au-delà de ce que fait gabon-diplomatie. Reporté en Phase 2.
2. **Conserver les auth checks en Server Components** + patcher `convexBetterAuthNextJs` pour qu'il accepte les cookies réécrits par le proxy — Better Auth ne nous laisse pas configurer le préfixe attendu. Rejeté.
3. **Désactiver le strip de `__Secure-` dans le proxy** + utiliser HTTPS en local (mkcert) — augmente la friction de l'environnement de dev, et le problème SSR resterait dès qu'on tournerait derrière un proxy qui ne forwarde pas un cookie spécifique.
4. **Hardcoder `siteUrl` côté `crossDomain`** au lieu de dériver l'origin par requête — casse les redirects OAuth/OIDC quand une app tierce passe par `connect.identite.ga`.

## Conséquences

**Positives**
- L'utilisateur reste authentifié de bout en bout : sign-in → header peuplé → dashboard rendu sans redirect parasite.
- Une seule source de vérité pour les `trustedOrigins` (env Convex).
- Aucune variable d'env par app pour `SITE_URL` — `window.location.origin` au runtime.
- L'ajout d'une nouvelle app revient à : `cp -r apps/web/lib apps/admin/lib`, idem pour `app/api/auth/[...all]/route.ts`, idem pour `providers.tsx`. Plus de tunnel SSR à dupliquer.
- Plus aucun usage de `convexBetterAuthNextJs` ni de `fetchAuthQuery` SSR — le poids du package est éliminé du bundle serveur.

**Négatives**
- **Flash de chargement** sur les routes protégées : le client doit attendre `useConvexAuth().isLoading === false` avant de gater. Mitigé par un wrapper neutre `<div className="min-h-svh bg-background" />`. Acceptable car le check n'est jamais bloquant (la session est en localStorage).
- Pas de protection SSR : un attaquant peut charger le HTML de `/dashboard` sans session — il ne verra que le squelette vide, **mais** aucune donnée sensible n'est exposée puisque les `useQuery` sont gatés par `isAuthenticated`. Le rendu serveur ne fait aucun fetch authentifié.
- En dev, les cookies sont partagés entre `localhost:3000` et `localhost:3001` (cookies scopés par host, pas par port) — ça fait passer involontairement la session d'admin sur web et inversement. Comportement attendu en dev, pas en prod (sous-domaines distincts).

**Suivi**
- Quand on créera vraiment le SSO cross-subdomain (Phase 2), ajouter `cookieOptions.domain = ".identite.ga"` côté backend + tester avec mkcert + `/etc/hosts` mappant `*.identite.local` pour reproduire le scénario prod en dev.
- Ajouter un middleware Next.js minimal (`middleware.ts`) pour rediriger les paths protégés AVANT le rendu du squelette, si on veut éviter le flash visible (optionnel — passé sous le seuil de friction utilisateur pour Phase 1).
- Documenter dans le README de chaque app que `TRUSTED_ORIGINS` doit être mis à jour quand on ajoute un nouveau sous-domaine.

## Références

- Cahier des charges §6.9 (Domaines, cookies, CORS)
- [Better Auth — crossDomain plugin](https://www.better-auth.com/docs/plugins/cross-domain) (côté server)
- [@convex-dev/better-auth — crossDomain](https://github.com/get-convex/better-auth)
- ADR-0004 (choix Better Auth + OIDC)
- ADR-0006 (session au signup)
- Projet de référence : `gabon-diplomatie/convex/betterAuth/auth.ts` (lignes 27–60 helpers, 159–327 createAuth) et `gabon-diplomatie/apps/citizen-web/src/app/my-space/layout.tsx` (pattern client gate).
