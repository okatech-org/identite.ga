# Passkey natif — Setup iOS / Android / serveur

L'enrôlement et la connexion par passkey requièrent une configuration
plateforme côté device **ET** côté serveur. Sans ces étapes, l'app
peut crasher à l'appel de `authClient.passkey.addPasskey()` ou
recevoir une erreur `NotAllowedError`.

## 1. iOS — Associated Domains

`app.json` déclare déjà :

```json
"ios": {
  "bundleIdentifier": "ga.idn.mobile",
  "associatedDomains": [
    "webcredentials:idn.ga",
    "webcredentials:auth.idn.ga"
  ]
}
```

Pour que iOS valide le lien app ↔ domaine, **servir** un fichier
`apple-app-site-association` (sans extension, content-type
`application/json`) sur chaque domaine listé :

```
https://idn.ga/.well-known/apple-app-site-association
https://auth.idn.ga/.well-known/apple-app-site-association
```

Contenu :

```json
{
  "applinks": { "apps": [], "details": [] },
  "webcredentials": {
    "apps": ["<TEAM_ID>.ga.idn.mobile"]
  }
}
```

`<TEAM_ID>` = Apple Developer Team ID (10 chars). Le fichier doit être
servi **en HTTPS valide** (pas de redirection, pas de cert auto-signé).

Vérification :

```bash
curl -i https://idn.ga/.well-known/apple-app-site-association | head
```

## 2. Android — Credential Manager + APK key hash

Le bundle identifier Android est `ga.idn.mobile` (cf. `app.json`).

Récupérer le SHA-256 du keystore qui signe l'APK (debug ou Play Signing) :

```bash
# Debug
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android \
  | grep 'SHA256:'

# Production (depuis la console Play, App signing → SHA-256)
```

Convertir le fingerprint hexadécimal en base64 (sans padding, sans
les `:` séparateurs), puis ajouter une entrée dans `PASSKEY_RP_ORIGINS`
côté Convex (cf. §3) au format :

```
android:apk-key-hash:<BASE64_SHA256>
```

Better Auth reconnaît ce schéma pour valider les passkeys créés depuis
l'APK. Sans ça, Credential Manager refuse de signer.

> Astuce : un script `node -e` simple convertit hex → base64url :
> ```bash
> node -e "const hex='AA:BB:...'.replace(/:/g,''); console.log(Buffer.from(hex,'hex').toString('base64').replace(/=+$/,''))"
> ```

Sur device : Android 9+ (API 28) + Google Play Services 23.30+.

## 3. Variables d'environnement Convex

```bash
bunx convex env set PASSKEY_RP_ID idn.ga
bunx convex env set PASSKEY_RP_ORIGINS "https://idn.ga,https://auth.idn.ga,android:apk-key-hash:<BASE64_SHA256>"
```

- `PASSKEY_RP_ID` : hostname (sans schéma ni port). Doit matcher la
  partie après `webcredentials:` dans `app.json`.
- `PASSKEY_RP_ORIGINS` : CSV des origines HTTPS prod + les
  `android:apk-key-hash:` (1 par signature, debug + prod si besoin).
  Le scheme `idn://` est toujours autorisé automatiquement par le
  plugin (cf. `packages/backend/convex/auth.ts`).

En dev local : `PASSKEY_RP_ID=localhost` + ajouter
`http://localhost:8081`, `http://localhost:8082` aux origins. Sur web
local (HTTP), les passkeys ne fonctionnent qu'à condition que le RP
soit `localhost` exactement (exception WebAuthn pour le dev).

## 4. Dev client requis

`expo-better-auth-passkey` est un module natif — **il ne fonctionne
PAS dans Expo Go**. Il faut un dev client :

```bash
cd apps/mobile
bunx expo prebuild --clean
bunx expo run:ios     # ou run:android
```

Une fois le dev client installé sur le device, l'enrôlement Face ID /
Touch ID / Credential Manager s'enchaîne nativement à l'appel
`authClient.passkey.addPasskey({ name: 'Face ID' })`.

## 5. Smoke test

Sur device, après `bunx expo run:ios` :

1. Créer un compte via le signup (étape "Activer Face ID" en fin de flow).
   Le système affiche le prompt natif d'enrôlement passkey.
2. Se déconnecter (Profil → Se déconnecter).
3. Sur l'écran de connexion → bouton "Se connecter avec un passkey".
   Le système affiche le prompt d'authentification natif.
4. Vérifier dans Convex `passkey` table (composant Better Auth) qu'une
   ligne existe pour le `userId`.
