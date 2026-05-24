import Database from "better-sqlite3"
import { betterAuth } from "better-auth"
import { genericOAuth } from "better-auth/plugins"

import { idn } from "@idn-ga/better-auth"

const sqlite = new Database("./better-auth.db")

/**
 * Better Auth côté app exemple "Bourses Étudiantes".
 *
 * Le helper @idn-ga/better-auth retourne une config genericOAuth pré-remplie
 * (discoveryUrl, PKCE, mapping profil) pointant par défaut sur la prod IDN.
 * En dev local, override via IDN_ISSUER (et éventuellement IDN_DISCOVERY_URL
 * si on tape directement le *.convex.site sans custom domain).
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
          ...(process.env.IDN_ISSUER ? { issuer: process.env.IDN_ISSUER } : {}),
          ...(process.env.IDN_DISCOVERY_URL
            ? { discoveryUrl: process.env.IDN_DISCOVERY_URL }
            : {}),
          scopes: ["openid", "profile", "email"],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      ],
    }),
  ],
})
