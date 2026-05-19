import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useAction } from 'convex/react';
import { useRouter } from 'expo-router';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Icon, type IconName } from '@/design/icons';
import { ICV_AI_TOOLS, icvStrings, type AiToolId } from '@/data/cv';
import { useIdnTheme } from '@/design/theme';

/**
 * Section « Options IA » — 5 outils. Chacun déclenche l'action
 * correspondante. Optimize ouvre une route sheet dédiée.
 */

const ICON_BY_TOOL: Record<AiToolId, IconName> = {
  improve_summary: 'sparkles',
  suggest_skills: 'sparkles',
  optimize_job: 'cap',
  generate_letter: 'file',
  ats_check: 'sparkles',
};

export function AiTools({
  cvId,
  onResult,
}: {
  cvId: Id<'citizenCv'>;
  onResult: (feature: AiToolId) => void;
}) {
  const t = useIdnTheme();
  const router = useRouter();
  const improveSummary = useAction(api.cv.ai.improveSummary);
  const suggestSkills = useAction(api.cv.ai.suggestSkills);
  const atsCheck = useAction(api.cv.ai.atsCheck);
  const generateLetter = useAction(api.cv.ai.generateLetter);
  const [pending, setPending] = useState<AiToolId | null>(null);

  async function run(tool: AiToolId) {
    if (pending) return;
    if (tool === 'optimize_job') {
      router.push(`/icv/optimize?cv=${cvId}` as never);
      return;
    }
    setPending(tool);
    try {
      if (tool === 'improve_summary') await improveSummary({ cvId });
      else if (tool === 'suggest_skills') await suggestSkills({ cvId });
      else if (tool === 'ats_check') await atsCheck({ cvId });
      else if (tool === 'generate_letter') await generateLetter({ cvId, tone: 'formal' });
      onResult(tool);
    } catch (e) {
      const msg = (e as Error).message ?? '';
      Alert.alert(
        'Erreur',
        msg.includes('cvAi') || msg.includes('RATE_LIMIT')
          ? icvStrings.errors.quotaIa
          : icvStrings.errors.aiFailed,
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 14,
        padding: 14,
        backgroundColor: t.surface,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
        }}
      >
        <Icon name="sparkles" size={14} color="#a855f7" />
        <Text style={{ fontSize: 13, fontWeight: '700', color: t.ink }}>
          {icvStrings.ai.title}
        </Text>
      </View>
      <View style={{ gap: 4 }}>
        {ICV_AI_TOOLS.map((tool) => {
          const isPending = pending === tool.id;
          return (
            <Pressable
              key={tool.id}
              onPress={() => run(tool.id)}
              disabled={pending !== null}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 8,
                borderRadius: 8,
                opacity: pending && pending !== tool.id ? 0.5 : 1,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  backgroundColor: t.dark ? tool.bgDark : tool.bgLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={ICON_BY_TOOL[tool.id]} size={14} color={tool.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: t.ink }}>
                  {tool.label}
                </Text>
                <Text
                  style={{ fontSize: 10, color: t.muted }}
                  numberOfLines={1}
                >
                  {isPending ? icvStrings.ai.inProgress : tool.desc}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
