import * as React from "react"

import { cn } from "@repo/ui/lib/utils"

type LoALevel = 1 | 2 | 3

const META: Record<LoALevel, { label: string; sub: string; classes: string }> = {
  1: {
    label: "Niveau 1",
    sub: "Faible",
    classes:
      "bg-idn-surface-2 text-idn-muted dark:bg-idn-surface-2 dark:text-idn-muted",
  },
  2: {
    label: "Niveau 2",
    sub: "Substantiel",
    classes: "bg-idn-blue-soft text-idn-blue dark:bg-[#10243A] dark:text-idn-blue",
  },
  3: {
    label: "Niveau 3",
    sub: "Élevé",
    classes:
      "bg-idn-green-soft text-idn-green dark:bg-[#0F2A18] dark:text-idn-green",
  },
}

function LoABadge({
  level,
  compact = false,
  className,
  ...props
}: React.ComponentProps<"span"> & {
  level: LoALevel
  compact?: boolean
}) {
  const meta = META[level]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold leading-tight tracking-[0.01em]",
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        meta.classes,
        className,
      )}
      aria-label={`${meta.label} — ${meta.sub}`}
      {...props}
    >
      <svg
        width={compact ? 10 : 11}
        height={compact ? 10 : 11}
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M6 1l4 1.5v3.5c0 2.4-1.7 4.4-4 5-2.3-.6-4-2.6-4-5V2.5L6 1z"
          fill="currentColor"
        />
      </svg>
      {meta.label}
      {!compact && (
        <span className="font-medium opacity-70">· {meta.sub}</span>
      )}
    </span>
  )
}

export { LoABadge, type LoALevel }
