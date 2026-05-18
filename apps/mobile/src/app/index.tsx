import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useConvexAuth } from 'convex/react';
import { useAppState } from '@/hooks/use-app-state';
import { useIdnTheme } from '@/design/theme';

export default function Index() {
  const state = useAppState();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const t = useIdnTheme();

  if (!state.ready || isLoading) {
    return <View style={{ flex: 1, backgroundColor: t.bg }} />;
  }
  if (!state.onboardingDone) return <Redirect href="/onboarding" />;
  if (isAuthenticated) return <Redirect href="/launcher" />;
  return <Redirect href="/(auth)/hub" />;
}
