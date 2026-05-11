/**
 * Textes de l'espace contrôleur — fidèles à la maquette
 * `ressources/interfaces/project/idn-desktop.jsx` (lignes 1827-2462).
 * Toute chaîne ajoutée ici doit avoir un correspondant exact dans la
 * maquette : pas de variation libre.
 */

export const shell = {
  brand: "IDN",
  role: "CONTRÔLEUR D'IDENTITÉ",
  agentLabel: "Agent K. Ovono",
  status: "connecté",
  badge: "K",
  flagAlt: "Drapeau du Gabon",
} as const

export const nav = {
  dashboard: "Tableau de bord",
  queue: "File de demandes",
  queueTag: "12",
  scan: "Scanner identité",
  verify: "Vérifier signature",
  history: "Historique contrôles",
} as const

export const dashboard = {
  meta: { title: "Tableau de bord" },
  sub: "BONJOUR, AGENT K. OVONO",
  title: "Tableau de bord",
  cards: {
    queue: {
      sub: "REVUE MANUELLE",
      headline: "12 demandes en attente",
      cta: "File de demandes",
    },
    history: {
      sub: "TRAÇABILITÉ",
      headline: "5 contrôles aujourd'hui",
      cta: "Historique de contrôles",
    },
    verify: {
      sub: "OUTIL CRYPTO",
      headline: "Aucune alerte signature",
      cta: "Vérifier une signature",
    },
  },
  recent: {
    title: "Activité récente",
    loc: "TRAÇABILITÉ · 30 DERNIERS JOURS",
  },
} as const

export const queue = {
  meta: { title: "File de demandes" },
  sub: "REVUE MANUELLE · 12 EN ATTENTE",
  title: "File de demandes",
  filtersCta: "Filtres",
  priorityHigh: "PRIORITÉ HAUTE",
  examineCta: "Examiner",
  caseTitlePrefix: "Cas en cours d'examen — ",
  caseRef: "KYC-7K9-3F2",
  preview: {
    recto: "CNI · RECTO",
    selfie: "SELFIE LIVENESS",
  },
  approveCta: "Approuver",
  requestMoreCta: "Demander un complément",
  rejectCta: "Rejeter",
} as const

export const scan = {
  meta: { title: "Scanner une identité" },
  sub: "CONTRÔLE TERRAIN",
  title: "Scanner une identité",
  reader: {
    title: "Lecteur QR / NFC",
    sub: "Demandez au titulaire de présenter son code IDN.",
  },
  result: {
    title: "Identité vérifiée",
    name: "Aïssatou Mboumba",
    born: "14 mars 1992 · Libreville",
    initials: "AM",
    signatureTitle: "Signature cryptographique valide",
    signatureMeta: "JWT signé · clé jwks-2026-04 · expire 14:42",
    docsLabel: "DOCUMENTS LIÉS",
    docs: [
      "· CNI n° 02-7K3-9Q2 (valide jusqu'en 2031)",
      "· Acte de naissance n° AN-1992-0314-LIB",
    ],
    notice: "Le titulaire sera notifié de ce contrôle (transparence).",
    validateCta: "Valider le contrôle",
    cancelCta: "Annuler",
  },
} as const

export const verify = {
  meta: { title: "Vérifier une signature" },
  sub: "OUTIL CRYPTO",
  title: "Vérifier une signature",
  inputLabel: "JWT à vérifier",
  jwt:
    "eyJhbGciOiJSUzI1NiIsImtpZCI6Imp3a3MtMjAyNi0wNCJ9.eyJzdWIiOiJHQS03SzNKLTlRMkwiLCJpc3MiOiJodHRwczovL2lkbi5nYSIsIm5hbWUiOiJBw69zc2F0b3UgTWJvdW1iYSIsImxvYSI6MywiaWF0IjoxNzQ2OTAyNTAwLCJleHAiOjE3NDY5MDYxMDB9.MEUCIQDh...",
  submitCta: "Vérifier la signature",
  resultTitle: "Signature valide",
  resultLines: [
    "iss: https://identite.ga",
    "kid: jwks-2026-04 (RSA 2048)",
    "sub: GA-7K3J-9Q2L · loa: 3",
    "exp: 2026-05-10 14:42:00 (dans 38 min)",
  ],
} as const

export const history = {
  meta: { title: "Historique de contrôles" },
  sub: "TRAÇABILITÉ · 30 DERNIERS JOURS",
  title: "Historique de contrôles",
  resultValid: "VALIDE",
  resultExpired: "EXPIRÉ",
} as const
