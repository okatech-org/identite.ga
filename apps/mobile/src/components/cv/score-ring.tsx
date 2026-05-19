import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { ICV_ACCENT, icvStrings } from '@/data/cv';
import { useIdnTheme } from '@/design/theme';

/**
 * Anneau SVG du dashboard iCV (score 0..100).
 */
export function ScoreRing({
  score,
  level,
}: {
  score: number;
  level: 'Débutant' | 'Bon' | 'Expert';
}) {
  const t = useIdnTheme();
  const r = 60;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const off = c * (1 - clamped / 100);
  const desc =
    level === 'Expert'
      ? icvStrings.dashboard.descExpert
      : level === 'Bon'
        ? icvStrings.dashboard.descGood
        : icvStrings.dashboard.descBeginner;
  const levelLabel =
    level === 'Expert'
      ? icvStrings.dashboard.levelExpert
      : level === 'Bon'
        ? icvStrings.dashboard.levelGood
        : icvStrings.dashboard.levelBeginner;

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 14,
        padding: 22,
        alignItems: 'center',
      }}
    >
      <Svg width={180} height={180} viewBox="0 0 180 180">
        <Circle cx={90} cy={90} r={r} fill="none" stroke={t.surface2} strokeWidth={12} />
        <Circle
          cx={90}
          cy={90}
          r={r}
          fill="none"
          stroke={ICV_ACCENT}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={off}
          transform="rotate(-90 90 90)"
        />
        <SvgText
          x={90}
          y={88}
          textAnchor="middle"
          fontSize={38}
          fontWeight="700"
          fill={t.ink}
        >
          {clamped}
        </SvgText>
        <SvgText
          x={90}
          y={112}
          textAnchor="middle"
          fontSize={10}
          fontWeight="600"
          fill={t.muted}
          letterSpacing={1.2}
        >
          {icvStrings.dashboard.score}
        </SvgText>
      </Svg>
      <Text style={{ fontSize: 18, fontWeight: '700', color: t.ink, marginTop: 6 }}>
        {levelLabel}
      </Text>
      <Text style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{desc}</Text>
    </View>
  );
}
