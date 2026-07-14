import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";
import Constants from "expo-constants";
import { expoPasskeyClient } from "expo-better-auth-passkey";
import * as SecureStore from "expo-secure-store";

const scheme = Constants.expoConfig?.scheme as string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authClient: any = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_CONVEX_SITE_URL,
  plugins: [
    expoClient({
      scheme,
      storagePrefix: scheme,
      storage: SecureStore,
    }),
    // Passkey natif iOS / Android (Face ID / Touch ID / Credential Manager).
    // Sur web, retombe automatiquement sur le WebAuthn navigateur.
    expoPasskeyClient(),
    // 2FA TOTP — enrôlement (enable/verifyTotp/disable) + challenge au login
    // (verifyTotp / verifyBackupCode). Le serveur active twoFactor({issuer:"IDN"}).
    twoFactorClient(),
    convexClient(),
  ],
});
