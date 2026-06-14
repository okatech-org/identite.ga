# @idn-ga/core

Client OIDC vanilla pour **Identité Numérique du Gabon (IDN)**. Aucune dépendance runtime, fonctionne en navigateur.

## Installation

```bash
bun add @idn-ga/core
# ou
npm install @idn-ga/core
```

## Usage

```ts
import { createIDNClient } from "@idn-ga/core"

const client = createIDNClient({
  clientId: "votre-client-id",
  redirectUri: "https://votre-app.com/callback",
  // issuer optionnel — défaut : https://site.identite.ga
})

// Démarrer le sign-in (PKCE S256)
await client.signIn()

// Sur votre page de callback
const session = await client.handleCallback()
```

## Vérification d'identité

```ts
// Niveau de vérification + état d'une demande en cours (temps réel)
const status = await client.getVerificationStatus()
// → { loa, acr, verified, verification: { status, action_required, action_url, … } }

// Déclencher une vérification pour l'utilisateur (step-up, niveau 2 par défaut)
await client.requestIdentityVerification()
```

Voir [`docs/verification-api.md`](https://github.com/okatech-org/identite.ga/blob/main/docs/verification-api.md)
pour le contrat complet (claims `loa`/`acr`, endpoint `/oauth2/verification`,
step-up via `acr_values`, polling).

## API

- `createIDNClient(config)` — instancie un client OIDC
- `verifyIdToken(token, opts)` — vérifie la signature et les claims d'un ID token
- `fetchDiscovery(issuer)` — récupère le document `.well-known/openid-configuration`
- `generateVerifier()` / `challengeS256(verifier)` — utilitaires PKCE
- `resolveStorage(kind)` — adaptateurs de stockage (localStorage, sessionStorage, memory)

Voir [`./src/types.ts`](https://github.com/okatech-org/identite.ga/blob/main/packages/sdk/core/src/types.ts) pour les types complets.

## Licence

MIT
