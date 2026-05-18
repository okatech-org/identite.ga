import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
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
    convexClient(),
  ],
});
