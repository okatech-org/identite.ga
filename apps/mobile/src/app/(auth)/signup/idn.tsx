import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NStepShell } from '@/components/chrome/step-shell';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';
import {
  getOnboardingHandle,
  getOnboardingPivot,
  getOnboardingProfile,
  setOnboardingHandle,
  type OnboardingPivot,
  type OnboardingProfile,
} from '@/hooks/use-onboarding-state';

const HANDLE_REGEX = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export default function SignupIdn() {
  const t = useIdnTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [pivot, setPivot] = useState<OnboardingPivot | null>(null);
  const [handle, setHandle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getOnboardingProfile();
      const pv = await getOnboardingPivot();
      const savedHandle = await getOnboardingHandle();
      if (!p || !pv) {
        router.replace('/(auth)/signup/profil');
        return;
      }
      setProfile(p);
      setPivot(pv);
      if (savedHandle) setHandle(savedHandle);
    })();
  }, [router]);

  const suggestions = useQuery(
    api.onboarding.suggestIdnHandles,
    pivot
      ? {
          firstName: pivot.firstName,
          lastName: pivot.lastName,
          dateOfBirth: pivot.dateOfBirth,
        }
      : 'skip',
  );

  useEffect(() => {
    if (!suggestions || suggestions.length === 0 || handle) return;
    const first = suggestions.find((s) => s.available) ?? suggestions[0];
    if (first) setHandle(first.handle);
  }, [suggestions, handle]);

  const handleNormalized = handle.trim().toLowerCase();
  const handleValid = handleNormalized.length >= 3 && handleNormalized.length <= 32 && HANDLE_REGEX.test(handleNormalized);
  const availability = useQuery(api.onboarding.checkIdnHandleAvailability, handleValid ? { handle: handleNormalized } : 'skip');

  const status = useMemo(() => {
    if (!handle) {
      return { ok: false, neutral: true, label: 'Saisissez votre identifiant' };
    }
    if (!handleValid) {
      return {
        ok: false,
        neutral: false,
        label: 'Caractères autorisés : lettres minuscules, chiffres, points, tirets.',
      };
    }
    if (!availability) {
      return { ok: false, neutral: true, label: 'Vérification…' };
    }
    if (availability.available) {
      return {
        ok: true,
        neutral: false,
        label: 'Disponible — vous pouvez la réserver',
      };
    }
    return {
      ok: false,
      neutral: false,
      label: 'Cette adresse est déjà attribuée à un autre citoyen',
    };
  }, [handle, handleValid, availability]);

  const isTaken = handleValid && availability && !availability.available;

  async function reserve() {
    if (!profile || !pivot || !handleValid || !availability?.available) return;
    setError(null);
    await setOnboardingHandle(handleNormalized);
    router.push('/(auth)/signup/pin');
  }

  const visibleSuggestions = suggestions ? suggestions.slice(0, 4) : [];

  return (
    <NStepShell
      t={t}
      step={3}
      total={5}
      title="Votre adresse IDN"
      sub="Choisissez l'adresse qui vous identifiera auprès de l'administration."
      onBack={() => router.back()}
      onPrimary={reserve}
      primary="Réserver cette adresse"
    >
      <View>
        <Text
          style={{
            fontSize: idnTokens.text.label,
            fontWeight: '600',
            color: t.ink,
            marginBottom: 8,
          }}
        >
          Identifiant
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.surface,
            borderWidth: 1.5,
            borderColor: status.ok ? idnTokens.green : isTaken ? '#B83A3A' : t.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            height: 52,
          }}
        >
          <TextInput
            value={handle}
            onChangeText={(v) => setHandle(v.toLowerCase())}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="prenom.nom"
            placeholderTextColor={t.muted}
            style={{
              flex: 1,
              color: t.ink,
              fontSize: 16,
              fontFamily: idnTokens.mono,
              fontWeight: '500',
              paddingVertical: 0,
              height: '100%',
            }}
          />
          <Text
            style={{
              fontFamily: idnTokens.mono,
              fontSize: 16,
              color: t.muted,
              fontWeight: '500',
            }}
          >
            @idn.ga
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              backgroundColor: status.neutral ? t.muted : status.ok ? idnTokens.green : '#B83A3A',
            }}
          />
          <Text
            style={{
              fontSize: idnTokens.text.footnote,
              fontWeight: '500',
              color: status.neutral ? t.muted : status.ok ? idnTokens.green : idnTokens.danger,
              flex: 1,
            }}
          >
            {status.label}
          </Text>
        </View>
      </View>

      <View>
        <Text
          style={{
            fontSize: idnTokens.text.footnote,
            color: t.muted,
            letterSpacing: 1,
            fontWeight: '700',
            marginBottom: 12,
          }}
        >
          {isTaken ? 'DISPONIBLES POUR VOUS' : 'SUGGESTIONS'}
        </Text>
        <View style={{ gap: 8 }}>
          {visibleSuggestions.map((s, i) => {
            const sel = s.handle === handleNormalized;
            return (
              <Pressable
                key={s.handle}
                onPress={() => s.available && setHandle(s.handle)}
                disabled={!s.available}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: sel ? idnTokens.green : t.border,
                  backgroundColor: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
                  borderRadius: 10,
                  opacity: s.available ? 1 : 0.5,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 9999,
                    backgroundColor: s.available ? idnTokens.green : '#B83A3A',
                  }}
                />
                <Text
                  style={{
                    flex: 1,
                    fontFamily: idnTokens.mono,
                    fontSize: 13,
                    color: t.ink,
                    fontWeight: '500',
                  }}
                  numberOfLines={1}
                >
                  {s.handle}
                  <Text style={{ color: t.muted }}>@idn.ga</Text>
                </Text>
                {i === 0 && s.available && !isTaken ? (
                  <Text
                    style={{
                      fontSize: 10.5,
                      fontWeight: '600',
                      color: idnTokens.green,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 9999,
                      backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft,
                      letterSpacing: 0.2,
                    }}
                  >
                    Recommandé
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={{
          backgroundColor: t.dark ? '#10243A' : idnTokens.blueSoft,
          padding: 12,
          borderRadius: 10,
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
        }}
      >
        <Icon name="shield" size={20} color={idnTokens.blue} />
        <Text
          style={{
            flex: 1,
            fontSize: idnTokens.text.footnote,
            color: t.ink2,
            lineHeight: 20,
          }}
        >
          L’adresse{' '}
          <Text
            style={{
              fontFamily: idnTokens.mono,
              color: t.ink,
              fontWeight: '600',
            }}
          >
            @idn.ga
          </Text>{' '}
          est hébergée sur le sol gabonais. Elle est définitive et reste valide à vie.
        </Text>
      </View>

      {error ? (
        <View
          style={{
            backgroundColor: t.dark ? '#3A1212' : '#FBE5E5',
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Text
            style={{
              color: idnTokens.danger,
              fontSize: idnTokens.text.footnote,
              lineHeight: 19,
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}
    </NStepShell>
  );
}
