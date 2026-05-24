import type { ReactNode } from "react"

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeLinecap: "round" as const,
}

export const IdnIcons: Record<string, ReactNode> = {
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
}
