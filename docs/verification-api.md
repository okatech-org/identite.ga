# Vérification d'identité — API pour applications tierces

Comment une application relying party (RP) connaît le **niveau de vérification
d'identité** d'un utilisateur identité.ga, et comment **déclencher** une
vérification pour son compte.

Deux mécanismes complémentaires :

| Besoin | Mécanisme | Mise à jour |
|--------|-----------|-------------|
| Niveau de vérification courant | Claims OIDC `loa` / `acr` (userinfo) | figé au login |
| État d'une demande en cours / action requise | Endpoint `/oauth2/verification` | temps réel (polling) |
| Déclencher une vérification | Authorize avec `acr_values` (step-up) | — |

> Toujours résoudre les URLs d'endpoints depuis le **discovery**
> (`/api/auth/convex/.well-known/openid-configuration`), pas en les codant en
> dur. Issuer par défaut : `https://site.identite.ga`.

---

## 1. Lire le niveau de vérification (claims)

Le niveau est exposé sous le scope **`profile`**, dans la réponse de
**`/oauth2/userinfo`** (et non dans l'id_token) :

| Claim | Type | Valeurs |
|-------|------|---------|
| `loa` | number | `1` (email seul) · `2` / `3` (identité vérifiée) |
| `acr` | string | `eidas1` · `eidas2` · `eidas3` |

```jsonc
// GET /oauth2/userinfo  (Authorization: Bearer <access_token>)
{
  "sub": "…",
  "email": "user@example.com",
  "loa": 2,
  "acr": "eidas2",
  "given_name": "…", "family_name": "…", "birthdate": "…",
  "birth_place": "Libreville", "gender": "M", "nationality": "GA"
}
```

`loa >= 2` ⇒ identité vérifiée. Avec Better Auth `genericOAuth`, mappez ces
claims dans `getUserInfo` / `mapProfileToUser`.

⚠️ Le claim est un **instantané au moment du login**. Il ne reflète pas une
vérification lancée *après*, ni un état « en cours ». Pour ça → section 2.

---

## 2. État d'une vérification en cours (endpoint interrogeable)

```
GET /api/auth/oauth2/verification
Authorization: Bearer <access_token>
```

Renvoie l'état **vivant** de la vérification, interrogeable à tout moment :

```jsonc
{
  "loa": 1,
  "acr": "eidas1",
  "verified": false,
  "verification": {
    "status": "in_progress",      // none | in_progress | action_required | approved | rejected
    "action_required": false,     // l'utilisateur doit agir pour avancer
    "action_url": "https://identite.ga/kyc",  // où l'envoyer
    "message": null,              // message du contrôleur si complément demandé
    "updated_at": 1718000000000   // ms epoch, ou null
  }
}
```

Sémantique de `status` :

| `status` | Signification | Afficher côté RP |
|----------|---------------|------------------|
| `none` | aucune vérification | « Vérifiez votre identité » + bouton |
| `in_progress` | soumise, en cours d'examen | « En cours de vérification… » (rien à faire) |
| `action_required` | l'utilisateur doit finir / compléter | « Action requise » + lien `action_url` |
| `approved` | identité vérifiée (`loa ≥ 2`) | ✓ vérifié |
| `rejected` | demande refusée | proposer de recommencer (`message` = motif) |

Réponses d'erreur : `401` si le Bearer token est absent/invalide/expiré.

### Pattern de polling

Après avoir déclenché une vérification (section 3), interrogez cet endpoint
périodiquement (ex. toutes les 5–10 s tant que l'écran est ouvert, ou au
montage de la page) pour rafraîchir l'UI :

```ts
const { verified, verification } = await fetch(verificationUrl, {
  headers: { Authorization: `Bearer ${accessToken}` },
}).then((r) => r.json())

if (verified) showVerified()
else if (verification.status === "in_progress") showPending()
else if (verification.action_required) showActionLink(verification.action_url)
```

---

## 3. Déclencher une vérification (step-up)

Pour faire vérifier l'identité d'un utilisateur, **relancez le flow OIDC** en
demandant un niveau de garantie via `acr_values`. identité.ga propose alors à
l'utilisateur le parcours de vérification (pièce d'identité + selfie), puis le
renvoie sur votre `redirect_uri` une fois le niveau atteint.

```
GET /api/auth/oauth2/authorize
  ?response_type=code
  &client_id=…
  &redirect_uri=…
  &scope=openid%20profile%20email
  &acr_values=eidas2          ← exige le niveau 2
  &code_challenge=…&code_challenge_method=S256
```

- **Auto-approbation** (OCR + biométrie OK) : l'utilisateur revient déjà en
  `loa=2`.
- **Revue manuelle** : l'utilisateur revient en `loa=1` avec une demande
  `in_progress`. Affichez « en cours de vérification » et **pollez** la
  section 2 ; le niveau passera à 2 une fois approuvé.

> Alternative statique : l'app peut déclarer un `loa` minimum dans ses
> metadata (portail développeur). Le step-up sera alors exigé à chaque
> connexion sans passer `acr_values`.

---

## 4. Avec le SDK `@idn-ga/core`

```ts
import { createIDNClient } from "@idn-ga/core"

const client = createIDNClient({
  clientId: "…",
  redirectUri: "https://votre-app.com/callback",
})

// Lire le niveau + l'état d'une demande en cours
const status = await client.getVerificationStatus()
// → { loa, acr, verified, verification: { status, action_required, action_url, … } } | null

// Déclencher une vérification (step-up niveau 2 par défaut)
await client.requestIdentityVerification()       // = signIn({ acrValues: ["eidas2"] })
await client.requestIdentityVerification(3)       // niveau 3
```

Le niveau est aussi disponible directement sur l'utilisateur de session
(`session.user.loa` / `.acr`), figé au login — voir la nuance section 1.
