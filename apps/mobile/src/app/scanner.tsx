import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Platform, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useConvexAuth, useMutation } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { idnTokens } from '@/design/tokens';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';

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

const QR_PREFIX = 'idn:cross-device:';

function extractSessionCode(raw: string): string | null {
  if (raw.startsWith(QR_PREFIX)) return raw.slice(QR_PREFIX.length);
  // Tolère un QR contenant juste un code base64url ≥ 12 chars.
  if (/^[A-Za-z0-9_-]{12,32}$/.test(raw)) return raw;
  return null;
}

export default function Scanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const approveSession = useMutation(api.crossDevice.approveSession);
  const [busy, setBusy] = useState(false);
  const lastCode = useRef<string | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!permission) return;
    if (!permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  async function handleScan(data: string) {
    if (busy || lastCode.current === data) return;
    const code = extractSessionCode(data);
    if (!code) return;
    lastCode.current = data;
    if (!isAuthenticated) {
      Alert.alert('Connexion requise', 'Connectez-vous d\'abord pour approuver une session sur un autre appareil.');
      router.back();
      return;
    }
    setBusy(true);
    try {
      await approveSession({ sessionCode: code });
      Alert.alert('Connecté', 'Vous êtes maintenant connecté·e sur l\'autre appareil.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Échec', err instanceof Error ? err.message : 'Impossible d\'approuver cette session.');
      lastCode.current = null;
      setBusy(false);
    }
  }

  const lineY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 240] });
  const canScan = permission?.granted && Platform.OS !== 'web';

  return (
    <View style={{ flex: 1, backgroundColor: '#0E110D', paddingTop: insets.top }}>
      <StatusBar style="light" />
      {canScan ? (
        <CameraView
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={(e) => handleScan(e.data)}
        />
      ) : null}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, zIndex: 1 }}>
        <Pressable onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#fff' }}>Scanner un QR</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        <View style={{ width: 240, height: 240 }}>
          <CornerBrackets />
          {canScan ? (
            <Animated.View style={{
              position: 'absolute', left: 0, right: 0,
              top: 0,
              transform: [{ translateY: lineY }],
              height: 2,
              backgroundColor: idnTokens.green,
              shadowColor: idnTokens.green, shadowOpacity: 0.7, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
            }} />
          ) : null}
        </View>
      </View>
      <View style={{ paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 30), alignItems: 'center', zIndex: 1 }}>
        {Platform.OS === 'web' ? (
          <Text style={{ fontSize: 13, color: '#fff', textAlign: 'center', lineHeight: 19 }}>
            Le scanner QR n’est pas disponible en navigateur web. Utilisez l’app mobile.
          </Text>
        ) : !permission?.granted ? (
          <>
            <Text style={{ fontSize: 13, color: '#fff', textAlign: 'center', lineHeight: 19 }}>
              Autorisez l’accès à la caméra pour scanner un QR.
            </Text>
            <Pressable onPress={requestPermission} style={{ marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 9999, backgroundColor: idnTokens.green }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Autoriser la caméra</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{busy ? 'Approbation…' : 'Pointez la caméra vers le QR'}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6, textAlign: 'center' }}>
              Affichez le QR de connexion sur votre ordinateur, puis pointez-le.
            </Text>
            <View style={{ marginTop: 22, padding: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Icon name="shield" size={20} color={idnTokens.green} />
              <Text style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.86)' }}>
                Ne scannez que les QR affichés sur idn.ga ou vos appareils.
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
