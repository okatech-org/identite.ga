# `@idn/mobile` — Identité Numérique (Expo)

App mobile React Native / Expo SDK 55. Cible : iOS 16+ et Android 9+
(API 28). Distribution prévue via TestFlight + Google Play Open Testing.

## Stack

- Expo SDK 55 · React 19.2 · React Native 0.83 (new arch + react-compiler)
- expo-router (typed routes), expo-updates (OTA, fingerprint runtime)
- Convex (`@repo/backend/convex/_generated/api`)
- Better Auth + `@better-auth/expo` + `expo-better-auth-passkey`

## Démarrage local

```bash
# Depuis la racine du monorepo
bun install

# Configurer l'environnement
cp apps/mobile/.env.local.example apps/mobile/.env.local
# Renseigner EXPO_PUBLIC_CONVEX_URL et EXPO_PUBLIC_SENTRY_DSN (optionnel)

# Lancer Convex en parallèle
cd packages/backend && bunx convex dev
# (laisser tourner)

# Démarrer Expo
cd apps/mobile
bunx expo start
```

Pour tester sur device réel avec passkey natif (Face ID / Credential
Manager), un dev client est requis (Expo Go ne supporte pas
`expo-better-auth-passkey`). Voir [PASSKEY_SETUP.md](./PASSKEY_SETUP.md).

```bash
bunx expo prebuild --clean
bunx expo run:ios     # ou run:android
```

## Build production (TestFlight + Play Open Testing)

Configuré via `eas.json` :

```bash
# Build sur EAS, profile preview (TestFlight External + Play Open)
bunx eas build --profile preview --platform all

# Submit après build
bunx eas submit --profile preview --platform all --latest
```

Le workflow GitHub Actions `.github/workflows/deploy-mobile.yml` automatise
ce flux. Trigger manuel (`workflow_dispatch`) ou via tag `mobile-vX.Y.Z`.

## Secrets requis

### GitHub Actions
- `EXPO_TOKEN` — depuis https://expo.dev/accounts/<org>/settings/access-tokens
- `EXPO_APPLE_APP_SPECIFIC_PASSWORD` — depuis https://appleid.apple.com/account/manage
- `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` — JSON encodé base64, depuis Play
  Console → Configuration → API Access

### Local
- `apps/mobile/.env.local` (non commité) — Convex URLs (cf. `.env.local.example`)
- `apps/mobile/credentials/play-service-account.json` (non commité) — pour
  `eas submit android` en local

### Convex (à fixer une fois prod déployé)
```bash
bunx convex env set PASSKEY_RP_ID identite.ga
bunx convex env set PASSKEY_RP_ORIGINS "https://identite.ga,android:apk-key-hash:<BASE64_SHA256>"
```

## Domaines

- `identite.ga` doit servir `/.well-known/apple-app-site-association` et
  `/.well-known/assetlinks.json` (cf. `apps/web/app/.well-known/`).
- Bundle iOS : `ga.idn.mobile` · Team ID : `5Y39TTNCM7`
- Package Android : `ga.idn.mobile`
