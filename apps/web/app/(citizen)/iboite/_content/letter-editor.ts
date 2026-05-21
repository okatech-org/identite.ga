/**
 * Strings de l'éditeur WYSIWYG du courrier (boutons toolbar, prompts).
 * Ces strings sont des aria-labels et tooltips — pas issues des maquettes
 * (les maquettes ne décrivent pas l'éditeur de rédaction lui-même).
 */
export const letterEditorContent = {
  toolbarLabel: "Mise en forme du courrier",
  linkPrompt: "URL du lien (vide pour retirer) :",
  toolbar: {
    undo: "Annuler",
    redo: "Rétablir",
    bold: "Gras",
    italic: "Italique",
    underline: "Souligné",
    h1: "Titre 1",
    h2: "Titre 2",
    h3: "Titre 3",
    alignLeft: "Aligner à gauche",
    alignCenter: "Centrer",
    alignRight: "Aligner à droite",
    alignJustify: "Justifier",
    bulletList: "Liste à puces",
    orderedList: "Liste numérotée",
    horizontalRule: "Séparateur",
    link: "Lien",
    image: "Insérer une image",
  },
} as const
