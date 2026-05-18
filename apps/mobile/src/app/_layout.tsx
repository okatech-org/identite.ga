import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StrictMode } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { authClient } from '@/lib/auth-client';
import { VaultProvider } from '@/hooks/use-vault';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error('Missing EXPO_PUBLIC_CONVEX_URL in apps/mobile/.env.local');
}

const convex = new ConvexReactClient(convexUrl, {
  expectAuth: true,
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <StrictMode>
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <VaultProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <Stack screenOptions={{ headerShown: false, animation: 'default' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="launcher" options={{ animation: 'fade' }} />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="id-card" options={{ presentation: 'modal' }} />
              <Stack.Screen name="scanner" options={{ presentation: 'modal' }} />
              <Stack.Screen name="consent" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.95] }} />
              <Stack.Screen name="notifications" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.95] }} />
              <Stack.Screen name="service/[id]" />
              <Stack.Screen name="kyc" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="icarte" />
              <Stack.Screen name="iboite" />
              <Stack.Screen name="activity" />
            </Stack>
          </SafeAreaProvider>
        </GestureHandlerRootView>
        </VaultProvider>
      </ConvexBetterAuthProvider>
    </StrictMode>
  );
}
