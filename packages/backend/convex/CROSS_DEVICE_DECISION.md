# Cross-device login — choix d'architecture

## État actuel

Le flow cross-device est implémenté **localement** dans
[`crossDevice.ts`](./crossDevice.ts) :

- Table dédiée `crossDeviceSession` (sessionCode, status, approvedEmail).
- 4 endpoints Convex : `createSession`, `getStatus`, `approveSession`,
  `cancelSession`.
- Le QR contient `idn:cross-device:<sessionCode>` (16 chars base64url ≈
  96 bits d'entropie).
- L'approbation côté mobile expose l'email approuvé, et le web bascule
  ensuite sur le PIN existant pour finaliser la session Better Auth.

## Alternative : plugin `device-authorization` de Better Auth

Better Auth 1.6.11 expose un plugin natif qui implémente le **RFC 8628
(OAuth Device Authorization Grant)**. Il fabriquerait une vraie session
Better Auth directement, sans repasser par le PIN. Endpoints :

- `POST /api/auth/device/code` → `device_code` + `user_code` (court,
  format `ABC-XYZ`).
- `POST /api/auth/device/verify` → l'utilisateur tape le `user_code`.
- `POST /api/auth/device/token` → polling, retourne la session
  Better Auth complète quand approuvé.

## Pourquoi on ne migre pas immédiatement

1. **UX du `user_code`** : le RFC prévoit un code court (lisible) que
   l'utilisateur saisit manuellement. Notre design est QR-only (mobile
   scanne, valide, c'est tout). Migrer demanderait soit de packer le
   `device_code` lui-même dans le QR (s'écarter du RFC), soit
   d'imposer un champ de saisie sur mobile (UX moins fluide).
2. **Session double** : aujourd'hui le mobile reste connecté et le web
   ouvre une session distincte. Le plugin RFC partage la même
   identité, ce qui change la sémantique « approuver » → « partager ma
   session ». Nous voulons que chaque appareil ait sa propre session
   avec son propre cycle de vie (révocation indépendante).
3. **Sessions Convex** : `crossDevice.ts` ne fabrique pas de session
   Better Auth côté web — on récupère l'email puis on enchaîne sur le
   PIN existant (sécurité supplémentaire vu que le QR seul ne devrait
   pas suffire à se connecter). Le plugin Better Auth, lui, créerait
   directement une session sur simple présentation du `device_code`.

## Migration future (V2)

À refaire si on veut une vraie session "sans PIN" via le QR :

1. Activer `deviceAuthorization()` dans `convex/auth.ts` plugins.
2. Côté web : appeler `/api/auth/device/code`, packer `device_code`
   directement dans le QR (et oublier le `user_code`).
3. Côté mobile : refactor `app/scanner.tsx` pour appeler un endpoint
   custom qui invoque `/api/auth/device/verify` avec le `device_code`
   du QR + l'auth mobile en cookie.
4. Supprimer `crossDevice.ts` + la table `crossDeviceSession` du schema.

Cette V2 est documentée mais **non implémentée** ici — le flow actuel
est suffisant pour le MVP et est plus défensif (deux facteurs : QR +
PIN).
