import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useConvexAuth, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';
import { Icon } from '@/design/icons';
import { DOC_FOLDERS } from '@/data/documents';
import { api } from '@/lib/api';

export default function DocAddSuccess() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const summary = useQuery(api.idoc.summary, isAuthenticated ? {} : 'skip');

  // Le dossier le plus récemment ajouté n'est pas exposé par add.tsx ;
  // on affiche celui qui a la plus grosse population — heuristique
  // simple pour donner un contexte visuel.
  const counts = new Map((summary ?? []).map((s) => [s.folderId as string, s.count]));
  const top = DOC_FOLDERS.slice()
    .map((f) => ({ folder: f, count: counts.get(f.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)[0];
  const folder = top?.folder ?? DOC_FOLDERS[0];
  const folderCount = top?.count ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 40, paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 26) }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <View style={{ width: 96, height: 96, borderRadius: 9999, backgroundColor: idnTokens.green, alignItems: 'center', justifyContent: 'center', shadowColor: idnTokens.green, shadowOpacity: 0.35, shadowRadius: 32, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}>
          <Icon name="checkCir" size={44} color="#fff" />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: t.ink, letterSpacing: -0.4 }}>Document ajouté !</Text>
          <Text style={{ fontSize: 13, color: t.muted, marginTop: 10, lineHeight: 21, maxWidth: 280, textAlign: 'center' }}>
            Votre document est chiffré et stocké. Il restera lisible uniquement après déverrouillage du coffre.
          </Text>
        </View>
        <View style={{ width: '100%', maxWidth: 280, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden' }}>
            <LinearGradient colors={folder.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={folder.icon} size={16} color="#fff" />
            </LinearGradient>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: t.ink, fontWeight: '600' }}>{folder.label}</Text>
            <Text style={{ fontSize: 11, color: t.muted }}>
              {folderCount} document{folderCount > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
      <IdnButton t={t} variant="primary" size="lg" full onPress={() => router.replace('/idoc' as never)}>
        Retour aux documents
      </IdnButton>
      <Pressable onPress={() => router.replace('/idoc/add' as never)} style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 13, fontWeight: '500' }}>Ajouter un autre</Text>
      </Pressable>
    </View>
  );
}
