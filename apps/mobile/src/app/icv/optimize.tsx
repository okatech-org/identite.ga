import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useAction, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Icon } from '@/design/icons';
import { idnTokens } from '@/design/tokens';
import { useIdnTheme } from '@/design/theme';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { icvStrings } from '@/data/cv';

export default function ICVOptimize() {
  const params = useLocalSearchParams<{ cv?: string }>();
  const cvId = params.cv as Id<'citizenCv'> | undefined;
  const t = useIdnTheme();
  const router = useRouter();
  const optimizeForJob = useAction(api.cv.ai.optimizeForJob);
  const [offer, setOffer] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeJobId, setActiveJobId] = useState<Id<'citizenCvAiJob'> | null>(null);

  // `optimizeForJob` délègue l'exécution au pool IA et ne renvoie plus le
  // `derivedCvId` en synchrone : on suit le job via la query réactive et on
  // navigue une fois le CV dérivé créé.
  const job = useQuery(
    api.cv.ai.getLastResult,
    activeJobId && cvId ? { cvId, feature: 'optimize_job' } : 'skip',
  );

  useEffect(() => {
    if (!activeJobId || !job || job._id !== activeJobId) return;
    if (job.status === 'completed' && job.derivedCvId) {
      setActiveJobId(null);
      setBusy(false);
      Alert.alert(icvStrings.optimize.success);
      router.dismissAll();
      router.push(`/icv?cv=${job.derivedCvId}` as never);
    } else if (job.status === 'failed') {
      setActiveJobId(null);
      setBusy(false);
      Alert.alert('Erreur', job.errorMessage ?? icvStrings.errors.aiFailed);
    }
  }, [activeJobId, job, router]);

  async function submit() {
    if (!cvId || busy) return;
    const trimmed = offer.trim();
    if (trimmed.length < 30) {
      Alert.alert('Erreur', 'Le texte de l\'offre est trop court (30 caractères min).');
      return;
    }
    setBusy(true);
    try {
      const { jobId } = await optimizeForJob({
        cvId,
        jobOfferText: trimmed,
        newCvName: name.trim() || undefined,
      });
      // On reste en `busy` jusqu'à la complétion, gérée par l'effet ci-dessus.
      setActiveJobId(jobId);
    } catch (e) {
      setBusy(false);
      const msg = (e as Error).message ?? '';
      Alert.alert(
        'Erreur',
        msg.includes('cvAi') || msg.includes('RATE_LIMIT')
          ? icvStrings.errors.quotaIa
          : msg,
      );
    }
  }

  if (!cvId) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.muted }}>CV non spécifié.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <NSheetHeader t={t} title={icvStrings.optimize.title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="cap" size={18} color="#f97316" />
          <Text style={{ fontSize: 13, color: t.muted, flex: 1 }}>
            {icvStrings.optimize.desc}
          </Text>
        </View>

        <View>
          <Text style={{ fontSize: 13, fontWeight: '500', color: t.ink, marginBottom: 6 }}>
            {icvStrings.optimize.offerLabel}
          </Text>
          <TextInput
            value={offer}
            onChangeText={setOffer}
            placeholder={icvStrings.optimize.offerPh}
            placeholderTextColor={t.mutedSoft}
            multiline
            maxLength={8000}
            style={{
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: t.ink,
              fontSize: 14,
              minHeight: 160,
              textAlignVertical: 'top',
            }}
          />
          <Text style={{ textAlign: 'right', fontSize: 11, color: t.muted, marginTop: 4 }}>
            {offer.length} / 8000
          </Text>
        </View>

        <View>
          <Text style={{ fontSize: 13, fontWeight: '500', color: t.ink, marginBottom: 6 }}>
            {icvStrings.optimize.nameLabel}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={icvStrings.optimize.namePh}
            placeholderTextColor={t.mutedSoft}
            maxLength={80}
            style={{
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 12,
              color: t.ink,
              fontSize: 14,
            }}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <IdnButton variant="ghost" size="md" t={t} onPress={() => router.back()} disabled={busy}>
            {icvStrings.optimize.cancel}
          </IdnButton>
          <View style={{ flex: 1 }} />
          <IdnButton variant="primary" size="md" t={t} onPress={submit} disabled={busy}>
            {busy ? icvStrings.optimize.running : icvStrings.optimize.submit}
          </IdnButton>
        </View>
      </ScrollView>
    </View>
  );
}
