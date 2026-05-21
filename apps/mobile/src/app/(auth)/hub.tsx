import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnMark } from '@/design/mark';
import { IdnButton } from '@/design/components/idn-button';
import { Icon } from '@/design/icons';

export default function AuthHub() {
  const t = useIdnTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 40, paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 26) }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: 32 }}>
        <View style={{ alignItems: 'center', gap: 14 }}>
          <IdnMark size={56} />
          <Text style={{ fontSize: 11, color: t.muted, letterSpacing: 1.4, fontWeight: '600' }}>RÉPUBLIQUE GABONAISE</Text>
          <Text style={{ fontSize: 24, fontWeight: '700', color: t.ink, letterSpacing: -0.4 }}>Identité Numérique</Text>
        </View>
        <View style={{ gap: 10 }}>
          <IdnButton t={t} variant="primary" size="lg" full leadIcon={<Icon name="userPlus" size={20} color="#fff" />} onPress={() => router.push('/(auth)/signup/profil')}>
            Créer un compte IDN
          </IdnButton>
          <IdnButton t={t} variant="ghost" size="lg" full leadIcon={<Icon name="login" size={20} color={t.ink} />} onPress={() => router.push('/(auth)/login')}>
            J'ai déjà un compte
          </IdnButton>
        </View>
      </View>
      <Text style={{ fontSize: 11, color: t.mutedSoft, textAlign: 'center', lineHeight: 17 }}>
        En continuant, vous acceptez les <Text style={{ color: idnTokens.green, fontWeight: '500' }}>conditions d'utilisation</Text> et la <Text style={{ color: idnTokens.green, fontWeight: '500' }}>politique de confidentialité</Text> IDN.
      </Text>
    </View>
  );
}
