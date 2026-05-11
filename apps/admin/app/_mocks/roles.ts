/**
 * SOURCE — ressources/interfaces/project/idn-desktop.jsx:1373
 * Verbatim.
 */

export type RoleBadgeColor = "green" | "blue" | "muted" | "yellow"

export type AdminRole = {
  name: string
  count: number
  perms: string[]
  badge: RoleBadgeColor
}

export const ADMIN_ROLES: AdminRole[] = [
  {
    name: "Administrateur Système",
    count: 4,
    perms: ["Tout accès", "Gestion comptes", "Gestion apps", "Logs", "Providers"],
    badge: "green",
  },
  {
    name: "Contrôleur d'Identité",
    count: 38,
    perms: ["Scanner ID", "Valider KYC", "Historique", "MFA + PIN obligatoire"],
    badge: "blue",
  },
  {
    name: "Support Niveau 1",
    count: 12,
    perms: ["Lecture comptes", "Réinit. mot de passe", "Support OTP"],
    badge: "muted",
  },
  {
    name: "Auditeur",
    count: 2,
    perms: ["Lecture seule logs", "Export audit"],
    badge: "yellow",
  },
]
