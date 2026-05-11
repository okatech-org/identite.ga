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
  subFallback: "TABLEAU DE BORD",
  sub: (name: string) => `BONJOUR, ${name.toUpperCase()}`,
  title: "Tableau de bord",
  cards: {
    queue: {
      sub: "REVUE MANUELLE",
      headline: (n: number) =>
        n === 0
          ? "Aucune demande en attente"
          : n === 1
            ? "1 demande en attente"
            : `${n} demandes en attente`,
      cta: "File de demandes",
    },
    history: {
      sub: "TRAÇABILITÉ",
      headline: (n: number) =>
        n === 0
          ? "Aucun contrôle aujourd'hui"
          : n === 1
            ? "1 contrôle aujourd'hui"
            : `${n} contrôles aujourd'hui`,
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
    empty: "Aucun contrôle récent. Vos prochaines décisions apparaîtront ici.",
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
  placeholderTitle: "À développer",
  placeholderBody:
    "Le scanner QR / NFC sera branché sur la caméra du poste de contrôle pour lire le code IDN du titulaire, vérifier la signature côté serveur et notifier le citoyen (transparence).",
  placeholderEta: "Disponible dans une prochaine itération.",
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

export const settings = {
  meta: { title: "Paramètres" },
  sub: "COMPTE · PRÉFÉRENCES",
  title: "Paramètres",
  tabs: {
    account: "Compte",
    preferences: "Préférences",
  },
  account: {
    title: "Informations du compte",
    sub: "Identité affichée dans l'espace contrôleur et utilisée pour l'audit.",
    nameLabel: "Nom",
    emailLabel: "Email",
    emailHelper:
      "Adresse fournie par l'administrateur ayant créé votre compte. Pour la modifier, contactez votre superviseur.",
    roleLabel: "Rôle",
    roleValue: "Contrôleur d'identité",
  },
  password: {
    title: "Mot de passe",
    sub: "Modifiez régulièrement votre mot de passe. Minimum 12 caractères.",
    cta: "Modifier",
    modalTitle: "Modifier le mot de passe",
    currentLabel: "Mot de passe actuel",
    newLabel: "Nouveau mot de passe",
    newHint: "Minimum 12 caractères. Mélangez lettres, chiffres et symboles.",
    submit: "Modifier",
    cancel: "Annuler",
    successToast: "Mot de passe modifié.",
    errorTooShort: "Le nouveau mot de passe doit contenir au moins 12 caractères.",
    errorSame: "Le nouveau mot de passe doit être différent de l'ancien.",
  },
  preferences: {
    title: "Préférences",
    sub: "Langue d'interface et thème.",
    language: {
      label: "Langue",
      description: "Langue d'interface et communications.",
      options: [
        { value: "fr", label: "Français" },
        { value: "en", label: "English" },
      ],
    },
    theme: {
      label: "Thème",
      description: "Apparence claire, sombre ou automatique.",
      options: [
        { value: "light", label: "Clair" },
        { value: "dark", label: "Sombre" },
        { value: "auto", label: "Automatique" },
      ],
    },
    saveSuccessToast: "Préférences enregistrées.",
  },
} as const
