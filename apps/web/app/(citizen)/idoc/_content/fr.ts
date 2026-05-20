/**
 * Strings UI iDocument (FR). Verbatim SPECS_FEATURES_CITIZEN.md §3.
 *
 * ⚠ Ne pas paraphraser : tous les libellés sont la source de vérité design.
 */

export const idoc = {
  title: "iDocument",
  comingSoon: "Bientôt disponible",
  vault: {
    activateTitle: "Activer le coffre-fort",
    activateDesc:
      "Choisissez un mot de passe vault. Il chiffre vos documents de bout en bout — IDN ne peut PAS le récupérer.",
    unlockTitle: "Déverrouiller iDocument",
    unlockDesc:
      "Saisissez votre mot de passe vault pour accéder à vos documents.",
    passwordLabel: "Mot de passe vault",
    newPasswordLabel: "Nouveau mot de passe vault",
    hintLabel: "Indice (optionnel)",
    hintPlaceholder: "Ce qui peut vous rappeler ce mot de passe",
    hintRow: (hint: string) => `Indice : ${hint}`,
    activate: "Activer",
    unlock: "Déverrouiller",
    submitting: "…",
    minLengthError: "Mot de passe trop court (8 caractères minimum).",
    fallbackError: "Échec.",
    loading: "Chargement du coffre-fort…",
    irrecoverable:
      "IDN n'a aucun accès à votre mot de passe ni à vos documents. En cas de perte, ils sont irrécupérables.",
    rememberLabel: "Rester déverrouillé sur cet appareil",
    rememberDesc: "Pendant 7 jours, sur ce navigateur uniquement.",
  },
  home: {
    /** Sous-titre accueil — N documents · M dossiers. */
    subtitle: (docs: number, folders: number) =>
      `${docs} document${docs > 1 ? "s" : ""} · ${folders} dossier${folders > 1 ? "s" : ""}`,
    confidentialOn: "Désactiver mode confidentiel",
    confidentialOff: "Activer mode confidentiel",
    iaActive: "IA Active",
    iaHint: "Détection automatique du type & du dossier",
    searchPlaceholder: "Rechercher un document...",
    add: "Ajouter",
    export: "Export",
    /** Sous-label compteur de dossier. */
    folderCount: (n: number) =>
      n === 0
        ? "0 document"
        : n === 1
          ? "1 document"
          : `${n} documents`,
    folderHasExpiring: "Bientôt expirant",
  },
  folder: {
    /** Sous-titre vue dossier. */
    subtitle: (n: number) =>
      n === 0
        ? "0 document"
        : n === 1
          ? "1 document"
          : `${n} documents`,
    backToHome: "Retour aux dossiers",
    emptyTitle: "Aucun document dans ce dossier",
    emptyCta: "Ajouter un document",
    dropOverlayTitle: "Déposez vos fichiers ici",
    actions: {
      preview: "Aperçu",
      download: "Télécharger",
      delete: "Supprimer",
    },
    status: {
      pending: "En attente",
      verified: "VÉRIFIÉ",
      rejected: "Rejeté",
      expired: "Expiré",
    },
    sideFront: "RECTO",
    sideBack: "VERSO",
    neverExpires: "N'expire pas",
    expiresLabel: (date: string) => `Expire ${date}`,
    expiredLabel: "Expiré",
    expiresSoonLabel: (days: number) =>
      `Expire dans ${days} jour${days > 1 ? "s" : ""}`,
  },
  add: {
    select: {
      title: "Importer un fichier",
      sub: "PNG, JPG ou PDF (Max 10MB)",
      destinationLabel: "DOSSIER DE DESTINATION",
      destinationHint:
        "L'IA peut détecter automatiquement le bon dossier après l'upload.",
      pickFile: "Choisir un fichier",
      pickFileSub: "PDF, JPG, PNG · max 10 MB",
      capture: "Prendre une photo",
      cameraOnlyMobile:
        "La prise de photo est disponible sur l'application mobile.",
    },
    preview: {
      title: "Confirmer",
      aiDetectionTitle: "Détection IA",
      aiDetectionBody: (type: string, folder: string) =>
        `Type : ${type} · Dossier suggéré : ${folder}`,
      nameLabel: "Nom du document",
      expirationLabel: "Date d'expiration (optionnel)",
      expirationPlaceholder: "AAAA-MM-JJ",
      submit: "Confirmer l'envoi",
      encrypting: "Chiffrement & envoi…",
      cancel: "Annuler",
    },
    success: {
      title: "Document ajouté !",
      sub: "Votre document est en cours de vérification. Vous serez notifié·e dès qu'il sera validé.",
      backToList: "Retour aux documents",
      addAnother: "Ajouter un autre",
    },
    errors: {
      vaultLocked: "Coffre-fort verrouillé. Déverrouillez-le d'abord.",
      nameRequired: "Donnez un nom à ce document.",
      pickRequired: "Sélectionnez un fichier à ajouter.",
      tooLarge: "Fichier trop volumineux (10 Mo max).",
      invalidDate: "Format de date attendu : AAAA-MM-JJ",
      uploadFailed: "L'envoi a échoué.",
    },
  },
  preview: {
    backTitle: "Retour",
    sectionDetails: "DÉTAILS",
    fieldFolder: "Dossier",
    fieldType: "Type",
    fieldCreatedAt: "Ajouté le",
    fieldSize: "Taille",
    fieldStatus: "Statut",
    fieldExpiration: "Expire le",
    fieldSide: "Face",
    sideFront: "Recto",
    sideBack: "Verso",
    fieldSource: "Source",
    sourceUpload: "Upload",
    fieldVerified: "Vérifié",
    e2eBadge: "CHIFFRÉ E2E",
    download: "Télécharger",
    delete: "Supprimer",
    confirmDeleteTitle: "Supprimer ce document ?",
    confirmDeleteBody: (name: string) =>
      `Confirmer la suppression de « ${name} » ? Cette action est irréversible.`,
    confirmCancel: "Annuler",
    confirmDelete: "Supprimer",
    notFound: "Document introuvable.",
    loading: "Chargement…",
  },
  toasts: {
    documentAdded: "Document ajouté.",
    documentDeleted: "Document supprimé.",
    deleteFailed: "Suppression impossible.",
    vaultActivated: "Coffre-fort activé.",
    vaultUnlocked: "Coffre-fort déverrouillé.",
  },
} as const
