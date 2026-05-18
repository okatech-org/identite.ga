import { Stack } from 'expo-router';

export default function IDocLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="folder/[id]" />
      <Stack.Screen name="preview/[id]" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.95] }} />
      <Stack.Screen name="add" />
      <Stack.Screen name="add-preview" />
      <Stack.Screen name="add-success" />
      <Stack.Screen name="request" />
    </Stack>
  );
}
