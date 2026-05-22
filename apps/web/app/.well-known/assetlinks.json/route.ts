import { NextResponse } from "next/server"

/**
 * Android Digital Asset Links.
 *
 * Servi à `/.well-known/assetlinks.json` avec content-type
 * `application/json`. Utilisé par Android Credential Manager pour
 * valider le lien app ↔ domaine, indispensable au passkey natif
 * (`expo-better-auth-passkey`) et aux App Links Android.
 *
 * Les SHA-256 fingerprints DOIVENT correspondre à toutes les
 * signatures de l'APK/AAB que Credential Manager peut voir :
 *   • `ANDROID_SHA256_UPLOAD` : signature du keystore upload (généré
 *     par EAS pour la première build, ou local).
 *   • `ANDROID_SHA256_PLAY`   : signature « Play App Signing » que
 *     Google Play applique aux builds distribués (visible dans Play
 *     Console → Sécurité de l'app → Certificats de signature de l'app).
 *
 * Les deux peuvent coexister ; on les déclare via env (CSV ou multi-
 * var). Tant qu'on n'a pas encore buildé, on tombe sur une liste vide
 * — le fichier reste servi (HTTP 200 + JSON valide) mais aucun
 * fingerprint n'est validé. Penser à mettre à jour les env avant le
 * premier submit Play.
 *
 * Réf : https://developer.android.com/training/sign-in/passkeys#add-support-dal
 */

const PACKAGE_NAME = "ga.idn.mobile"

function readFingerprints(): string[] {
  // Accepte une valeur unique ou une liste CSV.
  const raw = [
    process.env.ANDROID_SHA256_UPLOAD,
    process.env.ANDROID_SHA256_PLAY,
    process.env.ANDROID_SHA256_FINGERPRINTS,
  ]
    .filter(Boolean)
    .flatMap((v) => v!.split(","))
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
  // Dédup
  return Array.from(new Set(raw))
}

export const dynamic = "force-static"
export const revalidate = 3600

export function GET() {
  const fingerprints = readFingerprints()
  const body = [
    {
      relation: [
        "delegate_permission/common.handle_all_urls",
        "delegate_permission/common.get_login_creds",
      ],
      target: {
        namespace: "android_app",
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]

  return new NextResponse(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
