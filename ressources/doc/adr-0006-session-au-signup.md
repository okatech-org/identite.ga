# ADR-0006 — Session créée au sign-up + `requireVerifiedAuth` côté métier

- **Statut** : Accepté
- **Date** : 2026-05-10
- **Décideurs** : équipe IDN

## Contexte

Better Auth offre l'option `emailAndPassword.requireEmailVerification: true` qui empêche la création de session tant que l'email n'est pas vérifié. C'est ce que demande implicitement le cahier (§3.2 : OTP à 6 chiffres, expiration 15 min, le compte doit être vérifié avant d'être utilisé).

Dans la pratique de notre tunnel d'inscription IDN, après `authClient.signUp.email(...)`, l'utilisateur arrive sur `/sign-up/verify` (étape OTP). À la vérification, on appelle `authClient.emailOtp.verifyEmail(...)` puis **immédiatement** la mutation Convex `api.onboarding.selectProfile(...)` pour créer la ligne `userProfile`.

Avec `requireEmailVerification: true` :
- `signUp.email` retourne `{ token: null, user }` — pas de session.
- `emailOtp.verifyEmail` retourne `{ status: true, token: null, user }` — toujours pas de session : l'endpoint vérifie l'email mais ne signe pas l'utilisateur.
- L'utilisateur doit appeler `signIn.email(email, password)` séparément pour obtenir une session.

Conséquences :
- Notre mutation `selectProfile` (qui exige `requireVerifiedAuth(ctx)`) échoue avec `UNAUTHENTICATED` parce qu'il n'y a aucune session côté Convex.
- Pour la rendre appelable, il faudrait re-signer l'utilisateur, ce qui exige de garder le mot de passe en mémoire (sessionStorage / state React) → fenêtre d'exposition pour rien et UX dégradée.

## Décision

Configurer Better Auth avec **`requireEmailVerification: false`** côté `emailAndPassword`. La session est créée immédiatement à la fin du `signUp.email`. L'utilisateur peut donc appeler les mutations Convex dès l'étape suivante.

**La vérification email reste obligatoire** pour les actions IDN sensibles : on l'enforce **côté serveur** dans `convex/lib/auth.ts` :

```ts
export async function requireVerifiedAuth(ctx): Promise<AuthUser> {
  const user = await requireAuth(ctx)
  if (!user.emailVerified) {
    throw new ConvexError({
      code: "EMAIL_NOT_VERIFIED",
      message: "Vérifiez votre adresse email avant de continuer.",
    })
  }
  return user
}
```

Toutes les mutations métier qui exposent ou modifient des données IDN (`selectProfile`, `setIdentityPivot`, `createPin`, `submit` KYC, `submitContactRequest` quand authentifié, etc.) appellent **`requireVerifiedAuth`** au lieu de `requireAuth`. L'OTP envoyé à signUp (`sendVerificationOnSignUp: true` sur le plugin `emailOTP`) reste obligatoire pour pouvoir avancer.

Dans le tunnel d'inscription `apps/web/app/(auth)/`, l'ordre est :

1. `/sign-up/profile` — choix profil (sessionStorage, pas de mutation, pas d'auth).
2. `/sign-up` — `signUp.email(...)` → user créé, **session active**, `emailVerified=false`. OTP envoyé automatiquement.
3. `/sign-up/verify` — `verifyEmail(otp)` → `emailVerified=true`. Puis `api.onboarding.selectProfile(...)` (passe `requireVerifiedAuth`).
4. `/sign-up/identity` — `setIdentityPivot(...)` (passe `requireVerifiedAuth`).
5. `/sign-up/pin` — `createPin(...)` (passe `requireVerifiedAuth`).

Tant que l'OTP n'est pas vérifié, le user a une session **active mais inerte** : aucune action métier IDN n'est accessible. Il peut juste reposter du mail pour recevoir un nouvel OTP.

## Alternatives envisagées

1. **Garder `requireEmailVerification: true` + relogin manuel post-OTP** — le mot de passe doit alors être stocké côté client le temps du signup, ce qui élargit la surface de vulnérabilité (XSS lit le sessionStorage). Rejeté.
2. **Utiliser `signIn.emailOTP` (mode magic link OTP) au lieu de `signUp.email + verifyEmail`** — Better Auth supporte ce flow, mais il ne crée pas de mot de passe et le cahier exige un mot de passe ≥12 chars (§6.2) en plus du PIN.
3. **`requireEmailVerification: true` + appeler `signIn` automatiquement après verifyEmail avec un mot de passe one-shot stocké en mémoire React (jamais dans sessionStorage)** — possible mais fragile (refresh de page = état perdu, deux endpoints à coordonner).
4. **Patcher Better Auth pour que `verifyEmail` crée la session** — solution upstream lourde.

## Conséquences

**Positives**
- Tunnel d'inscription fluide en 5 étapes sans relogin caché.
- Le mot de passe ne quitte jamais le formulaire `/sign-up` (pas de stockage client).
- Le contrôle « email vérifié » reste fort : il est dans toutes nos mutations sensibles côté serveur, intestable pour le client.
- Le rate-limiter Convex (§6.6) s'applique à toutes les requêtes de la session, pas seulement post-vérification.

**Négatives**
- Une **session existe avant la vérification email**. Conséquences à mitiger :
  - Quelqu'un qui obtient le cookie de session avant que le légitime ne valide l'OTP pourrait, en théorie, revendre cette identité. En pratique, le cookie est `HttpOnly` + `Secure` + `SameSite=Lax`, et il n'y a aucune action métier accessible jusqu'à la vérification.
  - Risque de comptes « zombies » (créés sans vérifier email). Mitigation : cron de purge des comptes `emailVerified=false` après 24 h (à câbler ; cron Convex ou job manuel pour Phase 1).
- Le wording UI doit clairement signaler à l'utilisateur que tant qu'il n'a pas validé son email, il ne peut rien faire. Déjà conforme dans `(auth)/_content/fr.ts`.

**Suivi**
- Implémenter le cron de purge des comptes non-vérifiés après 24 h.
- Implémenter une bannière persistante « Vérifiez votre email » sur le `/dashboard` si `emailVerified=false` (par défaut impossible aujourd'hui car la vérification est step 3 du tunnel — utile pour la phase « changement d'email »).
- Auditer une fois par release que toutes les mutations sensibles utilisent bien `requireVerifiedAuth` et pas seulement `requireAuth`.

## Références

- Cahier des charges §3.2 (Inscription), §6.2 (Auth + politique mots de passe)
- [Better Auth — emailAndPassword.requireEmailVerification](https://www.better-auth.com/docs/concepts/email-password)
- [Better Auth — emailOTP plugin](https://www.better-auth.com/docs/plugins/email-otp)
- ADR-0004 (Better Auth)
