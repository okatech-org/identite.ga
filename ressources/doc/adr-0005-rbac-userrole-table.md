# ADR-0005 — RBAC via table `userRole` (plugin admin Better Auth retiré)

- **Statut** : Accepté
- **Date** : 2026-05-10
- **Décideurs** : équipe IDN

## Contexte

IDN a 3 rôles opérateur (cf. cahier §3.9–§3.11) :
- `admin` — console d'administration (apps OAuth, comptes, logs, rôles, providers email)
- `identity_controller` — espace contrôleur (file KYC, scanner, vérif signature)
- `developer` — portail développeur (apps OAuth self-service, clés)

Un utilisateur peut cumuler plusieurs rôles (un admin peut aussi être contrôleur). Les rôles `admin` et `identity_controller` exigent MFA TOTP obligatoire (§6.2). Toutes les actions sensibles doivent être auditées avec l'acteur, le rôle utilisé, et l'horodatage.

Better Auth fournit un plugin `admin` qui ajoute des colonnes (`role`, `banned`, `banReason`, `banExpires`) à la table `user` du composant. À la première tentative d'utilisation, le sign-up a échoué :

```
ArgumentValidationError: Value does not match validator.
Path: .input
Value: { data: { ..., banned: false, role: "user", twoFactorEnabled: false, ... } }
Validator: v.union(v.object({data: v.object({createdAt, email, emailVerified, image?, ..., name, ...}), model: v.literal("user")}), …)
```

Diagnostic : l'adapter `@convex-dev/better-auth` (v0.12.2) déclare un validateur fixe pour la table `user` qui n'inclut pas les champs ajoutés par le plugin `admin`. Il n'y a pas encore de mécanisme d'extension de schéma exposé.

## Décision

**Retirer le plugin `admin`** de la configuration Better Auth et gérer les rôles dans une **table applicative dédiée `userRole`** côté schéma IDN :

```ts
userRole: defineTable({
  userId: v.string(),                           // ID Better Auth (frontière composant)
  role: v.union(...ROLES.map(v.literal)),       // admin | identity_controller | developer
  assignedAt: v.number(),
  assignedBy: v.optional(v.string()),
  revokedAt: v.optional(v.number()),
})
  .index("by_userId", ["userId"])
  .index("by_role", ["role"])
  .index("by_userId_role", ["userId", "role"])
```

Helpers RBAC dans `convex/lib/auth.ts` :

```ts
export type AuthUser = { userId, email, emailVerified, roles: Role[] }

export async function requireAuth(ctx): Promise<AuthUser>
export async function requireRole(ctx, ...allowed: Role[]): Promise<AuthUser>
export const requireAdmin       = (ctx) => requireRole(ctx, "admin")
export const requireController  = (ctx) => requireRole(ctx, "identity_controller")
export const requireDeveloper   = (ctx) => requireRole(ctx, "developer")
export async function requireVerifiedAuth(ctx): Promise<AuthUser>
```

`loadAuth(ctx)` joint l'utilisateur Better Auth (`authComponent.getAuthUser`) avec ses lignes actives de `userRole` (filtrant `revokedAt`). Toutes les mutations sensibles (admin / contrôleur / dev) appellent `requireAdmin / requireController / requireDeveloper`.

L'attribution / révocation de rôle passe par les mutations `admin/roles.ts:assign` / `revoke` qui :
- exigent `requireAdmin(ctx)`
- insèrent / soft-deletent dans `userRole`
- enregistrent un `auditLog` `role_assigned` / `role_revoked`
- envoient une notification email à l'utilisateur concerné

## Alternatives envisagées

1. **Patcher l'adapter @convex-dev/better-auth pour étendre le validator** — solution upstream propre mais nécessite un fork ou un PR. Trop coûteux en Phase 1 ; à reconsidérer si le composant officiel ouvre cette extension.
2. **Stocker les rôles en JSON dans une colonne `metadata` de la table user Better Auth** — l'adapter ne supporte pas ce champ non plus, et ça encode mal des relations multi-rôles.
3. **Utiliser une table SQL externe (PG)** — incompatible avec l'architecture Convex Phase 1.
4. **Garder le plugin `admin` malgré l'erreur** — bloque carrément le sign-up. Rejeté immédiatement.

## Conséquences

**Positives**
- Indépendance du modèle de rôles vis-à-vis de Better Auth → migration Phase 4 (Ory) plus simple : on garde notre propre table `userRole`, on remplace juste `authComponent.getAuthUser` par l'équivalent Kratos.
- Multi-rôles natifs (un user peut avoir plusieurs lignes `userRole`).
- Trail historique des assignations / révocations conservé (soft delete via `revokedAt`).
- Audit log intégré dès l'origine.

**Négatives**
- On perd la richesse du plugin Better Auth (impersonation, ban temporisé, `banReason`). Si on en a besoin, il faudra l'implémenter à la main (table `userBan` + checks dans `requireAuth`).
- Une jointure supplémentaire (`getAuthUser` + query `userRole`) à chaque appel de `requireAuth`. Coût négligeable avec l'index `by_userId`.

**Suivi**
- Surveiller les releases de `@convex-dev/better-auth` : si une option `extendUserSchema` apparaît, reconsidérer.
- Implémenter `userBan` quand on aura besoin du flow de bannissement (Phase 3 modération).
- Définir un seed pour créer le premier admin (premier déploiement) — un script `convex/_dev/seed-admin.ts` à invoquer manuellement avec le userId du fondateur.

## Références

- Cahier des charges §3.9 (Console admin), §3.10 (Espace contrôleur), §3.11 (Portail développeur), §6.7 (Audit log)
- [@convex-dev/better-auth schema source](https://github.com/get-convex/better-auth/blob/main/src/component/_generated/schema.ts)
- [Better Auth admin plugin](https://www.better-auth.com/docs/plugins/admin)
- ADR-0004 (Better Auth)
