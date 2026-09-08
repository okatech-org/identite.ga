# Identité déléguée — API pour applications partenaires

Comment une application partenaire **crée une identité identité.ga pour un
citoyen qui n'a pas encore de compte**, et comment ce citoyen la **réclame**
ensuite pour en prendre le contrôle.

Cas d'usage : un guichet (mairie, opérateur, administration) enrôle une
personne physiquement présente. L'application partenaire crée l'identité,
remet au citoyen un **code de réclamation** imprimé, et le citoyen finalise
lui-même sur identité.ga en posant son mot de passe et son PIN.

| Étape | Acteur | Endpoint |
|-------|--------|----------|
| 1. Vérifier que le citoyen n'a pas déjà une identité | partenaire (M2M) | `POST /api/delegate/lookup` |
| 2. Créer l'identité + obtenir le code de réclamation | partenaire (M2M) | `POST /api/delegate/identity` |
| 3. Suivre la réclamation | partenaire (M2M) | `GET /api/delegate/identity` |
| 4. Réclamer l'identité | citoyen (public) | `POST /api/claim/lookup` puis `/api/claim/complete` |

---

## 0. Authentification et pré-requis

Les routes `/api/delegate/*` sont **machine-to-machine**. Elles n'acceptent ni
cookie de session ni access token OIDC, uniquement une **clé API** émise depuis
le portail développeur :

```
Authorization: Bearer idn_pat_…
```

Trois conditions doivent être réunies, sinon la requête est rejetée :

| Condition | Échec |
|-----------|-------|
| Clé valide, non révoquée, non expirée | `401 unauthorized` |
| Clé portant le scope de la route | `403 insufficient_scope` |
| Délégation activée sur l'application OAuth du développeur | `403 delegation_not_enabled` |

Scopes, un par route — ils ne sont **pas hiérarchiques** : pouvoir chercher
n'autorise pas à créer.

| Route | Scope |
|-------|-------|
| `POST /api/delegate/lookup` | `idn:delegate:lookup` |
| `POST /api/delegate/identity` | `idn:delegate:create` |
| `GET /api/delegate/identity` | `idn:delegate:status` |

La délégation s'active sur l'application dans le portail développeur, avec un
**`maxLoa`** (1 ou 2) : c'est le niveau de garantie maximum que l'application
est autorisée à attribuer. Une demande supérieure est silencieusement ramenée
à ce plafond.

---

## 1. `sub` — l'identifiant à conserver

Les réponses de cette API renvoient un champ **`sub`** : le *subject* OIDC du
citoyen. C'est **le même identifiant** que celui que portera son `id_token`
lorsqu'il se connectera à votre application après réclamation.

C'est donc `sub`, et lui seul, qu'il faut stocker pour rattacher l'identité
créée au dossier local. Les deux autres identifiants ne conviennent pas :

| Champ | Pourquoi il ne suffit pas |
|-------|---------------------------|
| `idnId` | absent tant que le profil n'est pas complet, et modifiable |
| `delegatedIdentityId` | identifiant interne du dossier de délégation, il ne réapparaît dans aucun jeton |

Sans `sub`, le rattachement au retour du citoyen n'est pas idempotent : rien ne
permet de reconnaître que l'utilisateur qui se connecte est celui que vous avez
enrôlé, et un second dossier est créé.

---

## 2. Chercher avant de créer

```
POST /api/delegate/lookup
Authorization: Bearer idn_pat_…
Content-Type: application/json
```

Deux modes de recherche, au choix : par **NIP**, ou par **état civil complet**
(les trois champs sont requis ensemble). La comparaison sur le nom et le prénom
est insensible à la casse.

```jsonc
// par NIP
{ "nip": "A1B2C3D4E5F6G7" }

// ou par état civil
{ "firstName": "Jean", "lastName": "Ondo", "dateOfBirth": "1991-07-05" }
```

```jsonc
// 200 — citoyen trouvé
{
  "found": true,
  "sub": "…",              // subject OIDC — à conserver (section 1)
  "idnId": "GA-0001-0001", // absent si le profil n'est pas complet
  "loa": 2,                // 1 | 2 | 3
  "isDelegated": true      // identité déléguée émise et PAS ENCORE réclamée
}

// 200 — inconnu
{ "found": false }
```

`isDelegated: true` signale une identité déjà créée par délégation et en
attente de réclamation : ne la recréez pas, le citoyen a déjà un code entre les
mains (ou en a perdu un — voir la réémission côté back-office).

---

## 3. Créer l'identité déléguée

```
POST /api/delegate/identity
Authorization: Bearer idn_pat_…
Content-Type: application/json
```

```jsonc
{
  "firstName": "Awa",           // requis
  "lastName": "Mbina",          // requis
  "dateOfBirth": "1995-03-12",  // requis, format AAAA-MM-JJ strict
  "gender": "F",                // requis : M | F | O | N
  "birthPlace": "Port-Gentil",  // requis
  "nationality": "GAB",         // requis, code pays
  "nip": "A1B2C3D4E5F6G7",      // optionnel, exactement 14 alphanumériques
  "phone": "+241…",             // optionnel
  "profileType": "citizen",     // citizen (défaut) | resident
  "loa": 2,                     // souhaité, plafonné au maxLoa de l'app
  "documentType": "…",          // optionnel — pièce justificative
  "documentFront": "…",         // optionnel — id de fichier Convex
  "documentBack": "…"           // optionnel — id de fichier Convex
}
```

```jsonc
// 201 — identité créée
{
  "sub": "…",                     // subject OIDC — à conserver (section 1)
  "idnId": "GA-0002-0002",
  "delegatedIdentityId": "…",     // référence du dossier, pour le suivi
  "assignedLoa": 2,               // niveau réellement attribué (≤ maxLoa)
  "claimCode": "AAAA-BBBB-CCCC"   // ⚠️ voir ci-dessous
}
```

> ### ⚠️ `claimCode` : unique restitution
>
> Le code de réclamation n'est renvoyé **qu'ici, une seule fois**. Seul son
> hash est conservé côté identité.ga — il n'est relisible par personne, ni par
> le partenaire, ni par un administrateur. Il doit être remis au citoyen
> (impression, remise en main propre). **Perdu, il faut le réémettre** ; sans
> lui l'identité créée n'est pas réclamable.
>
> Corollaire : ne le journalisez pas et ne le stockez pas côté partenaire.

Erreurs propres à cette route :

| Statut | `error` | Cause |
|--------|---------|-------|
| `400` | `missing_fields` | un des six champs requis est absent |
| `400` | `invalid_gender` | `gender` hors `M` / `F` / `O` / `N` |
| `400` | `invalid_date_of_birth` | format ≠ `AAAA-MM-JJ` |
| `400` | `invalid_nip` | NIP présent mais ≠ 14 caractères alphanumériques |
| `409` | `identity_already_exists` | le NIP correspond déjà à une identité (le corps porte l'`idnId` existant) |

---

## 4. Suivre la réclamation

```
GET /api/delegate/identity?id=<delegatedIdentityId>
Authorization: Bearer idn_pat_…
```

```jsonc
// 200
{
  "_id": "…",
  "appClientId": "…",
  "sub": "…",                 // identique à celui de la création
  "idnId": "GA-0001-0001",
  "assignedLoa": 2,
  "status": "created",        // created = en attente · claimed = réclamée
  "createdAt": 1718000000000
  // "claimedAt" : ms epoch — champ ABSENT tant que l'identité n'est pas réclamée
}
```

| Statut | `error` | Cause |
|--------|---------|-------|
| `400` | `missing_id` | paramètre `id` absent |
| `404` | `not_found` | aucun dossier pour cet identifiant |
| `403` | `forbidden` | le dossier appartient à une **autre** application |

Une application ne voit que les identités qu'elle a elle-même émises : le
`delegatedIdentityId` d'un tiers ne donne accès à rien.

---

## 5. Côté citoyen — la réclamation

Ces deux routes sont **publiques** (pas de clé API) : elles servent le parcours
de réclamation sur identité.ga. Un partenaire n'a normalement pas à les
appeler, mais leur comportement conditionne ce qu'il faut expliquer au citoyen.

```
POST /api/claim/lookup      { nip | (firstName + lastName + dateOfBirth), claimCode }
POST /api/claim/complete    { delegatedIdentityId, claimCode, password, pin }
```

Règles à connaître :

- **Le code est la seule preuve.** Le `delegatedIdentityId` n'est pas un secret
  (il sort de `/api/claim/lookup`) : connaître l'identifiant ne permet jamais
  de réclamer une identité.
- **Réponse uniforme.** `/api/claim/lookup` renvoie `{ "found": false }` que la
  personne soit inconnue, déjà réclamée ou que le code soit faux — sinon la
  route deviendrait un oracle permettant de découvrir qui détient une identité
  déléguée réclamable.
- **Usage unique.** La réclamation détruit le code ; il ne peut pas être rejoué.
- **Anti-force brute.** 5 tentatives, puis verrouillage 15 minutes — le verrou
  tient même face au code légitime.
- **Durée de vie.** Le code expire au bout de **90 jours**.
- **Exigences de finalisation.** Mot de passe d'au moins 12 caractères, PIN de
  6 chiffres exactement.

Une fois `status: "claimed"`, le citoyen se connecte normalement en OIDC — avec
le même `sub` que celui renvoyé à la création.

---

## 6. Voir aussi

- [`verification-api.md`](./verification-api.md) — connaître et déclencher le
  niveau de vérification (LoA) d'un utilisateur déjà titulaire d'un compte.
