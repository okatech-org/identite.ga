/**
 * Strings FR iBoîte mobile.
 *
 * Aligné sur `apps/web/app/(citizen)/iboite/_content/fr.ts` (verbatim spec
 * §2 SPECS_FEATURES_CITIZEN.md). Centralisé pour faciliter la migration
 * future vers i18n et éviter la divergence avec le web.
 *
 * Convention : pas de paraphrase — les libellés sont la source de vérité
 * design (cf. instruction utilisateur `feedback_no_invented_text`).
 */

export const iboiteFr = {
  title: 'iBoîte',
  subtitle: 'Vos courriers, colis et emails',
  loading: 'Chargement…',
  notAuthenticated: 'Connectez-vous pour accéder à iBoîte.',
  noAccount:
    'Aucun compte iBoîte. Terminez votre inscription pour activer votre adresse souveraine.',

  account: {
    listLabel: 'VOS BOÎTES',
    addBox: 'Ajouter une boîte',
    copyAddress: "Copier l'adresse",
    pointRelais: 'Point Relais idn.ga',
    configurePrompt: 'Configurer mon adresse',
    configureHint: 'Aucune adresse renseignée',
    editAddress: 'Modifier mon adresse',
  },

  sections: {
    courriers: 'Courriers',
    colis: 'Colis',
    emails: 'eMails',
  },

  courriers: {
    folders: {
      inbox: 'Réception',
      sent: 'Expédiés',
      pending: 'À traiter',
      trash: 'Poubelle',
    },
    newLetter: 'Nouveau courrier',
    actions: {
      reply: 'Répondre',
      replyAll: 'Répondre à tous',
      download: 'Télécharger',
      downloadShort: 'PDF',
      print: 'Imprimer',
      toPending: 'À traiter',
      delete: 'Suppr.',
    },
    empty: 'Aucun courrier dans ce dossier.',
    urgent: 'URGENT',
    actionRequired: 'Action requise',
    replyBy: (date: string) => `Réponse attendue avant le ${date}`,
    attachments: 'PIÈCES JOINTES',
    notFound: 'Courrier introuvable.',
    title: 'Courrier',
    print: {
      soon: "L'impression directe sera disponible dans une prochaine version.",
    },
  },

  colis: {
    title: 'Mes Colis',
    empty: 'Aucun colis pour le moment.',
    toPickUp: 'À retirer',
    inTransit: 'En transit',
    arrival: (date: string) => `Arrivée ${date}`,
    qrLabel: 'POINT RELAIS IDN.GA',
    qrHint: 'À présenter au retrait',
  },

  emails: {
    folders: {
      inbox: 'Réception',
      starred: 'Favoris',
      sent: 'Envoyés',
      trash: 'Corbeille',
    },
    newMessage: 'Nouveau message',
    actions: {
      reply: 'Répondre',
      replyAll: 'Répondre à tous',
      forward: 'Transférer',
      archive: 'Archiver',
      delete: 'Suppr.',
    },
    empty: 'Aucun email dans ce dossier.',
    title: 'Message',
    notFound: 'Message introuvable.',
    attachment: 'PIÈCE JOINTE',
    archiveSoon:
      "L'archivage sera proposé dans la prochaine version. En attendant, marquez ce message comme favori (étoile) pour le retrouver facilement.",
    attachmentDownloadLabel: 'Télécharger',
  },

  compose: {
    titleMessage: 'Nouveau message',
    titleLetter: 'Nouveau courrier',
    from: 'De',
    to: 'À',
    toPlaceholderEmail: 'destinataire@…',
    toPlaceholderLetter: 'login ou destinataire@idn.ga',
    name: 'Nom',
    namePlaceholder: 'Nom du destinataire (optionnel)',
    subject: 'Objet',
    bodyEmail: 'Votre message…',
    bodyLetter: 'Rédigez votre courrier…',
    attach: 'Joindre',
    attachSoon: 'Les pièces jointes seront ajoutées dans une prochaine version.',
    send: 'Envoyer',
    sending: '…',
    errors: {
      noAccount: 'Aucun compte iBoîte actif.',
      invalidRecipient: 'Saisissez une adresse email valide.',
      letterRecipient: 'Saisissez une adresse iBoîte (login ou alias @idn.ga).',
      subjectRequired: 'Donnez un objet à votre message.',
      bodyRequired: 'Écrivez votre message.',
      bodyRequiredLetter: 'Écrivez le contenu de votre courrier.',
      sendFailed: 'Envoi impossible.',
    },
  },

  address: {
    title: 'Configurer mon adresse',
    intro:
      'Au Gabon les adresses postales formelles sont rares. Nous utilisons votre position GPS pour localiser votre logement — vous pouvez compléter manuellement si besoin.',
    methodGps: 'Utiliser ma position GPS',
    methodGpsHint: 'Recommandé — précis et instantané',
    methodManual: 'Saisir manuellement',
    locating: 'Localisation en cours…',
    locatingHint: "Autorisez la géolocalisation à l'invite système pour continuer.",
    resolved: 'Adresse détectée',
    resolvedHint: 'Vérifiez les champs ci-dessous avant de confirmer.',
    district: 'Quartier',
    districtPlaceholder: 'ex. Akanda, Glass, Nzeng-Ayong',
    city: 'Ville',
    cityPlaceholder: 'ex. Libreville',
    postalCode: 'Boîte postale (optionnel)',
    postalCodePlaceholder: 'ex. BP 1000',
    country: 'Pays',
    addressLine: 'Adresse complète',
    addressLinePlaceholder: 'Précisez si besoin (point de repère, immeuble…)',
    useGps: 'Réessayer la géolocalisation',
    confirm: 'Enregistrer mon adresse',
    submitting: 'Enregistrement…',
    cancel: 'Annuler',
    error: {
      denied:
        'Géolocalisation refusée. Autorisez-la dans les réglages ou saisissez votre adresse à la main.',
      unavailable: 'Géolocalisation impossible. Réessayez ou saisissez à la main.',
      cityRequired:
        'Indiquez au moins votre ville ou activez la géolocalisation.',
      saveFailed: 'Réessayez plus tard.',
      accountMissing: 'Compte iBoîte introuvable.',
    },
  },
} as const;
