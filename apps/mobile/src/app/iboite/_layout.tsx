import { Stack } from 'expo-router';

export default function IBoiteLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="accounts" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <Stack.Screen name="courrier/[id]" />
      <Stack.Screen name="email/[id]" />
      <Stack.Screen name="compose" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.95] }} />
      <Stack.Screen name="address-setup" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.95] }} />
      <Stack.Screen name="courrier/compose" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.95] }} />
    </Stack>
  );
}
