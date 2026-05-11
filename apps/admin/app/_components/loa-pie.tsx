/**
 * Répartition par niveau — port de idn-desktop.jsx:778-819.
 * (Pas un pie : 3 barres de progression empilées comme dans la maquette.)
 */
import { cn } from "@repo/ui/lib/utils"

import type { LoaSlice } from "../_mocks/dashboard"

const FILL: Record<LoaSlice["color"], string> = {
  muted: "bg-idn-muted",
  blue: "bg-idn-blue",
  green: "bg-idn-green",
}

export function LoaPie({ slices }: { slices: LoaSlice[] }) {
  return (
    <div className="mt-[18px]">
      {slices.map((r) => (
        <div key={r.label} className="mb-3.5">
          <div className="mb-1 flex justify-between text-xs text-idn-ink-2">
            <span>{r.label}</span>
            <span className="font-mono font-semibold text-idn-ink">
              {r.value}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-[3px] bg-idn-surface-2">
            <div
              style={{ width: `${r.value}%` }}
              className={cn("h-full rounded-[3px]", FILL[r.color])}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
