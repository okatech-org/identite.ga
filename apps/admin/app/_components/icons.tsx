/**
 * Icônes IDN — port direct de idn-tokens.jsx (lignes 189-209).
 * SVG 20×20 stroke (sauf indication contraire). Couleurs via `currentColor`.
 */
import type { ReactNode } from "react"

const stroke = { fill: "none" as const, stroke: "currentColor", strokeLinecap: "round" as const }

export const IdnIcons: Record<string, ReactNode> = {
  user: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
  userPlus: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <circle cx="10" cy="8" r="4" />
      <path d="M2 21c1.4-3.7 4.2-5.6 7.5-5.6" />
      <path d="M18 13v6M15 16h6" />
    </svg>
  ),
  login: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5M3 12h12" />
    </svg>
  ),
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
  shield: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z" />
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12l5 5 9-11" />
    </svg>
  ),
  arrow: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  arrowL: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  ),
  doc: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h6" />
    </svg>
  ),
  qr: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3M21 14v7M14 21h3" />
    </svg>
  ),
  bell: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <path d="M6 9a6 6 0 1 1 12 0v4l2 3H4l2-3V9zM10 19a2 2 0 0 0 4 0" />
    </svg>
  ),
  link: (
    <svg width="20" height="20" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <path d="M10 14l4-4M9 7h-2a4 4 0 0 0 0 8h2M15 17h2a4 4 0 0 0 0-8h-2" />
    </svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} strokeWidth="1.7" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.5-4.5" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  more: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="6" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="18" cy="12" r="1.6" />
    </svg>
  ),
  copy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  ),
  eye: (
    <svg width="18" height="18" viewBox="0 0 24 24" {...stroke} strokeWidth="1.6" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  // Icône dédiée "tableau de bord" — idn-desktop.jsx:551 (dashIcon)
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3"  y="3"  width="8" height="8"  rx="1.5" />
      <rect x="13" y="3"  width="8" height="5"  rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3"  y="13" width="8" height="8"  rx="1.5" />
    </svg>
  ),
}
