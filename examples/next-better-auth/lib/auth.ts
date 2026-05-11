import Database from "better-sqlite3"
import { betterAuth } from "better-auth"
import { genericOAuth } from "better-auth/plugins"

import { idn } from "@idn-ga/better-auth"

const sqlite = new Database("./better-auth.db")

/**
 * Better Auth côté app exemple "Bourses Étudiantes".
 *
 * Le helper @idn-ga/better-auth retourne une config genericOAuth pré-remplie :
 * discoveryUrl, PKCE, mapping profil, etc. On l'utilise tel quel.
 *
 * NB : l'issuer pointé est le déploiement Convex (qui héberge le serveur
 * OIDC IDN). En prod ce sera https://identite.ga.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: any = betterAuth({
  database: sqlite,
  emailAndPassword: { enabled: false },
  plugins: [
    genericOAuth({
      config: [
        // @idn-ga/better-auth retourne un Record<string, unknown> pour rester
        // résilient aux évolutions mineures de l'API Better Auth — on cast
        // au call site, le helper garantit la forme attendue.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        idn({
          clientId: process.env.IDN_CLIENT_ID!,
          clientSecret: process.env.IDN_CLIENT_SECRET!,
          issuer: process.env.IDN_ISSUER ?? "https://identite.ga",
          // Override : Better Auth oauth-provider expose la discovery dans
          // la forme RFC 8414 §3.1 (basePath suffixé) — le path standard
          // /api/auth/.well-known/openid-configuration N'EST PAS servi.
          // L'env var IDN_DISCOVERY_URL pointe directement.
          discoveryUrl: process.env.IDN_DISCOVERY_URL!,
          scopes: ["openid", "profile", "email"],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ],
    }),
  ],
})
