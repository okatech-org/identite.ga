import { NextResponse } from "next/server"

/**
 * Android Digital Asset Links servi sur `connect.identite.ga`.
 *
 * Android Credential Manager fetch ce fichier pour valider le lien
 * app ↔ domaine, indispensable au passkey natif via
 * `expo-better-auth-passkey`.
 *
 * Les SHA-256 fingerprints sont injectés via env :
 *   - `ANDROID_SHA256_UPLOAD` : signature du keystore upload
 *   - `ANDROID_SHA256_PLAY`   : signature Play App Signing
 *   - `ANDROID_SHA256_FINGERPRINTS` : liste CSV alternative
 *
 * Tant qu'on n'a pas encore buildé, la liste est vide — penser à
 * mettre à jour avant le premier submit Play.
 */

const PACKAGE_NAME = "ga.idn.mobile"

function readFingerprints(): string[] {
  const raw = [
    process.env.ANDROID_SHA256_UPLOAD,
    process.env.ANDROID_SHA256_PLAY,
    process.env.ANDROID_SHA256_FINGERPRINTS,
  ]
    .filter(Boolean)
    .flatMap((v) => v!.split(","))
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
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
