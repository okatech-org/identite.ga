/**
 * Strings UI iCarte (FR). Verbatim SPECS_FEATURES_CITIZEN.md §1.
 */

export const icarte = {
  title: "iCarte",
  subtitle: "Gérez toutes vos cartes numériques",
  featuredPill: (count: number, limit: number) =>
    `${count}/${limit} dans le profil`,
  viewProfile: "Voir le profil",
  sections: {
    featured: "CARTES DANS LE PROFIL",
    featuredHint: "Glissez pour réordonner",
    others: "AUTRES CARTES",
    othersCount: (count: number) =>
      `${count} carte${count > 1 ? "s" : ""}`,
    add: "AJOUTER UNE CARTE",
  },
  emptyFeatured: {
    title: "Aucune carte dans le profil",
    sub: "Ajoutez des cartes depuis la liste à droite",
  },
  emptyOthers: {
    title: "Toutes vos cartes sont dans le profil",
    sub: "Ajoutez de nouvelles cartes ci-dessous",
  },
  actions: {
    edit: "Modifier",
    addToProfile: "Ajouter au profil",
    removeFromProfile: "Retirer du profil",
    remove: "Supprimer",
    open: "Ouvrir →",
    see: "Voir",
    customLabel: "Personnalisée",
  },
  detail: {
    front: "RECTO",
    back: "VERSO",
    flipHint: "Cliquez pour retourner",
    emptyHint: "Renseignez vos informations",
    actions: {
      qr: "QR Code",
      download: "Télécharger",
      share: "Partager",
      edit: "Modifier",
    },
    comingSoon: "Bientôt disponible",
  },
  addModal: {
    title: "Ajouter une carte",
    typeSelected: "Type sélectionné",
    cardName: "Nom de la carte",
    subtitle: "Sous-titre",
    cancel: "Annuler",
    create: "Créer",
    creating: "Création…",
    backLabel: "VERSO",
    createSuccess: "Carte créée.",
    createError: "Impossible de créer la carte.",
  },
  editModal: {
    title: "Modifier la carte",
    name: "Nom",
    subtitle: "Sous-titre",
    cancel: "Annuler",
    save: "Enregistrer",
    saving: "Enregistrement…",
    frontLabel: "RECTO",
    backLabel: "VERSO",
    saveSuccess: "Carte modifiée.",
    saveError: "Impossible de modifier la carte.",
  },
  customModal: {
    title: "Carte Personnalisée",
    nameLabel: "Nom",
    nameDefault: "Ma Carte",
    subtitleLabel: "Sous-titre (optionnel)",
    colorLabel: "COULEUR",
    iconLabel: "ICÔNE",
    cancel: "Annuler",
    create: "Créer",
    creating: "Création…",
  },
  toast: {
    cardRemoved: "Carte supprimée.",
    removeError: "Suppression impossible.",
    featuredAdded: "Carte ajoutée au profil.",
    featuredRemoved: "Carte retirée du profil.",
    featuredError: "Action impossible.",
    reorderError: "Impossible de réordonner.",
    cnamgsComingSoon: "Page CNAMGS bientôt disponible.",
  },
  confirmRemove: (name: string) =>
    `Supprimer la carte « ${name} » ? Cette action est irréversible.`,
} as const
