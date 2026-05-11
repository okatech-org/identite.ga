/**
 * Sparkline bars — port de idn-desktop.jsx:723-746 (et 1721-1742 pour
 * la variante détail app). Dernière barre mise en avant (vert vif),
 * les autres en vert pâle. Hauteur passée en prop.
 */

import { cn } from "@repo/ui/lib/utils"

export function SparklineBars({
  values,
  className,
  highlightLast = true,
}: {
  values: readonly number[] | number[]
  className?: string
  highlightLast?: boolean
}) {
  return (
    <div className={cn("flex items-end gap-1.5", className)} aria-hidden>
      {values.map((v, i) => {
        const isLast = highlightLast && i === values.length - 1
        return (
          <div
            key={i}
            style={{ height: `${v}%` }}
            className={cn(
              "flex-1 rounded-t-[3px]",
              isLast
                ? "bg-idn-green"
                : "bg-[#B8DCC4] dark:bg-[#1F4A2E]",
            )}
          />
        )
      })}
    </div>
  )
}
