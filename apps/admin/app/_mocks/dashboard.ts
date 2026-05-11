/**
 * SOURCE — ressources/interfaces/project/idn-desktop.jsx:617-622, 842-866
 * Verbatim.
 */

export const DASHBOARD_BARS = [
  38, 42, 50, 47, 58, 64, 60, 72, 68, 80, 76, 88, 92, 85, 96,
] as const

export type LoaSlice = { label: string; value: number; color: "muted" | "blue" | "green" }

export const DASHBOARD_LOA: LoaSlice[] = [
  { label: "Niveau 1", value: 38, color: "muted" },
  { label: "Niveau 2", value: 28, color: "blue"  },
  { label: "Niveau 3", value: 34, color: "green" },
]

export type ActivityRow = { t: string; e: string; d: string; tag: string }

export const DASHBOARD_ACTIVITY: ActivityRow[] = [
  { t: "14:32", e: "Application enregistrée", d: "Bourses Étudiantes — en attente de revue", tag: "apps" },
  { t: "13:48", e: "KYC approuvé",            d: "M. Lefèvre → Niveau 2",                    tag: "kyc" },
  { t: "12:11", e: "Échec OTP répété",        d: "+241 6X XX XX 12 — 5 tentatives",          tag: "security" },
  { t: "10:22", e: "Provider email switché",  d: "Resend → AWS SES (admin)",                 tag: "config" },
]
