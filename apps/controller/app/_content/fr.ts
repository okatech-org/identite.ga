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
  agenda: "Agenda entretiens",
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
  priorityHigh: "PRIORITÉ HAUTE",
  caseTitlePrefix: "Demande — ",
  preview: {
    recto: "CNI · RECTO",
    selfie: "SELFIE LIVENESS",
  },
  approveCta: "Approuver",
  requestMoreCta: "Demander un complément",
  rejectCta: "Rejeter",
  status: {
    pending: "En attente d'analyse",
    submitted: "Soumise",
    under_review: "À examiner",
    complement_required: "Complément demandé",
    approved: "Approuvée",
    rejected: "Rejetée",
    expired: "Expirée",
  },
  list: {
    searchLabel: "Rechercher une demande",
    searchPlaceholder: "Nom, prénom, NIP, référence",
    statusLabel: "Filtrer par statut",
    statusAll: "Tous les statuts",
    loading: "Chargement des demandes…",
    empty: "Aucune demande ne correspond à cette recherche.",
    emptyStatus: "Aucune demande dans ce statut.",
    capped: (n: number) =>
      `Seules les ${n} premières demandes de ce statut sont parcourues — affinez le filtre ou la recherche pour couvrir le reste.`,
    counter: (page: number, pages: number, total: number) =>
      `Page ${page} sur ${pages} · ${total} demande${total > 1 ? "s" : ""}`,
    prev: "Précédent",
    next: "Suivant",
  },
  detail: {
    empty: "Sélectionnez une demande dans la liste pour l'examiner.",
    notFound: "Cette demande est introuvable — elle a peut-être été supprimée.",
    claimCta: "Prendre en charge",
    claimHint:
      "Prenez la demande en charge pour signaler aux autres contrôleurs que vous l'examinez.",
    claimedByOther:
      "Demande assignée à un autre contrôleur. Les actions de décision sont verrouillées.",
    analysisTitle: "Analyse automatique",
    decidedAt: (date: string) => `Décision enregistrée le ${date}`,
    rejectionReason: "Motif du rejet",
    complementMessage: "Complément demandé au citoyen",
  },
} as const

export const agenda = {
  meta: { title: "Agenda des entretiens" },
  sub: "NIVEAU 3 · HEURE DE LIBREVILLE",
  title: "Agenda des entretiens",
} as const

export const scan = {
  meta: { title: "Scanner une identité" },
  sub: "CONTRÔLE TERRAIN",
  title: "Scanner une identité",
  reader: {
    title: "Lecteur QR / NFC",
    sub: "Demandez au titulaire de présenter son code IDN.",
  },
  live: {
    startCta: "Démarrer le scan",
    stopCta: "Arrêter",
    cameraDenied:
      "Accès caméra refusé. Autorisez la caméra dans les paramètres du navigateur.",
    cameraUnavailable:
      "Caméra indisponible sur ce poste — utilisez la saisie manuelle ci-dessous.",
    scannerUnsupported:
      "Ce navigateur ne supporte pas la détection QR native. Utilisez Chrome, Edge ou Safari, ou collez le code manuellement.",
    manualLabel: "Saisie manuelle du code IDN",
    manualPlaceholder: "idn:p1:…",
    manualSubmit: "Vérifier",
    locationLabel: "Lieu de contrôle (optionnel)",
    locationPlaceholder: "Ex : Préfecture Akanda — guichet 3",
    verifying: "Vérification…",
  },
  result: {
    title: "Identité vérifiée",
    signatureTitle: "Signature cryptographique valide",
    signatureMeta: (expiresHhMm: string) =>
      `HMAC-SHA256 · expire ${expiresHhMm}`,
    levelLabel: (loa: number) =>
      loa === 3
        ? "NIVEAU 3 · ÉLEVÉ"
        : loa === 2
          ? "NIVEAU 2 · SUBSTANTIEL"
          : "NIVEAU 1 · FAIBLE",
    notice: "Le titulaire sera notifié de ce contrôle (transparence).",
    validateCta: "Valider le contrôle",
    cancelCta: "Annuler",
    newScanCta: "Nouveau scan",
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
