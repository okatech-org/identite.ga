import { Stack } from 'expo-router';
import { VaultGate } from '@/components/vault/vault-gate';

export default function IDocLayout() {
  return (
    <VaultGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="folder/[id]" />
        <Stack.Screen name="preview/[id]" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.95] }} />
        <Stack.Screen name="add" />
        <Stack.Screen name="add-success" />
      </Stack>
    </VaultGate>
  );
}
