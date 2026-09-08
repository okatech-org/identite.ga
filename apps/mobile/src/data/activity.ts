import { idnTokens } from "@/design/tokens"

export const ACTIVITY_FILTERS = [
  "Tout",
  "Connexions",
  "Consentements",
  "KYC",
  "Sécurité",
] as const

export type ActivityItem = {
  ts: string
  cat: string
  e: string
  m: string
  col: string
  warn?: boolean
}

export const ACTIVITY_GROUPS: { d: string; items: ActivityItem[] }[] = [
  {
    d: "Aujourd'hui",
    items: [
      {
        ts: "14:32",
        cat: "AUTH",
        e: "Connexion à Consulat.ga",
        m: "iPhone · Libreville",
        col: idnTokens.green,
      },
      {
        ts: "09:14",
        cat: "CONS",
        e: "Consentement accordé à Bourses Étudiantes",
        m: "profile, email, birth_cert",
        col: idnTokens.blue,
      },
    ],
  },
  {
    d: "Hier",
    items: [
      {
        ts: "18:42",
        cat: "AUTH",
        e: "Connexion depuis Paris",
        m: "Firefox Linux · 81.92.144.7",
        col: idnTokens.yellow,
        warn: true,
      },
      {
        ts: "09:14",
        cat: "KYC",
        e: "Niveau de garantie augmenté à 3",
        m: "Validé par K. Ovono",
        col: idnTokens.green,
      },
    ],
  },
  {
    d: "06 mai",
    items: [
      {
        ts: "11:02",
        cat: "AUTH",
        e: "Code PIN modifié",
        m: "Paramètres → Sécurité",
        col: idnTokens.green,
      },
      {
        ts: "08:14",
        cat: "NOTIF",
        e: "Email de bienvenue lu",
        m: "Premier message IDN",
        col: "#74766B",
      },
    ],
  },
]
