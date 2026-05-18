import React, { useMemo } from 'react';
import Svg, { G, Rect } from 'react-native-svg';

export function QRPattern({ size = 210 }: { size?: number }) {
  const cells = useMemo(() => {
    const out: { r: number; c: number; on: boolean }[] = [];
    for (let r = 0; r < 21; r++) for (let c = 0; c < 21; c++) {
      const corner = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
      const seed = ((r * 31 + c * 17) % 23);
      out.push({ r, c, on: corner || seed < 11 });
    }
    return out;
  }, []);
  return (
    <Svg width={size} height={size} viewBox="0 0 210 210">
      <Rect width={210} height={210} fill="#fff" />
      {cells.map(({ r, c, on }) => on ? (
        <Rect key={`${r}-${c}`} x={c * 10} y={r * 10} width={10} height={10} fill="#0E110D" />
      ) : null)}
      {([[0, 0], [0, 140], [140, 0]] as const).map(([x, y], i) => (
        <G key={i}>
          <Rect x={x} y={y} width={70} height={70} fill="none" stroke="#0E110D" strokeWidth={10} />
          <Rect x={x + 20} y={y + 20} width={30} height={30} fill="#0E110D" />
        </G>
      ))}
    </Svg>
  );
}
