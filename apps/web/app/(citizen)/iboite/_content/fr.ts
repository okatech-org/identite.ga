/**
 * Strings UI iBoîte (FR). Verbatim SPECS_FEATURES_CITIZEN.md §2.
 *
 * ⚠ Ne pas paraphraser : tous les libellés sont la source de vérité design.
 */

export const iboite = {
  title: "iBoîte",
  subtitle: "Vos courriers, colis et emails",
  loading: "Chargement…",
  notAuthenticated: "Connectez-vous pour accéder à iBoîte.",
  noAccount:
    "Aucun compte iBoîte. Terminez votre inscription pour activer votre adresse souveraine.",

  account: {
    listLabel: "VOS BOÎTES",
    addBox: "Ajouter une boîte",
    copyAddress: "Copier l'adresse",
    copied: "Adresse copiée",
    pointRelais: "Point Relais idn.ga",
    configurePrompt: "Configurer mon adresse",
    configureHint: "Aucune adresse renseignée",
  },

  address: {
    title: "Configurer mon adresse",
    intro:
      "Au Gabon les adresses postales formelles sont rares. Nous utilisons votre position GPS pour localiser votre logement — vous pouvez compléter manuellement si besoin.",
    methodGps: "Utiliser ma position GPS",
    methodGpsHint: "Recommandé — précis et instantané",
    methodManual: "Saisir manuellement",
    locating: "Localisation en cours…",
    locatingHint:
      "Autorisez la géolocalisation dans votre navigateur pour continuer.",
    resolved: "Adresse détectée",
    resolvedHint:
      "Vérifiez les champs ci-dessous et corrigez si nécessaire avant de confirmer.",
    district: "Quartier",
    districtPlaceholder: "ex. Akanda, Glass, Nzeng-Ayong",
    city: "Ville",
    cityPlaceholder: "ex. Libreville",
    postalCode: "Boîte postale (optionnel)",
    postalCodePlaceholder: "ex. BP 1000",
    country: "Pays",
    addressLine: "Adresse complète",
    addressLinePlaceholder: "Précisez si besoin (point de repère, immeuble…)",
    useGps: "Réessayer la géolocalisation",
    switchToManual: "Plutôt saisir à la main",
    confirm: "Enregistrer mon adresse",
    submitting: "Enregistrement…",
    saved: "Adresse enregistrée.",
    error: {
      denied:
        "Géolocalisation refusée. Autorisez-la dans les paramètres de votre navigateur ou saisissez votre adresse à la main.",
      unavailable:
        "Position GPS indisponible. Réessayez à l'extérieur ou saisissez votre adresse à la main.",
      timeout:
        "La géolocalisation prend trop de temps. Réessayez ou saisissez votre adresse à la main.",
      geocoder:
        "Impossible de résoudre votre adresse depuis votre position. Saisissez-la à la main.",
      saveFailed: "Enregistrement impossible.",
      cityRequired: "Indiquez au moins votre ville ou utilisez la géolocalisation.",
    },
    osmAttribution: "Données ©",
    osmAttributionLink: "OpenStreetMap",
    cancel: "Annuler",
  },

  sections: {
    courriers: "Courriers",
    colis: "Colis",
    emails: "eMails",
  },

  courriers: {
    folders: {
      inbox: "Réception",
      sent: "Expédiés",
      pending: "À traiter",
      trash: "Poubelle",
    },
    newLetter: "Nouveau courrier",
    actions: {
      title: "Actions",
      reply: "Répondre",
      download: "Télécharger",
      print: "Imprimer",
      toPending: "À traiter",
      share: "Partager",
      delete: "Supprimer",
    },
    countLabel: (n: number) => `${n} courrier${n > 1 ? "s" : ""}`,
    empty: "Aucun courrier",
    urgent: "URGENT",
    toProcess: "À TRAITER",
    actionRequired: "Action requise",
    replyBy: (date: string) => `Réponse attendue avant le ${date}`,
    replyBySoon: "Réponse attendue prochainement",
    attachments: "Pièces jointes",
    objet: (subject: string) => `Objet : ${subject}`,
    cityDate: (city: string, date: string) => `${city}, le ${date}`,
    backToList: "Retour à la liste",
    soonAvailable: "Bientôt disponible",
  },

  colis: {
    title: "Mes Colis",
    countLabel: (n: number) => `${n} colis`,
    empty: "Aucun colis",
    statusTitle: "Statut",
    toPickUp: "À retirer",
    inTransit: "En transit",
    toPickUpCount: (n: number) => `${n} à retirer`,
    inTransitCount: (n: number) => `${n} en transit`,
    from: (sender: string) => `De: ${sender}`,
    arrival: (date: string) => `Arrivée: ${date}`,
    qrLabel: "POINT RELAIS IDN.GA",
    qrHint: "À présenter au retrait",
  },

  emails: {
    folders: {
      inbox: "Boîte de réception",
      starred: "Favoris",
      sent: "Envoyés",
      trash: "Corbeille",
    },
    newMessage: "Nouveau message",
    countLabel: (n: number) => `${n} message${n > 1 ? "s" : ""}`,
    empty: "Aucun message",
    actions: {
      title: "Actions",
      reply: "Répondre",
      replyAll: "Répondre à tous",
      forward: "Transférer",
      archive: "Archiver",
      delete: "Supprimer",
    },
    addStar: "Ajouter aux favoris",
    removeStar: "Retirer des favoris",
    attachments: "Pièces jointes",
    download: "Télécharger",
    toLine: (email: string, date: string) => `À: ${email} • ${date}`,
  },

  compose: {
    title: "Nouveau message",
    replyTitle: "Répondre",
    to: "À",
    toPlaceholder: "destinataire@…",
    subject: "Objet",
    subjectPlaceholder: "Objet",
    body: "Votre message...",
    attach: "Joindre",
    cancel: "Annuler",
    send: "Envoyer",
    sending: "…",
    from: "De",
    errors: {
      noAccount: "Aucun compte iBoîte actif.",
      invalidRecipient: "Saisissez une adresse email valide.",
      invalidDomain: "Adresse non valide. Seul le domaine @idn.ga est accepté.",
      recipientUnknown:
        "Aucun utilisateur ne correspond à cette adresse iBoîte.",
      subjectRequired: "Donnez un objet à votre message.",
      bodyRequired: "Écrivez votre message.",
      sendFailed: "Envoi impossible.",
    },
  },

  letterCompose: {
    title: "Nouveau courrier",
    errors: {
      attachmentTooLarge: (max: string) =>
        `Pièce jointe trop volumineuse (max ${max}).`,
      imageUploadFailed: "Impossible d'insérer l'image. Réessayez.",
      removeAttachment: (name: string) => `Retirer la pièce jointe ${name}`,
    },
  },

  toasts: {
    sent: "Message envoyé.",
    letterSent: "Courrier envoyé.",
    downloadFailed: "Téléchargement impossible.",
    movedToPending: "Courrier déplacé vers « À traiter ».",
    movedToTrash: "Courrier supprimé.",
    emailDeleted: "Message supprimé.",
    starred: "Ajouté aux favoris.",
    unstarred: "Retiré des favoris.",
    packagePickedUp: "Colis marqué comme retiré.",
    moveFailed: "Action impossible.",
    addressCopied: "Adresse copiée.",
    soonAvailable: "Bientôt disponible.",
    archiveSoon:
      "L'archivage sera proposé dans la prochaine version. En attendant, marquez ce message comme favori (étoile) pour le retrouver facilement.",
    printSoon:
      "L'impression directe sera disponible dans une prochaine version.",
  },
} as const

export type CourrierFolder = keyof typeof iboite.courriers.folders
export type EmailFolder = keyof typeof iboite.emails.folders
export type SectionKey = keyof typeof iboite.sections
