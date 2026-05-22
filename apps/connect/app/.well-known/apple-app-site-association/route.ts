import { NextResponse } from "next/server"

/**
 * Apple App Site Association (AASA) servi sur `connect.identite.ga`.
 *
 * `connect.identite.ga` est l'origin Better Auth (OAuth + sign-in)
 * référencé en `webcredentials:` dans `apps/mobile/app.json`. iOS
 * fetch ce fichier pour valider le lien app ↔ domaine, indispensable
 * au passkey natif (Face ID / Touch ID via `expo-better-auth-passkey`).
 *
 * Bundle iOS : `ga.idn.mobile`. Team ID Apple Developer : `5Y39TTNCM7`
 * (override via env `APPLE_TEAM_ID` si besoin).
 *
 * Réf : https://developer.apple.com/documentation/xcode/supporting-associated-domains
 */

const TEAM_ID = process.env.APPLE_TEAM_ID ?? "5Y39TTNCM7"
const BUNDLE_ID = "ga.idn.mobile"

export const dynamic = "force-static"
export const revalidate = 3600

export function GET() {
  const body = {
    applinks: {
      apps: [],
      details: [] as unknown[],
    },
    webcredentials: {
      apps: [`${TEAM_ID}.${BUNDLE_ID}`],
    },
  }

  return new NextResponse(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
