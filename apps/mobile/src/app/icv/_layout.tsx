import { Stack } from 'expo-router';

export default function ICVLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="list" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="edit" />
      <Stack.Screen
        name="themes"
        options={{ presentation: 'formSheet', sheetAllowedDetents: [0.85, 0.95] }}
      />
      <Stack.Screen
        name="import"
        options={{ presentation: 'formSheet', sheetAllowedDetents: [0.6, 0.85] }}
      />
      <Stack.Screen
        name="optimize"
        options={{ presentation: 'formSheet', sheetAllowedDetents: [0.7, 0.95] }}
      />
      <Stack.Screen
        name="ats"
        options={{ presentation: 'formSheet', sheetAllowedDetents: [0.7, 0.95] }}
      />
      <Stack.Screen
        name="create"
        options={{ presentation: 'formSheet', sheetAllowedDetents: [0.45] }}
      />
      <Stack.Screen
        name="rename"
        options={{ presentation: 'formSheet', sheetAllowedDetents: [0.35] }}
      />
    </Stack>
  );
}
