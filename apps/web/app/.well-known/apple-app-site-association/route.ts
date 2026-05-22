import { NextResponse } from "next/server"

/**
 * Apple App Site Association (AASA).
 *
 * Servi sans extension, content-type `application/json`. Utilisé par
 * iOS pour valider :
 *   • le lien webcredentials app ↔ domaine (passkey natif, AutoFill
 *     credentials) — `app.json` déclare `webcredentials:identite.ga`
 *     et `webcredentials:connect.identite.ga` (l'AASA de
 *     `connect.identite.ga` est servi par `apps/connect/`) ;
 *   • les universal links (`applinks` — vide pour l'instant, on
 *     activera quand l'app gérera des deep links vers le web).
 *
 * Le champ `apps[]` du bloc `webcredentials` doit être au format
 * `<TEAM_ID>.<bundleIdentifier>`. Le bundle id mobile est
 * `ga.idn.mobile` (cf. `apps/mobile/app.json`).
 *
 * Le Team ID est lu dans `APPLE_TEAM_ID` (env) — défaut à la valeur
 * actuelle du compte Apple Developer IDN (5Y39TTNCM7) pour éviter de
 * laisser le fichier inopérant en cas d'env manquante.
 *
 * Le fichier DOIT être servi en HTTPS sans redirection. Cache court
 * (l'app iOS le re-vérifie périodiquement).
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
