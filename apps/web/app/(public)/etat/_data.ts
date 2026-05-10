export type ServiceStatus = "operational" | "degraded" | "outage"

export type StatusComponent = {
  name: string
  statusLabel: string
  status: ServiceStatus
  uptime: number
  /** Indices (0..89) où le service a connu un incident dans les 90 derniers jours. */
  incidentDays?: number[]
}

export const STATUS_COMPONENTS: StatusComponent[] = [
  {
    name: "Authentification (auth.idn.ga)",
    statusLabel: "Opérationnel",
    status: "operational",
    uptime: 99.99,
  },
  {
    name: "OIDC / OAuth (oauth.idn.ga)",
    statusLabel: "Opérationnel",
    status: "operational",
    uptime: 99.97,
  },
  {
    name: "API Identité (api.idn.ga)",
    statusLabel: "Opérationnel",
    status: "operational",
    uptime: 99.98,
  },
  {
    name: "KYC vidéo (kyc.idn.ga)",
    statusLabel: "Latence dégradée",
    status: "degraded",
    uptime: 99.91,
    incidentDays: [42, 43, 88, 89],
  },
  {
    name: "Notifications email/SMS",
    statusLabel: "Opérationnel",
    status: "operational",
    uptime: 99.96,
  },
  {
    name: "USSD *242#",
    statusLabel: "Opérationnel",
    status: "operational",
    uptime: 99.82,
    incidentDays: [17, 51],
  },
]

export type StatusIncident = {
  id: string
  title: string
  status: "ongoing" | "monitoring" | "resolved"
  severity: ServiceStatus
  /** Date / heure ISO. */
  startedAt: string
  body: string
}

export const RECENT_INCIDENTS: StatusIncident[] = [
  {
    id: "inc-2026-05-10-kyc",
    title: "Latence dégradée sur le KYC vidéo",
    status: "ongoing",
    severity: "degraded",
    startedAt: "10 mai 2026 · 14:08 UTC",
    body: "Le service de vérification vidéo connaît une latence supérieure à la normale. Les nouvelles soumissions sont mises en file d'attente. Investigation en cours.",
  },
]
