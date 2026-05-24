# @idn-ga/better-auth

Helper `genericOAuth` pour [Better Auth](https://www.better-auth.com) — **Identité Numérique du Gabon (IDN)**.

## Installation

```bash
bun add @idn-ga/better-auth better-auth
# ou
npm install @idn-ga/better-auth better-auth
```

## Usage

```ts
import { betterAuth } from "better-auth"
import { genericOAuth } from "better-auth/plugins"
import { idn } from "@idn-ga/better-auth"

export const auth = betterAuth({
  plugins: [
    genericOAuth({
      config: [
        idn({
          clientId: process.env.IDN_CLIENT_ID!,
          clientSecret: process.env.IDN_CLIENT_SECRET!,
          // issuer optionnel — défaut: https://site.identite.ga
        }),
      ],
    }),
  ],
})
```

Le helper retourne une configuration `genericOAuth` pré-remplie avec :

- Discovery automatique (`.well-known/openid-configuration`)
- PKCE S256
- Mapping `userinfo` → `User` Better Auth
- `providerId: "idn"`

## Peer dependencies

- `better-auth` `^1.4.0`

## Licence

MIT
