# IDN — Plan d'implémentation du cryptage de bout en bout

> **Document de référence technique : chiffrement client-side et envelope encryption**
> Version 1.0 — 10 mai 2026
> Statut : **document de planification** — à activer lors d'une future phase de durcissement sécurité.

Ce document décrit comment ajouter une couche de **chiffrement de bout en bout (E2E)** à la plateforme **Identité Numérique du Gabon**, sur le modèle du pattern **Whisper** publié par Convex (`https://www.convex.dev/can-do/encryption` et `https://stack.convex.dev/end-to-end-encryption-with-convex`).

Il s'inspire directement du schéma Whisper (chiffrement AES côté client, le serveur ne voit que des blobs opaques) tout en l'adaptant aux contraintes spécifiques d'une application **KYC** : certaines données — notamment les images de pièces d'identité — doivent rester déchiffrables par le serveur **pendant la fenêtre de vérification** pour qu'OCR et liveness check puissent fonctionner. Le plan résout ce conflit avec une **envelope encryption** et un mécanisme de **decrypt-and-burn**.

> [!IMPORTANT]
> Ce document est une **feuille de route**, pas une implémentation. Il sera repris lorsque la plateforme atteindra une maturité où ce niveau de sécurité devient pertinent (production réelle avec données citoyens, audit RGPD-Gabon, certification ANINF, etc.).

---

## Table des matières

1. [Contexte et objectifs](#1-contexte-et-objectifs)
2. [Modèle de menace](#2-modèle-de-menace)
3. [Décisions structurantes](#3-décisions-structurantes)
4. [Primitives cryptographiques](#4-primitives-cryptographiques)
5. [Gestion des clés](#5-gestion-des-clés)
6. [Modifications de schéma Convex](#6-modifications-de-schéma-convex)
7. [Module de cryptographie côté client](#7-module-de-cryptographie-côté-client)
8. [Modifications côté serveur (mutations)](#8-modifications-côté-serveur-mutations)
9. [Stratégie pour les images KYC : envelope + burn](#9-stratégie-pour-les-images-kyc--envelope--burn)
10. [Mise en place sans migration (clean cutover)](#10-mise-en-place-sans-migration-clean-cutover)
11. [Fichiers à créer ou modifier](#11-fichiers-à-créer-ou-modifier)
12. [Stratégie de vérification](#12-stratégie-de-vérification)
13. [Questions ouvertes et risques résiduels](#13-questions-ouvertes-et-risques-résiduels)

---

## 1. Contexte et objectifs

### 1.1 Pourquoi ce chantier

La plateforme IDN manipule par construction des données extrêmement sensibles : pivot d'identité (nom, date de naissance, lieu de naissance, nationalité), images de pièces d'identité, scores biométriques, métadonnées d'audit, consentements OAuth. Aujourd'hui, **toutes ces données sont stockées en clair dans Convex** (le chiffrement at-rest de la plateforme Convex Cloud reste une protection externe à l'application).

Un compromis opérateur, une fuite de sauvegarde, ou une réquisition légale donneraient accès à l'intégralité des dossiers citoyens. Le pattern Whisper de Convex propose une réponse : **pousser le chiffrement vers le client**, de sorte que le serveur ne voie jamais que des blobs opaques.

### 1.2 Périmètre cible

| Catégorie | Cible E2E ? | Approche |
|---|---|---|
| Pivot identité (`userProfile.pivot`) | ✅ Oui | Chiffrement AES-GCM côté client avec MK utilisateur |
| Scores et notes KYC (`kycRequest.score`, `rejectionReason`, etc.) | ✅ Oui (côté utilisateur) + plaintext admin | Table `kycResult` séparée pour l'admin |
| Métadonnées d'audit | ✅ Oui (split serveur/utilisateur) | `metadataServer` plaintext + `metadataEncrypted` opaque |
| Notifications in-app | ✅ Oui | `titleEncrypted`, `bodyEncrypted` |
| Photo de profil et images KYC | ⚠️ Envelope encryption | Déchiffrable serveur pendant la fenêtre de vérification, puis "burn" |
| Formulaire de contact public | ⚠️ Defense-in-depth | Chiffré sous KEK service (pas E2E — pas de MK utilisateur) |
| Tables Better Auth (sessions, OAuth tokens) | ❌ Non | Hors périmètre — voir §13 |

### 1.3 Ce que l'on cherche à obtenir

- Un dump de la base Convex ne révèle plus le pivot, les scores KYC, les métadonnées d'audit, les notifications, ni les images KYC après finalisation.
- L'utilisateur conserve la maîtrise de ses données : sans sa clé, personne ne peut les lire — pas même l'opérateur.
- Aucun chemin de fallback en clair dans le code (cutover propre, à faire avant qu'il y ait des utilisateurs réels).

---

## 2. Modèle de menace

### 2.1 Menaces couvertes

- **Dump de base Convex / fuite de sauvegarde** : les blobs sont inutilisables sans la MK utilisateur.
- **Opérateur interne avec accès lecture complète** : ne peut lire que les champs serveur explicitement plaintext (catégories, identifiants techniques, statuts).
- **Fuite des arguments de mutation** (logs, traces) : les arguments sont déjà du ciphertext.

### 2.2 Menaces NON couvertes (limites assumées)

- **JS malveillant servi depuis notre origine** : le code que l'on déploie a accès à la MK quand l'utilisateur est déverrouillé. La mitigation passe par SRI, un SBOM, et un journal de transparence des déploiements — chantier séparé.
- **Réquisition judiciaire (Loi 001/2011 art. 90)** : par construction, l'opérateur ne peut pas produire le clair. À valider avec le conseil juridique avant déploiement (voir §13).
- **Compromission du composant Better Auth** : tokens de session, mots de passe, tokens OAuth restent en clair.
- **Brute-force PIN à partir d'un dump** : mitigé en plaçant `wrappedMkByPin` en IndexedDB du device, jamais sur le serveur.

---

## 3. Décisions structurantes

Trois décisions ont été prises pour cadrer la conception :

1. **Le `wrappedMkByPin` vit uniquement dans IndexedDB du device** — jamais sur le serveur. Le déverrouillage par PIN ne fonctionne donc que sur les appareils où l'utilisateur s'est déjà authentifié au moins une fois avec son mot de passe ou un code de récupération.
2. **Cutover propre, pas de migration** — le chiffrement est mis en place avant qu'il y ait des utilisateurs en production. Pas de dual-write, pas de fallback plaintext dans le code.
3. **Les codes de récupération peuvent déchiffrer** — chaque code emballe une copie de la MK. Si l'utilisateur perd PIN + mot de passe, un code de récupération restaure l'accès. Compromis assumé : quiconque détient un code peut lire les données jusqu'à ce que le code soit brûlé.

---

## 4. Primitives cryptographiques

**Web Crypto exclusivement.** Pas de CryptoJS, pas de libsodium, pas de tweetnacl. Justifications :
- Déjà utilisé dans la base : `packages/backend/convex/audit.ts` (HMAC), `packages/backend/convex/onboarding.ts` (PBKDF2 PIN), `packages/backend/convex/lib/password.ts` (SHA-1 HIBP).
- API native, auditée, disponible côté navigateur et côté isolate Convex V8.
- Aucun coût bundle additionnel.

| Usage | Algorithme | Paramètres |
|---|---|---|
| Chiffrement authentifié | AES-GCM | Clé 256 bits, IV aléatoire 12 octets par chiffrement, tag 16 octets, AAD = `idn:v${keyVersion}:${table}:${docId}:${field}` |
| Dérivation mot de passe / PIN / code → KEK | PBKDF2-SHA-256 | 600 000 itérations (cohérent avec la dérivation PIN existante), sel 16 octets, sortie 256 bits |
| Wrap / unwrap MK | AES-GCM | Wrap des octets bruts de la MK avec IV frais sous la KEK |
| Wrap DEK serveur (KYC) | RSA-OAEP-2048 | Clé serveur publique distribuée via une query Convex |
| HMAC audit (existant) | HMAC-SHA-256 | Inchangé ; payload étendu pour inclure le SHA-256 du blob chiffré |

**Invariants** :
- Toutes les `CryptoKey` sont `extractable: false`.
- La MK est importée via `crypto.subtle.unwrapKey` directement en clé AES-GCM avec usages `["encrypt", "decrypt"]` — elle n'existe jamais sous forme d'octets bruts en JS.
- Chaque enveloppe de ciphertext porte un `keyVersion: number` (initial = `1`) pour permettre une rotation future.
- L'AAD lie le ciphertext à son emplacement : un attaquant ne peut pas copier un blob d'une ligne à une autre.

---

## 5. Gestion des clés

### 5.1 Cycle de vie de la Master Key (MK)

**Création initiale** (à la création du PIN, après vérification email) :

1. Le navigateur génère une MK aléatoire 256 bits.
2. Dérive `KEK_password` par PBKDF2(password, `mkSalt`, 600k itérations).
3. Wrap MK → `wrappedMkByPassword` (envoyé au serveur, stocké dans `userProfile`).
4. Génère 8 codes de récupération (Crockford base32, ~80 bits chacun) ; pour chaque code, dérive `KEK_recovery_i` et wrap MK → table `recoveryCode`.
5. Dérive `KEK_pin` par PBKDF2(PIN, `mkSalt`, 600k) ; wrap MK → `wrappedMkByPin` stocké **uniquement dans IndexedDB** du device courant.

**Déverrouillage par PIN sur device connu** : charge `wrappedMkByPin` depuis IndexedDB → dérive `KEK_pin` du PIN saisi → unwrap MK → cache en `CryptoKey` non-extractable pour la session de l'onglet, éviction après 15 minutes d'inactivité.

**Connexion sur nouveau device** : utilisateur saisit son mot de passe → dérive `KEK_password` → récupère `wrappedMkByPassword` du serveur → unwrap MK. Après unwrap, propose à l'utilisateur de "faire confiance à ce device" pour stocker un nouveau `wrappedMkByPin` en IndexedDB local.

**Récupération** : utilisateur saisit un code de récupération → la ligne `recoveryCode` correspondante est récupérée → unwrap MK → marque le code comme `burnedAt: Date.now()` → invite à recréer un PIN.

**Changement de mot de passe** : re-dérive `KEK_password`, re-wrap MK, remplace `wrappedMkByPassword`. Aucun ciphertext de pivot n'est touché.

**Reset destructif** (PIN perdu + mot de passe perdu + plus de codes de récupération) : par conception, l'accès aux données chiffrées est perdu. Le serveur efface les champs `*Encrypted` et toute image KYC en cours, génère une nouvelle MK, et l'utilisateur recommence l'onboarding. À surfacer clairement dans l'UI au moment de la création du PIN :

> ⚠️ Si vous oubliez votre PIN **et** votre mot de passe **et** vos codes de récupération, vos données chiffrées (identité pivot, dossiers KYC) seront définitivement perdues.

### 5.2 Pourquoi pas une dérivation directe du PIN

Un PIN à 6 chiffres a ~20 bits d'entropie. Même avec PBKDF2 600k itérations, un attaquant qui obtiendrait `wrappedMkByPin` depuis un dump serveur peut le brute-forcer hors-ligne sur GPU en quelques jours. **C'est précisément pour cela que `wrappedMkByPin` reste sur le device.** Pour brute-forcer le PIN, il faut désormais aussi voler le device.

### 5.3 `pinHash` reste utilisé

Le `pinHash` existant (`onboarding.ts`, lignes 200-217) **n'est pas remplacé**. Il reste utile pour :
- Rate-limiter côté serveur les tentatives PIN avant tout déverrouillage (gate "as-tu le bon PIN ?").
- Permettre des flux UX qui valident le PIN sans déverrouiller la MK (ex. "confirmer avec PIN").

Les sels diffèrent : `pinHash` utilise `idn:pin:${userId}`, `KEK_pin` utilise le `mkSalt` aléatoire. Les deux dérivations sont indépendantes.

---

## 6. Modifications de schéma Convex

### 6.1 Validateur partagé

Créer `packages/backend/convex/lib/encryption.ts` :

```ts
import { v } from "convex/values"

export const encryptedBlob = v.object({
  ciphertext: v.bytes(),
  iv: v.bytes(),         // longueur validée à 12 octets au niveau mutation
  keyVersion: v.number(),
})
```

### 6.2 Diff par table

**`userProfile`** :
- Remplacer `pivot: v.object({...})` par `pivotEncrypted: v.optional(encryptedBlob)`.
- Remplacer `photoStorageRef: v.id("_storage")` par `photoEncrypted: v.optional(v.object({ storageRef: v.id("_storage"), iv: v.bytes(), dekWrappedByUser: v.bytes(), keyVersion: v.number() }))`.
- Ajouter : `mkSalt: v.optional(v.bytes())`, `wrappedMkByPassword: v.optional(encryptedBlob)`, `mkVersion: v.optional(v.number())`. **Pas de `wrappedMkByPin`** côté serveur (IndexedDB uniquement).
- Conserver `pinHash`.

**`kycRequest`** :
- Retirer `score`, `faceMatchScore`, `livenessVerdict`, `rejectionReason` (ils basculent dans une nouvelle table `kycResult`).
- Remplacer chaque image (front, back, selfie) par une enveloppe :
  ```ts
  v.object({
    storageRef: v.id("_storage"),
    iv: v.bytes(),
    dekWrappedByUser: v.bytes(),
    dekWrappedByServer: v.optional(v.bytes()),  // null après burn
    keyVersion: v.number(),
  })
  ```
- Ajouter `clientEncrypted: v.optional(encryptedBlob)` pour des métadonnées utilisateur libres.

**Nouvelle table `kycResult`** (lisible par admin via RBAC, plaintext en Phase 1 ; en Phase 2 on pourra chiffrer sous une clé publique admin) :
```ts
defineTable({
  kycRequestId: v.id("kycRequest"),
  score: v.number(),
  faceMatchScore: v.number(),
  livenessVerdict: v.union(...),
  rejectionReason: v.optional(v.string()),
  createdAt: v.number(),
}).index("by_kycRequest", ["kycRequestId"])
```

**`auditLog`** :
- Remplacer `metadata` par deux champs :
  - `metadataServer: v.optional(v.record(v.string(), v.any()))` — enums contrôlés par le serveur uniquement (`field`, `reason`, `result`, `count`...). **Aucune PII.**
  - `metadataEncrypted: v.optional(encryptedBlob)` — opaque, déchiffrable seulement par la MK de l'acteur.
- Étendre le payload HMAC (`audit.ts`, lignes 66-72) pour inclure `sha256(metadataEncrypted.ciphertext)` quand présent. La signature continue donc à lier le ciphertext sans le déchiffrer.

**`notification`** :
- Remplacer `title`, `body`, `metadata` par `titleEncrypted`, `bodyEncrypted`, `metadataEncrypted` (tous `encryptedBlob`).
- Le canal email garde un corps plaintext générique ("vous avez un nouveau message — connectez-vous pour le voir") ; le contenu riche n'existe que dans la ligne in-app chiffrée.
- Conserver `category` et `userId` plaintext pour les index `by_category` et `by_userId`.

**`contactRequest`** (formulaire public, pas de MK utilisateur) :
- Defense-in-depth uniquement : chiffrer `name`, `subject`, `message`, `ip` sous une KEK service (env `CONTACT_KEK`). L'admin déchiffre via la même KEK.
- Conserver `email`, `status`, `createdAt` plaintext pour les index existants.

**`userDocument`** : remplacer `metadata` plaintext par `metadataEncrypted: v.optional(encryptedBlob)`.

**Nouvelle table `recoveryCode`** :
```ts
defineTable({
  userId: v.string(),
  codeIndex: v.number(),       // 0..7
  codeSalt: v.bytes(),
  wrappedMk: encryptedBlob,
  burnedAt: v.optional(v.number()),
}).index("by_userId", ["userId"])
```

### 6.3 Bornes de taille (validateur de mutation)

| Champ | Plaintext max | Ciphertext max |
|---|---|---|
| pivot | 2 KiB | 4 KiB |
| corps de notification | 4 KiB | 8 KiB |
| `auditLog.metadataEncrypted` | 2 KiB | 4 KiB |
| wrap de code de récupération | — | 256 B |

---

## 7. Module de cryptographie côté client

Nouveau fichier : `apps/web/lib/crypto/e2e.ts`. Fonctions pures, sans React.

API publique :

```ts
export const PBKDF2_ITERATIONS = 600_000
export const KEY_VERSION = 1
export const IV_BYTES = 12

export type Encrypted = { ciphertext: ArrayBuffer; iv: ArrayBuffer; keyVersion: number }

// Cycle de vie MK
export function generateMasterKey(): Promise<CryptoKey>
export function deriveKek(secret: string, salt: ArrayBuffer): Promise<CryptoKey>
export function wrapMasterKey(mk: CryptoKey, kek: CryptoKey): Promise<Encrypted>
export function unwrapMasterKey(wrapped: Encrypted, kek: CryptoKey): Promise<CryptoKey>

// Chiffrement par enregistrement avec liaison AAD
export function encryptJson<T>(value: T, mk: CryptoKey, aad: string): Promise<Encrypted>
export function decryptJson<T>(enc: Encrypted, mk: CryptoKey, aad: string): Promise<T>

// Envelope encryption pour images KYC et avatars
export type EnvelopeEncrypted = {
  ciphertextBlob: Blob
  iv: ArrayBuffer
  dekWrappedByUser: ArrayBuffer
  dekWrappedByServer?: ArrayBuffer
  keyVersion: number
}
export function envelopeEncryptBlob(
  blob: Blob,
  mk: CryptoKey,
  serverPubKey?: CryptoKey,  // RSA-OAEP-2048 pour KYC ; omis pour avatar
): Promise<EnvelopeEncrypted>
export function envelopeDecryptBlob(
  ciphertext: Blob,
  iv: ArrayBuffer,
  dekWrappedByUser: ArrayBuffer,
  mk: CryptoKey,
): Promise<Blob>

// Codes de récupération
export function generateRecoveryCodes(n: number): string[]   // ex. "XK4P-9TZM-..."
export function deriveRecoveryKek(code: string, salt: ArrayBuffer): Promise<CryptoKey>

// Persistance device-side du wrap PIN (clé IndexedDB : idn:wrappedMkByPin:{userId})
export function storePinWrappedMk(userId: string, wrapped: Encrypted): Promise<void>
export function loadPinWrappedMk(userId: string): Promise<Encrypted | null>
export function deletePinWrappedMk(userId: string): Promise<void>

// Cache MK en mémoire avec éviction sur inactivité
export function unlockWithPin(userId: string, pin: string, mkSalt: ArrayBuffer): Promise<CryptoKey>
export function unlockWithPassword(password: string, mkSalt: ArrayBuffer, wrapped: Encrypted): Promise<CryptoKey>
export function unlockWithRecoveryCode(code: string, codeSalt: ArrayBuffer, wrapped: Encrypted): Promise<CryptoKey>
export function lockMasterKey(): void
export function getCachedMasterKey(): CryptoKey | null
```

**Intégration React** : `apps/web/components/crypto/UnlockProvider.tsx` — context provider qui détient la MK déverrouillée, expose `useMasterKey()` et `useEncryptor()`, gère l'éviction sur inactivité (15 min). Hooks `useDecryptedPivot()`, `useDecryptedNotifications()` qui interrogent les blobs chiffrés via Convex et déchiffrent dans `useMemo`.

---

## 8. Modifications côté serveur (mutations)

Le serveur valide la forme du ciphertext (longueur d'IV, bornes de taille) mais **ne déchiffre jamais** les données utilisateur.

| Mutation | Changement |
|---|---|
| `profile.ts` `updatePivot` | Prend désormais un seul argument `pivotEncrypted: encryptedBlob`. Valide `iv.byteLength === 12`, `ciphertext.byteLength <= 4096`, `keyVersion` cohérent avec `userProfile.mkVersion`. Audit log écrit `metadataServer: { field: "pivot" }`. |
| `onboarding.ts` `setIdentityPivot` | Même bascule. Ajouter une mutation sœur `initializeMasterKeyEnvelopes({ mkSalt, wrappedMkByPassword, recoveryCodes })` qui écrit `userProfile.{mkSalt, wrappedMkByPassword, mkVersion=1}` et insère atomiquement les 8 lignes `recoveryCode`. |
| `onboarding.ts` `createPin` | Continue de calculer `pinHash` (flux existant lignes 200-217). **Le `wrappedMkByPin` n'est PAS envoyé au serveur** — le client le stocke en IndexedDB. |
| `kyc.ts` `setDocumentImage`, `setSelfie` | Acceptent `{ kycRequestId, side?, storageRef, iv, dekWrappedByUser, dekWrappedByServer, keyVersion }`. Validation : `dekWrappedByServer` présent et compatible avec la version courante de la KEK serveur. |
| `kyc.ts` `submit` | Inchangé. |
| `audit.ts` `recordAudit` | Split `metadata` → `metadataServer` + `metadataEncrypted`. Étendre le payload HMAC pour inclure `sha256(metadataEncrypted.ciphertext)`. |
| `notifications.ts` (serveur-originaire) | Le serveur n'a pas de MK. Phase 1 : chiffrer sous KEK service (defense-in-depth). Documenter la limite. Phase 2 ultérieure possible : clé ECDH publique par utilisateur pour vraie E2E depuis le serveur. |

---

## 9. Stratégie pour les images KYC : envelope + burn

C'est la pièce centrale, parce que pure E2E est incompatible avec OCR/biométrie côté serveur.

### 9.1 Configuration KEK serveur

Paire de clés RSA-OAEP-2048 long-terme. La clé publique est servie aux clients via une query Convex (`kyc.serverPublicKey()`). La clé privée vit dans `KYC_KEK_PRIVATE_PEM` côté env Convex pour la Phase 1 ; **la Phase 2 doit la déplacer vers un KMS managé** (à tracker — voir §13).

### 9.2 Upload (côté client)

1. Générer un DEK aléatoire (AES-GCM 256).
2. Chiffrer les octets de l'image avec le DEK → upload du ciphertext vers Convex Storage → on récupère un `storageRef`.
3. Wrap du DEK sous la MK (`dekWrappedByUser`) **et** sous la clé publique serveur via RSA-OAEP (`dekWrappedByServer`).
4. Appel à `kyc.setDocumentImage` (ou `setSelfie`) avec les deux wraps.

### 9.3 Fenêtre de vérification

Dans `packages/backend/convex/kyc/actions.ts` (Phase 2 `runOcr`, `runBiometric`) :

1. L'action lit `dekWrappedByServer` sur la ligne.
2. Unwrap avec la clé privée serveur → obtient le DEK.
3. Stream du ciphertext depuis le storage → déchiffre → octets de l'image en mémoire.
4. Envoi vers Smile ID.
5. **Aucune persistance** des octets clairs.

Les scores et verdicts sont écrits dans `kycResult` (plaintext, RBAC admin) ; `kycRequest.status` est mis à jour normalement.

### 9.4 Burn

Quand `kyc/workflow.ts` transitionne vers un état terminal (`approved`, `rejected`, `expired`), une mutation interne :

1. Patche chaque enveloppe d'image pour mettre `dekWrappedByServer: undefined`.
2. (Optionnel Phase 2) re-chiffre le blob storage sous un DEK frais et met à jour seulement `dekWrappedByUser` — *forward secrecy* : si l'ancienne `KEK_server` fuit ensuite, les lignes brûlées restent inaccessibles.

Après burn, le serveur ne peut plus déchiffrer. Seul l'utilisateur (via sa MK et `dekWrappedByUser`) peut.

### 9.5 Affichage utilisateur post-burn

L'utilisateur appelle le flux URL de storage existant pour récupérer le blob ciphertext, puis appelle `envelopeDecryptBlob` côté client avec sa MK. Pour les performances (Phase 1 : un seul document, un selfie) c'est suffisant ; si on ajoute beaucoup de documents par utilisateur, prévoir un cache `Cache Storage` indexé par hash.

### 9.6 Pourquoi cette approche bat les alternatives

| Alternative | Verdict |
|---|---|
| At-rest avec KEK managée seule (sans DEK par image) | Toutes les images sont déchiffrables à vie par quiconque détient la KEK. Aucune agentivité utilisateur. |
| Pure E2E (serveur sans accès) | OCR/biométrie automatiques impossibles. Tue le produit. |
| TEE / confidential computing | Surdimensionné pour la Phase 1, coûts opérationnels élevés. |

---

## 10. Mise en place sans migration (clean cutover)

Confirmé : pas d'utilisateurs en production. Étapes ordonnées :

1. **Reset de la base dev.**
2. Land des modifs de schéma, des helpers `lib/encryption.ts`, des tables `kycResult` et `recoveryCode`.
3. Ship du module `apps/web/lib/crypto/e2e.ts` et de `UnlockProvider`.
4. Bascule des mutations vers les formes chiffrées (pas de dual-write — bascule directe).
5. UI d'onboarding adaptée : la création de PIN génère désormais MK + codes de récupération + `wrappedMkByPassword`, et stocke `wrappedMkByPin` en IndexedDB. Affichage **une seule fois** des codes de récupération avec "à conserver précieusement".
6. Adapter les lectures profile / KYC / notifications / audit pour déchiffrer côté client.
7. Ajouter un fichier `SECURITY.md` qui documente le modèle de menace, ce qui est protégé, le gap Better Auth, la posture juridique.

---

## 11. Fichiers à créer ou modifier

### Modifications

- `/Users/berny/Developer/identite.ga/packages/backend/convex/schema.ts`
- `/Users/berny/Developer/identite.ga/packages/backend/convex/onboarding.ts` (ajouter `initializeMasterKeyEnvelopes`, modifier `setIdentityPivot` et `createPin` — réutiliser le helper PBKDF2 lignes 200-217)
- `/Users/berny/Developer/identite.ga/packages/backend/convex/profile.ts` (`updatePivot`, `setProfilePhoto`)
- `/Users/berny/Developer/identite.ga/packages/backend/convex/kyc.ts` (`setDocumentImage`, `setSelfie`, ajouter une query `serverPublicKey`)
- `/Users/berny/Developer/identite.ga/packages/backend/convex/kyc/actions.ts` (Phase 2 : unwrap serveur + déchiffrement avant Smile ID)
- `/Users/berny/Developer/identite.ga/packages/backend/convex/kyc/workflow.ts` (burn `dekWrappedByServer` aux transitions terminales ; écriture dans `kycResult`)
- `/Users/berny/Developer/identite.ga/packages/backend/convex/audit.ts` (split metadata ; payload HMAC étendu)
- `/Users/berny/Developer/identite.ga/packages/backend/convex/notifications.ts` (forme chiffrée ; KEK service pour serveur-originaire)

### Créations

- `/Users/berny/Developer/identite.ga/packages/backend/convex/lib/encryption.ts` (validateurs serveur)
- `/Users/berny/Developer/identite.ga/apps/web/lib/crypto/e2e.ts` (module crypto client)
- `/Users/berny/Developer/identite.ga/apps/web/components/crypto/UnlockProvider.tsx`
- `/Users/berny/Developer/identite.ga/SECURITY.md`

### À réutiliser sans réinventer

- Pattern de dérivation PBKDF2 dans `packages/backend/convex/onboarding.ts:200-217`.
- Pattern HMAC dans `packages/backend/convex/audit.ts:74-89`.
- Sémantique du validateur Convex `v.bytes()` déjà utilisé pour la signature d'audit.

---

## 12. Stratégie de vérification

### 12.1 Tests unitaires (Vitest, jsdom + Web Crypto)

- Round-trip `encryptJson` → `decryptJson` retrouve la valeur exacte (incluant unicode, objets imbriqués).
- Mismatch d'AAD (`A` vs `B`) fait échouer le déchiffrement avec `OperationError`.
- 1 000 chiffrements produisent 1 000 IV distincts.
- Mauvais PIN / mot de passe / code de récupération → `OperationError` ; les bons unwrap vers une `CryptoKey` qui déchiffre un ciphertext de test.
- Changement de mot de passe : le re-wrap fonctionne ; l'ancien `wrappedMkByPassword` ne déchiffre plus ; les ciphertexts de pivot existants se déchiffrent toujours.
- `keyVersion` supérieur au max connu du client → rejet.

### 12.2 Tests backend Convex (`@convex-dev/testing`)

- Mutation rejette ciphertext trop volumineux et IV mal formé (≠ 12 octets).
- Mutation rejette `keyVersion` incohérent avec `userProfile.mkVersion`.
- Le HMAC d'audit vérifie sur les lignes avec `metadataEncrypted` (payload étendu).
- Workflow KYC chemin nominal avec unwrap serveur mocké + Smile ID stub : les scores atterrissent dans `kycResult`, `dekWrappedByServer` est `undefined` après transition finale, tentative d'unwrap serveur sur ligne brûlée throw.
- Toutes les queries d'index existantes continuent de fonctionner (`userProfile.by_userId`, `kycRequest.by_status`, `notification.by_category`, etc.) — les colonnes d'index restent plaintext.

### 12.3 Tests E2E (Playwright)

- Inscription → création PIN → remplissage pivot → déconnexion → reconnexion par PIN sur le même device → pivot s'affiche.
- Même flux dans un navigateur frais : déverrouillage par PIN échoue (pas d'IndexedDB), déverrouillage par mot de passe fonctionne, puis "trust this device" stocke un nouveau `wrappedMkByPin` localement.
- Mauvais PIN 5× → rate limit serveur via le gate `pinHash`.
- Reset de mot de passe → données chiffrées toujours déchiffrables.
- Code de récupération : première utilisation unwrap, deuxième utilisation rejetée (burned).
- Flux KYC avec Smile ID mocké : upload, workflow, décision, image toujours visible par l'utilisateur, unwrap serveur échoue après burn.

### 12.4 Smoke test manuel

Dump de la base Convex après un flux complet ; assertion qu'aucune PII plaintext n'est visible :
```bash
grep -i 'firstName\|dateOfBirth\|nationalité' dump.json
# doit ne rien retourner
```

---

## 13. Questions ouvertes et risques résiduels

À traiter avant ou pendant la mise en œuvre, mais qui ne bloquent pas la conception ci-dessus.

1. **Posture Loi 001/2011 art. 90** — confirmer auprès du conseil juridique que l'on accepte "l'opérateur ne peut pas divulguer car c'est chiffré" comme réponse officielle aux réquisitions judiciaires. Documenter dans `SECURITY.md`. **À valider avant déploiement.**
2. **Gap Better Auth** — sessions, tokens OAuth, mots de passe restent plaintext at rest. À tracker comme chantier séparé : adaptateur custom, ou contribution upstream à `@convex-dev/better-auth`.
3. **Recherche admin par nom** — devient impossible avec pivot chiffré. Décider plus tard entre :
   - Index déterministe sur le hash du nom (fuite l'égalité, pas la valeur).
   - Index plaintext séparé sous KEK service (compromis sur le modèle de menace).
   - Acceptation de la limite (le citoyen doit fournir son identifiant pour être recherché).
4. **`KYC_KEK_PRIVATE_PEM`** — Phase 1 acceptable en variable d'environnement Convex ; **Phase 2 doit migrer vers un KMS externe** avec audit des accès.
5. **Notifications serveur-originaires** — Phase 1 utilise une KEK service (defense-in-depth, pas E2E). Phase 2 peut ajouter une clé publique ECDH par utilisateur pour une vraie E2E depuis le serveur.
6. **Politique de rotation de clés** — documenter les déclencheurs dans `SECURITY.md` (déprécation primitive, suspicion de compromis MK initiée par l'utilisateur). Pas de rotation automatique au premier ship.
7. **Stabilité de l'AAD** — l'AAD inclut `docId` ; si une ligne est recréée avec les mêmes données, le nouveau doc a un ID différent et les ciphertexts sauvegardés (ex. dans un backup restauré sur un autre doc) ne se déchiffrent plus. Compromis acceptable, à documenter.
8. **Performance d'écriture audit** — la plupart des entrées d'audit utilisent uniquement `metadataServer` (enums contrôlés serveur). Les rares contextes avec PII utilisateur sont chiffrés côté client avant l'appel mutation. Impact négligeable ; valider en charge si nécessaire.
9. **Devices multiples sans WebAuthn** — au premier déverrouillage par mot de passe sur un nouveau device, on stocke un `wrappedMkByPin` en IndexedDB. Une amélioration future : lier ce wrap à une credential WebAuthn pour résister au vol de device.

---

## Référence

- Convex — *End-to-End Encryption*, page produit : https://www.convex.dev/can-do/encryption
- Convex Stack — *End-to-End Encryption with Convex* : https://stack.convex.dev/end-to-end-encryption-with-convex
- Démo Whisper : https://github.com/get-convex/whisper
- Web Crypto API : https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- RFC 5869 (HKDF) ; FIPS 198-1 (HMAC) ; NIST SP 800-38D (GCM) ; RFC 8017 (RSA-OAEP)
