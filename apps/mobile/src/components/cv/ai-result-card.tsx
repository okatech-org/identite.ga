import React, { useState } from 'react';
import { Alert, Clipboard, Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Icon } from '@/design/icons';
import { icvStrings, SKILL_LEVELS } from '@/data/cv';
import { useIdnTheme } from '@/design/theme';

type Feature = 'improve_summary' | 'suggest_skills' | 'generate_letter';

/**
 * Carte verte « Suggestion de l'IA » mobile — lit le dernier job complet
 * pour la feature donnée et propose les actions adéquates.
 */
export function AiResultCard({
  cvId,
  feature,
  currentSummary,
  onClose,
}: {
  cvId: Id<'citizenCv'>;
  feature: Feature;
  currentSummary?: string;
  onClose: () => void;
}) {
  const t = useIdnTheme();
  const job = useQuery(api.cv.ai.getLastResult, { cvId, feature });
  const upsert = useMutation(api.cv.profile.upsert);
  const addSkill = useMutation(api.cv.skills.add);
  const [busy, setBusy] = useState(false);

  if (!job || job.status !== 'completed' || !job.result) return null;

  const bg = t.dark ? '#0F2818' : '#DCFCE7';
  const border = t.dark ? '#0F4A22' : '#86EFAC';
  const fg = t.dark ? '#86EFAC' : '#15803D';

  const Shell = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <View
      style={{
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Icon name="sparkles" size={14} color={fg} />
        <Text style={{ fontSize: 13, fontWeight: '700', color: fg, flex: 1 }}>
          {title}
        </Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Icon name="close" size={14} color={fg} />
        </Pressable>
      </View>
      {children}
    </View>
  );

  // ── improve_summary
  if (feature === 'improve_summary') {
    const rewritten = (job.result.rewrittenSummary as string | undefined) ?? '';
    async function accept() {
      if (busy) return;
      setBusy(true);
      try {
        await upsert({ cvId, patch: { summary: rewritten } });
        onClose();
      } catch (e) {
        Alert.alert('Erreur', (e as Error).message ?? icvStrings.errors.saveFailed);
      } finally {
        setBusy(false);
      }
    }
    return (
      <Shell title={icvStrings.ai.cardTitle}>
        {currentSummary ? (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: fg, opacity: 0.7, letterSpacing: 1 }}>
              ACTUEL
            </Text>
            <Text style={{ fontSize: 12, color: fg, fontStyle: 'italic', marginTop: 4 }}>
              {currentSummary || '—'}
            </Text>
          </View>
        ) : null}
        <Text style={{ fontSize: 13, fontStyle: 'italic', color: fg, lineHeight: 19 }}>
          « {rewritten} »
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <Pressable
            onPress={accept}
            disabled={busy}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 9999,
              backgroundColor: '#16A34A',
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
              {icvStrings.ai.accept}
            </Text>
          </Pressable>
          <Pressable
            onPress={onClose}
            style={{ paddingHorizontal: 18, paddingVertical: 10 }}
          >
            <Text style={{ color: fg, fontWeight: '700', fontSize: 13 }}>
              {icvStrings.ai.ignore}
            </Text>
          </Pressable>
        </View>
      </Shell>
    );
  }

  // ── suggest_skills
  if (feature === 'suggest_skills') {
    const suggestions = (job.result.suggestions as Array<{
      name: string;
      level: (typeof SKILL_LEVELS)[number];
      rationale: string;
    }> | undefined) ?? [];
    async function add(name: string, level: (typeof SKILL_LEVELS)[number]) {
      if (busy) return;
      setBusy(true);
      try {
        await addSkill({ cvId, data: { name, level } });
      } catch (e) {
        Alert.alert('Erreur', (e as Error).message ?? icvStrings.errors.saveFailed);
      } finally {
        setBusy(false);
      }
    }
    return (
      <Shell title="Compétences suggérées">
        {suggestions.length === 0 ? (
          <Text style={{ color: fg, fontSize: 13, fontStyle: 'italic' }}>
            Aucune suggestion (votre CV couvre déjà les principales compétences).
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            {suggestions.map((s, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 10,
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontWeight: '600', color: fg, fontSize: 13 }}>{s.name}</Text>
                    <View
                      style={{
                        backgroundColor: 'rgba(34,197,94,0.25)',
                        paddingHorizontal: 8,
                        paddingVertical: 1,
                        borderRadius: 9999,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: fg, fontWeight: '500' }}>
                        {s.level}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: fg, opacity: 0.75, marginTop: 2, fontStyle: 'italic' }}>
                    {s.rationale}
                  </Text>
                </View>
                <Pressable
                  onPress={() => add(s.name, s.level)}
                  disabled={busy}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: 'rgba(255,255,255,0.6)',
                    borderRadius: 9999,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: fg }}>
                    {icvStrings.ai.addSkill}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </Shell>
    );
  }

  // ── generate_letter
  const letter = (job.result.letter as string | undefined) ?? '';
  async function copy() {
    Clipboard.setString(letter);
    Alert.alert('Copié', 'Lettre copiée dans le presse-papier.');
  }
  return (
    <Shell title="Lettre de motivation">
      <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>
        <Text style={{ fontSize: 13, color: fg, lineHeight: 19 }}>{letter}</Text>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Pressable
          onPress={copy}
          style={{
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 9999,
            backgroundColor: '#16A34A',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
            {icvStrings.ai.copyLetter}
          </Text>
        </Pressable>
      </View>
    </Shell>
  );
}
