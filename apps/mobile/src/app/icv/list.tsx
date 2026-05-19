import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useAction, useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Icon } from '@/design/icons';
import { idnTokens } from '@/design/tokens';
import { useIdnTheme } from '@/design/theme';
import { NLargeHeader } from '@/components/chrome/large-header';
import {
  ICV_ACCENT,
  ICV_ACCENT_SOFT_DARK,
  ICV_ACCENT_SOFT_LIGHT,
  icvStrings,
} from '@/data/cv';

const SOURCE_LABEL: Record<string, string> = {
  onboarding: icvStrings.selector.sourceOnboarding,
  manual: icvStrings.selector.sourceManual,
  ai_optimize: icvStrings.selector.sourceAi,
  import: icvStrings.selector.sourceImport,
};

export default function ICVList() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cvs = useQuery(api.cv.cvs.listMine);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title={icvStrings.list.title}
        sub={cvs ? `${cvs.length}/10` : undefined}
        onBack={() => router.back()}
        right={
          <Pressable
            onPress={() => router.push('/icv/create' as never)}
            disabled={!cvs || cvs.length >= 10}
            hitSlop={6}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 9999,
              backgroundColor: idnTokens.green,
              opacity: cvs && cvs.length >= 10 ? 0.5 : 1,
            }}
          >
            <Icon name="plus" size={12} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
              Nouveau
            </Text>
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingBottom: insets.bottom + 24,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {cvs === undefined ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={idnTokens.green} />
          </View>
        ) : cvs.length === 0 ? (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: t.ink2, fontWeight: '600' }}>
              {icvStrings.list.empty}
            </Text>
            <Pressable
              onPress={() => router.push('/icv/create' as never)}
              style={{
                marginTop: 12,
                paddingHorizontal: 18,
                paddingVertical: 10,
                backgroundColor: idnTokens.green,
                borderRadius: 9999,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                {icvStrings.list.emptyCta}
              </Text>
            </Pressable>
          </View>
        ) : (
          cvs.map((cv) => <CvRow key={cv._id} cv={cv} canSafelyDelete={cvs.length > 1} />)
        )}
      </ScrollView>
    </View>
  );
}

interface CvSummary {
  _id: Id<'citizenCv'>;
  name: string;
  isDefault: boolean;
  source: 'onboarding' | 'manual' | 'ai_optimize' | 'import';
  completionScore: number;
  updatedAt: number;
}

function CvRow({ cv, canSafelyDelete }: { cv: CvSummary; canSafelyDelete: boolean }) {
  const t = useIdnTheme();
  const router = useRouter();
  const create = useMutation(api.cv.cvs.create);
  const setDefault = useMutation(api.cv.cvs.setDefault);
  const remove = useMutation(api.cv.cvs.remove);
  const renderPdf = useAction(api.cv.export.renderPdf);
  const [busy, setBusy] = useState(false);

  async function handleDuplicate() {
    if (busy) return;
    setBusy(true);
    try {
      const id = await create({ name: `${cv.name} (copie)`, copyFromCvId: cv._id });
      router.push(`/icv?cv=${id}` as never);
    } catch (e) {
      const msg = (e as Error).message;
      Alert.alert(
        'Erreur',
        msg.includes('CV_LIMIT_REACHED') ? icvStrings.list.limit : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSetDefault() {
    if (busy || cv.isDefault) return;
    setBusy(true);
    try {
      await setDefault({ cvId: cv._id });
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message ?? 'Échec.');
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    if (busy || cv.isDefault) {
      Alert.alert('Info', icvStrings.list.cannotDeleteDefault);
      return;
    }
    Alert.alert(
      icvStrings.list.confirmRemoveTitle,
      icvStrings.list.confirmRemove(cv.name),
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: icvStrings.list.actions.remove,
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await remove({ cvId: cv._id });
            } catch (e) {
              Alert.alert('Erreur', (e as Error).message ?? 'Échec.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  async function handlePdf() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await renderPdf({ cvId: cv._id });
      const { Linking } = await import('react-native');
      await Linking.openURL(result.url);
    } catch (e) {
      const msg = (e as Error).message ?? '';
      Alert.alert(
        'Erreur',
        msg.includes('cvExport') || msg.includes('RATE_LIMIT')
          ? icvStrings.actions.pdfRateLimit
          : icvStrings.actions.pdfFailed,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <Pressable
        onPress={() => router.push(`/icv?cv=${cv._id}` as never)}
        disabled={busy}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
      >
        <View
          style={{
            width: 38,
            height: 50,
            backgroundColor: t.dark ? '#1A1A1F' : '#F0F0EB',
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="file" size={18} color={t.mutedSoft} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{ fontSize: 14, fontWeight: '700', color: t.ink, flexShrink: 1 }}
              numberOfLines={1}
            >
              {cv.name}
            </Text>
            {cv.isDefault ? (
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 9999,
                  backgroundColor: t.dark ? ICV_ACCENT_SOFT_DARK : ICV_ACCENT_SOFT_LIGHT,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '700', color: ICV_ACCENT }}>
                  {icvStrings.selector.principal}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <Text
              style={{
                fontSize: 10,
                color: t.muted,
                backgroundColor: t.surface2,
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 4,
              }}
            >
              {SOURCE_LABEL[cv.source] ?? cv.source}
            </Text>
            <Text style={{ fontSize: 11, color: t.muted }}>
              Score {cv.completionScore}/100
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={{ height: 1, backgroundColor: t.borderSoft, marginVertical: 12 }} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <ActionPill
          icon="file"
          label={icvStrings.list.actions.open}
          onPress={() => router.push(`/icv?cv=${cv._id}` as never)}
          disabled={busy}
        />
        <ActionPill
          icon="edit"
          label={icvStrings.list.actions.rename}
          onPress={() => router.push(`/icv/rename?cv=${cv._id}&name=${encodeURIComponent(cv.name)}` as never)}
          disabled={busy}
        />
        <ActionPill
          icon="copy"
          label={icvStrings.list.actions.duplicate}
          onPress={handleDuplicate}
          disabled={busy}
        />
        {!cv.isDefault ? (
          <ActionPill
            icon="check"
            label={icvStrings.list.actions.setDefault}
            onPress={handleSetDefault}
            disabled={busy}
          />
        ) : null}
        <ActionPill
          icon="download"
          label={icvStrings.list.actions.download}
          onPress={handlePdf}
          disabled={busy}
        />
        {canSafelyDelete && !cv.isDefault ? (
          <ActionPill
            icon="trash"
            label={icvStrings.list.actions.remove}
            onPress={handleDelete}
            disabled={busy}
            destructive
          />
        ) : null}
      </View>
    </View>
  );
}

function ActionPill({
  icon,
  label,
  onPress,
  disabled,
  destructive,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const t = useIdnTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 9999,
        backgroundColor: destructive
          ? t.dark
            ? 'rgba(220,38,38,0.18)'
            : '#FEE2E2'
          : t.surface2,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Icon name={icon} size={12} color={destructive ? '#DC2626' : t.ink2} />
      <Text style={{ fontSize: 11, fontWeight: '600', color: destructive ? '#DC2626' : t.ink2 }}>
        {label}
      </Text>
    </Pressable>
  );
}
