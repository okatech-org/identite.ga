/**
 * SOURCE — ressources/interfaces/project/idn-desktop.jsx:923
 * Verbatim. Ne pas inventer de données.
 */

import type { LoALevel } from "@repo/ui/components/loa-badge"

export type AppStatus = "production" | "pending" | "sandbox"

export type AdminApp = {
  name: string
  id: string
  loa: LoALevel
  scopes: number
  status: AppStatus
}

export const ADMIN_APPS: AdminApp[] = [
  { name: "Consulat.ga",         id: "consulat-ga",     loa: 2, scopes: 4, status: "production" },
  { name: "Bourses Étudiantes",  id: "bourses-min-edu", loa: 3, scopes: 5, status: "pending"    },
  { name: "Santé.ga",            id: "sante-ga",        loa: 3, scopes: 6, status: "production" },
  { name: "Impots.ga",           id: "dgi-impots",      loa: 2, scopes: 3, status: "production" },
  { name: "e-Visa",              id: "evisa-ga",        loa: 1, scopes: 2, status: "production" },
  { name: "CNAMGS",              id: "cnamgs-portal",   loa: 2, scopes: 4, status: "sandbox"    },
]

/**
 * Détail application — SOURCE idn-desktop.jsx:1638-1779
 * (BOURSES ÉTUDIANTES · CLIENT_ID bourses-min-edu)
 */
export const APP_DETAIL_BOURSES = {
  sub: "BOURSES ÉTUDIANTES · CLIENT_ID bourses-min-edu",
  cred: {
    clientId: "bourses-min-edu",
    redirectUris: "https://bourses.education.ga/auth/callback",
    scopes: "profile, email, birth_cert, loa:3",
    loaMin: "3 — Élevé",
    consent: "non-trusted (écran de consentement requis)",
  },
  chartBars: [40, 56, 48, 62, 70, 65, 78, 82, 75, 88, 92, 85, 96, 100],
  events: [
    { ts: "Aujourd'hui 14:32", e: "Demande de passage en production", a: "dev@startup.ga" },
    { ts: "08 mai · 09:14",    e: "Secret régénéré",                  a: "dev@startup.ga" },
    { ts: "02 mai · 16:00",    e: "Scope birth_cert ajouté",          a: "dev@startup.ga" },
    { ts: "14 avr · 11:20",    e: "App créée (sandbox)",              a: "dev@startup.ga" },
  ],
}
