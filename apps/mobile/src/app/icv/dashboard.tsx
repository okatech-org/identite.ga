import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

import { idnTokens } from '@/design/tokens';
import { useIdnTheme } from '@/design/theme';

/**
 * Le contenu du dashboard (score + suggestions + sections) a été déplacé sur
 * `/icv` (l'accueil iCV). Cette route est conservée pour les éventuels liens
 * existants : on redirige immédiatement.
 */
export default function ICVDashboardRedirect() {
  const t = useIdnTheme();
  const router = useRouter();
  useEffect(() => {
    router.replace('/icv' as never);
  }, [router]);
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={idnTokens.green} />
    </View>
  );
}
