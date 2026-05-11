import type { ReactNode } from "react"

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeLinecap: "round" as const,
}

export const IdnIcons: Record<string, ReactNode> = {
  mail: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  ),
  lock: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
}
