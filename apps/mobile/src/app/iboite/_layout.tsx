import { Stack } from 'expo-router';

export default function IBoiteLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="accounts" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      <Stack.Screen name="courrier/[id]" />
      <Stack.Screen name="email/[id]" />
      {/* `headerShown: false` est explicite ici parce que le `screenOptions`
          parent peut être ignoré quand on bascule en `presentation: 'formSheet'`
          (iOS affiche alors sa nav bar native qui masque notre `NSheetHeader`). */}
      <Stack.Screen
        name="compose"
        options={{ presentation: 'formSheet', sheetAllowedDetents: [0.95], headerShown: false }}
      />
      <Stack.Screen
        name="address-setup"
        options={{ presentation: 'formSheet', sheetAllowedDetents: [0.95], headerShown: false }}
      />
      <Stack.Screen
        name="courrier/compose"
        options={{ presentation: 'formSheet', sheetAllowedDetents: [0.95], headerShown: false }}
      />
    </Stack>
  );
}
