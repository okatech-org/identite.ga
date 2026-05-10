/**
 * Textes des pages connectées du citoyen.
 * Centralisé pour faciliter la migration future vers next-intl.
 */

export const PROFILE_TYPE_LABELS = {
  citizen: "Citoyen Gabonais",
  resident: "Résident",
  visitor: "Visiteur Temporaire",
  developer: "Développeur",
} as const

export const citizenNav = {
  home: "Accueil",
  profile: "Mon profil",
  consents: "Consentements",
} as const

export const userMenu = {
  ariaLabel: "Mon compte",
  dashboard: "Tableau de bord",
  profile: "Mon profil",
  consents: "Mes consentements",
  settings: "Paramètres",
  signOut: "Se déconnecter",
} as const

export const dashboard = {
  meta: {
    title: "Tableau de bord",
    description: "Tableau de bord de votre compte IDN.",
  },
  greeting: (firstName: string) => `Bonjour, ${firstName}`,
  welcome: "Bienvenue",
  profileEyebrow: "Mon compte IDN",
  idnIdLabel: "ID IDN",
  idnIdEmpty: "—",
  servicesEyebrow: "SERVICES",
  recentEyebrow: "ACTIVITÉ RÉCENTE",
  recentEmpty: "Aucune activité récente.",
  shortcutsEyebrow: "RACCOURCIS",
  sessions: {
    eyebrow: "SESSIONS ACTIVES",
    countSingle: "1 appareil",
    countMany: (n: number) => `${n} appareils`,
    countEmpty: "Aucune session",
  },
  bellAria: "Notifications",
} as const

/**
 * Mapping des actions audit (cf. AUDIT_ACTIONS dans schema.ts) → libellé FR.
 * Affiché dans la liste d'activité récente.
 */
export const auditActionLabels: Record<string, string> = {
  login_success: "Connexion réussie",
  login_failure: "Échec de connexion",
  login_lockout: "Compte temporairement verrouillé",
  otp_sent: "Code OTP envoyé",
  otp_verified: "Code OTP vérifié",
  otp_expired: "Code OTP expiré",
  account_created: "Compte IDN créé",
  account_modified: "Profil modifié",
  account_disabled: "Compte désactivé",
  password_changed: "Mot de passe modifié",
  email_changed: "Adresse email modifiée",
  pin_changed: "PIN modifié",
  kyc_submitted: "Vérification d'identité envoyée",
  kyc_under_review: "Vérification en cours d'examen",
  kyc_approved: "Niveau de garantie augmenté",
  kyc_rejected: "Vérification refusée",
  consent_granted: "Consentement accordé",
  consent_revoked: "Consentement révoqué",
  oauth_app_created: "Application OAuth créée",
  oauth_app_modified: "Application OAuth modifiée",
  oauth_app_disabled: "Application OAuth désactivée",
  session_revoked: "Session révoquée",
  session_revoked_global: "Toutes les autres sessions révoquées",
  admin_action: "Action administrateur",
  role_assigned: "Rôle attribué",
  role_revoked: "Rôle révoqué",
  identity_check_performed: "Vérification d'identité effectuée",
  signature_verified: "Signature vérifiée",
}

/**
 * Format relatif FR pour un timestamp :
 * - "Aujourd'hui HH:mm" si même jour
 * - "Hier HH:mm" si J-1
 * - "JJ mois" sinon (ex: "06 mai")
 */
const SHORT_MONTHS_FR = [
  "janv.",
  "févr.",
  "mars",
  "avril",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
]
function pad(n: number): string {
  return n.toString().padStart(2, "0")
}
export function formatRelativeDate(timestamp: number): string {
  const d = new Date(timestamp)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (sameDay) return `Aujourd'hui ${time}`
  if (isYesterday) return `Hier ${time}`
  return `${pad(d.getDate())} ${SHORT_MONTHS_FR[d.getMonth()]}`
}

/**
 * Format date longue FR (ex: "22 avril 2026") — pour Verifié le.
 */
export function formatLongDate(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getDate()} ${SHORT_MONTHS_FR[d.getMonth()]?.replace(".", "")} ${d.getFullYear()}`
}

/**
 * Helper meta audit : formate les détails contextuels d'une entrée audit
 * en chaîne courte affichable à droite de la ligne.
 */
export function formatAuditMeta(
  action: string,
  metadata: Record<string, unknown> | undefined,
  ip: string | undefined,
): string {
  if (!metadata && !ip) return ""
  const parts: string[] = []
  if (metadata?.device && typeof metadata.device === "string") {
    parts.push(metadata.device)
  } else if (metadata?.appName && typeof metadata.appName === "string") {
    parts.push(metadata.appName)
  } else if (
    metadata?.scopes &&
    Array.isArray(metadata.scopes) &&
    metadata.scopes.length
  ) {
    parts.push(`scopes : ${metadata.scopes.join(", ")}`)
  } else if (metadata?.field && typeof metadata.field === "string") {
    parts.push(`champ : ${metadata.field}`)
  }
  if (ip && parts.length === 0) {
    parts.push(`IP ${ip}`)
  }
  return parts.join(" · ")
}

const KYC_DOCUMENT_LABELS: Record<string, string> = {
  cni_gabon: "CNI gabonaise",
  birth_certificate: "Acte de naissance",
  residence_card: "Carte de séjour",
  passport: "Passeport",
  visa: "Visa",
}

export function formatVerifiedDocuments(types: readonly string[]): string {
  if (!types.length) return "—"
  return types
    .map((t) => KYC_DOCUMENT_LABELS[t] ?? t)
    .filter(Boolean)
    .join(" · ")
}

export const services = [
  {
    key: "evisa",
    title: "e-Visa",
    sub: "Statut : actif",
    loa: 1 as const,
    icon: "doc" as const,
  },
  {
    key: "carte-sejour",
    title: "Carte de séjour",
    sub: "Renouvellement",
    loa: 2 as const,
    icon: "shield" as const,
  },
  {
    key: "etat-civil",
    title: "État civil",
    sub: "Acte de naissance",
    loa: 3 as const,
    icon: "user" as const,
  },
  {
    key: "bourses",
    title: "Bourses étudiantes",
    sub: "Min. enseign. sup.",
    loa: 3 as const,
    icon: "mail" as const,
  },
  {
    key: "impots",
    title: "Impôts.ga",
    sub: "DGI — déclarations",
    loa: 2 as const,
    icon: "doc" as const,
  },
  {
    key: "sante",
    title: "Santé.ga",
    sub: "Portail e-santé",
    loa: 3 as const,
    icon: "user" as const,
  },
] as const

export const quickActions = {
  consents: {
    label: "Consentements",
    sub: "4 apps autorisées",
  },
  presentId: {
    label: "Présenter mon ID",
    sub: "QR sécurisé",
    disabledTooltip: "Bientôt disponible",
  },
} as const

export const kycPromo = {
  title: "Vérifiez votre identité",
  sub: (nextLevel: number) =>
    `Passez au Niveau ${nextLevel} pour débloquer plus de services administratifs.`,
  cta: "Démarrer",
  comingSoonTooltip: "Bientôt disponible",
} as const

export const profile = {
  meta: {
    title: "Mon profil",
    description: "Détails de votre identité numérique IDN.",
  },
  edit: "Modifier",
  editDisabledTooltip: "Bientôt disponible",
  pivot: {
    eyebrow: "IDENTITÉ PIVOT",
    rows: {
      firstName: "Prénom",
      lastName: "Nom",
      dateOfBirth: "Date de naissance",
      birthPlace: "Lieu de naissance",
      nationality: "Nationalité",
      idnId: "ID IDN",
    },
  },
  security: {
    eyebrow: "SÉCURITÉ",
    rows: {
      password: "Mot de passe",
      passwordValue: "Modifiable depuis Paramètres",
      pin: "PIN à 6 chiffres",
      pinConfiguredValue: "Configuré · ••••••",
      pinNotConfiguredValue: "Non configuré",
      twoFactor: "Authentification 2FA",
      twoFactorValue: "Non configurée",
      sessions: "Sessions actives",
      sessionsValueSingle: "1 appareil",
      sessionsValueMany: (n: number) => `${n} appareils`,
      sessionsValueEmpty: "Aucune",
    },
  },
  verification: {
    eyebrow: "VÉRIFICATION",
    rows: {
      currentLevel: "Niveau actuel",
      currentLevelValue: (loa: number) => `Niveau ${loa}`,
      verifiedOn: "Vérifié le",
      verifiedOnEmpty: "—",
      documents: "Documents validés",
      documentsEmpty: "—",
    },
  },
  upgradeCta: (nextLevel: number) => `Passer au Niveau ${nextLevel}`,
} as const

export const consents = {
  meta: {
    title: "Mes consentements",
    description:
      "Applications et services ayant accès à vos données IDN. Révocable à tout moment.",
  },
  title: "Consentements",
  sub: (count: number) =>
    `${count} application${count > 1 ? "s" : ""} ${count > 1 ? "ont" : "a"} accès à vos données IDN. Révocable à tout moment.`,
  subEmpty:
    "Aucune application n'a encore accès à vos données IDN. Lorsque vous autoriserez un service à utiliser votre identité, il apparaîtra ici.",
  grantedOn: (date: string) => `autorisé le ${date}`,
  revoke: "Révoquer",
  revokeSuccessToast: "Consentement révoqué.",
  revokeErrorToast: "Impossible de révoquer ce consentement.",
  confirmRevokeTitle: (appName: string) =>
    `Révoquer l'accès de ${appName} ?`,
  confirmRevokeBody:
    "Cette application n'aura plus accès à vos données IDN. Vous pourrez l'autoriser à nouveau plus tard.",
  confirmRevokeAction: "Révoquer",
  confirmCancel: "Annuler",
  emptyTitle: "Aucun consentement actif",
  emptySub:
    "Vous n'avez encore autorisé aucune application à accéder à vos données IDN.",
} as const

export const sessions = {
  confirmRevokeTitle: (device: string) =>
    `Déconnecter ${device} ?`,
  confirmRevokeBody:
    "Cet appareil sera immédiatement déconnecté. Il devra à nouveau saisir vos identifiants pour accéder à votre compte IDN.",
  confirmRevokeAction: "Déconnecter",
  confirmCancel: "Annuler",
  revokeSuccessToast: "Session déconnectée.",
} as const

