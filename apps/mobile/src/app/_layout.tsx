import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react"
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import React, { StrictMode } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { KeyboardProvider } from "react-native-keyboard-controller"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthRouteGuard } from "@/components/auth-route-guard"
import { ThemePreferenceProvider, useThemePreference } from "@/design/theme"
import { authClient } from "@/lib/auth-client"
import { api } from "@/lib/api"
import { VaultProvider } from "@/hooks/use-vault"
import { MobilePushBootstrap } from "@/components/mobile-push-bootstrap"
import { registerLiveKitGlobals } from "@/lib/livekit-globals"

registerLiveKitGlobals()

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL

if (!convexUrl) {
  throw new Error("Missing EXPO_PUBLIC_CONVEX_URL in apps/mobile/.env.local")
}

// `expectAuth` est volontairement omis : il suspend TOUTES les useQuery
// jusqu'à ce que setAuth() ait été appelé, ce qui bloque les écrans
// pre-auth comme signup/idn (vérification de handle, suggestions). Les
// queries qui exigent l'auth utilisent déjà `requireAuth` côté backend
// et throw si appelées non-authentifié — ce qui est le comportement
// attendu et géré par les écrans appelants.
const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
})

export default function RootLayout() {
  return (
    <StrictMode>
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <ThemePreferenceProvider>
          <PreferenceSync />
          <MobilePushBootstrap />
          <AuthRouteGuard />
          <VaultProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <SafeAreaProvider>
                  <ThemedStatusBar />
                  <Stack
                    screenOptions={{ headerShown: false, animation: "default" }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen
                      name="launcher"
                      options={{ animation: "fade" }}
                    />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="id-card"
                      options={{ presentation: "modal" }}
                    />
                    <Stack.Screen
                      name="scanner"
                      options={{ presentation: "modal" }}
                    />
                    <Stack.Screen
                      name="consent"
                      options={{
                        presentation: "formSheet",
                        sheetAllowedDetents: [0.95],
                      }}
                    />
                    <Stack.Screen
                      name="notifications"
                      options={{
                        presentation: "formSheet",
                        sheetAllowedDetents: [0.95],
                      }}
                    />
                    <Stack.Screen name="service/[id]" />
                    <Stack.Screen name="kyc" />
                    <Stack.Screen name="settings" />
                    <Stack.Screen name="icarte" />
                    <Stack.Screen name="iboite" />
                    <Stack.Screen name="activity" />
                    <Stack.Screen name="consents" />
                    <Stack.Screen name="profile-edit" />
                  </Stack>
                </SafeAreaProvider>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </VaultProvider>
        </ThemePreferenceProvider>
      </ConvexBetterAuthProvider>
    </StrictMode>
  )
}

function ThemedStatusBar() {
  const { dark } = useThemePreference()
  return <StatusBar style={dark ? "light" : "dark"} />
}

function PreferenceSync() {
  const { isAuthenticated } = useConvexAuth()
  const preferences = useQuery(
    api.preferences.getMyPreferences,
    isAuthenticated ? {} : "skip",
  )
  const { hydrated, preference, setPreference } = useThemePreference()
  const didHydrateRemotePreference = React.useRef(false)

  React.useEffect(() => {
    if (!isAuthenticated) {
      didHydrateRemotePreference.current = false
      return
    }
    if (hydrated && !didHydrateRemotePreference.current && preferences?.theme) {
      didHydrateRemotePreference.current = true
      if (preferences.theme !== preference)
        void setPreference(preferences.theme)
    }
  }, [hydrated, isAuthenticated, preference, preferences?.theme, setPreference])
  return null
}
