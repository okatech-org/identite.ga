import React, { useRef, useState } from 'react';
import { FlatList, Pressable, Text, useWindowDimensions, View, type ViewToken } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';
import { ONBOARDING_SLIDES, type Slide } from '@/data/onboarding';
import { ArtIdMark } from '@/components/art/id-mark';
import { ArtSovereign } from '@/components/art/sovereign';
import { ArtConsent } from '@/components/art/consent';
import { ArtCoverage } from '@/components/art/coverage';
import { setOnboardingDone } from '@/hooks/use-app-state';

function Art({ kind, t }: { kind: Slide['art']; t: ReturnType<typeof useIdnTheme> }) {
  if (kind === 'idMark') return <ArtIdMark t={t} />;
  if (kind === 'sovereign') return <ArtSovereign t={t} />;
  if (kind === 'consent') return <ArtConsent t={t} />;
  return <ArtCoverage t={t} />;
}

export default function Onboarding() {
  const t = useIdnTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: SCREEN_W } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  const last = index === ONBOARDING_SLIDES.length - 1;

  async function next() {
    if (last) {
      await setOnboardingDone(true);
      router.replace('/(auth)/hub');
    } else {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  }

  async function skip() {
    await setOnboardingDone(true);
    router.replace('/(auth)/hub');
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 22, paddingVertical: 4 }}>
        <Pressable onPress={skip} hitSlop={8}>
          <Text style={{ color: t.muted, fontSize: 14, fontWeight: '500' }}>Passer</Text>
        </Pressable>
      </View>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <FlatList
          ref={listRef}
          data={ONBOARDING_SLIDES}
          keyExtractor={(s) => s.tag}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_W, paddingHorizontal: 28, justifyContent: 'center' }}>
              <View style={{ alignItems: 'center', height: 200, justifyContent: 'center' }}>
                <Art kind={item.art} t={t} />
              </View>
              <View style={{ marginTop: 28 }}>
                <Text style={{ fontSize: 11, color: idnTokens.green, letterSpacing: 1.4, fontWeight: '600', textAlign: 'center' }}>{item.tag}</Text>
                <Text style={{ fontSize: 24, fontWeight: '700', color: t.ink, letterSpacing: -0.4, lineHeight: 28, marginTop: 10, textAlign: 'center' }}>{item.title}</Text>
                <Text style={{ fontSize: 14, color: t.muted, lineHeight: 22, marginTop: 12, textAlign: 'center' }}>{item.desc}</Text>
              </View>
            </View>
          )}
        />
      </View>
      <View style={{ paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 24) }}>
        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 22 }}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View key={i} style={{
              width: i === index ? 18 : 6, height: 6, borderRadius: 9999,
              backgroundColor: i === index ? idnTokens.green : t.border,
            }} />
          ))}
        </View>
        <IdnButton t={t} variant="primary" size="lg" full onPress={next}>
          {last ? 'Commencer' : 'Continuer'}
        </IdnButton>
      </View>
    </View>
  );
}
