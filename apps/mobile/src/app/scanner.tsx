import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { idnTokens } from '@/design/tokens';
import { Icon } from '@/design/icons';

function CornerBrackets() {
  return (
    <>
      {([['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']] as const).map(([y, x]) => (
        <View key={`${y}-${x}`} style={{
          position: 'absolute',
          [y]: 0, [x]: 0,
          width: 40, height: 40,
          borderTopWidth: y === 'top' ? 3 : 0,
          borderBottomWidth: y === 'bottom' ? 3 : 0,
          borderLeftWidth: x === 'left' ? 3 : 0,
          borderRightWidth: x === 'right' ? 3 : 0,
          borderColor: idnTokens.green,
        }} />
      ))}
    </>
  );
}

export default function Scanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);
  const lineY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 240] });
  return (
    <View style={{ flex: 1, backgroundColor: '#0E110D', paddingTop: insets.top }}>
      <StatusBar style="light" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 }}>
        <Pressable onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#fff' }}>Scanner un QR</Text>
        <Pressable style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3v3M21 12h-3M12 21v-3M3 12h3" stroke="#fff" strokeWidth={1.6} />
            <Circle cx={12} cy={12} r={5} stroke="#fff" strokeWidth={1.6} />
          </Svg>
        </Pressable>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 240, height: 240 }}>
          <CornerBrackets />
          <Animated.View style={{
            position: 'absolute', left: 0, right: 0,
            top: 0,
            transform: [{ translateY: lineY }],
            height: 2,
            backgroundColor: idnTokens.green,
            shadowColor: idnTokens.green, shadowOpacity: 0.7, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
          }} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 30), alignItems: 'center' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Pointez la caméra vers le QR</Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'center' }}>
          Connexion sécurisée à un site IDN ou présentation à un contrôleur
        </Text>
        <View style={{
          marginTop: 22, padding: 14, backgroundColor: 'rgba(255,255,255,0.08)',
          borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
        }}>
          <Icon name="shield" size={20} color={idnTokens.green} />
          <Text style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.86)' }}>
            L'authentification cross-device chiffre votre identité avant de la transmettre.
          </Text>
        </View>
      </View>
    </View>
  );
}
