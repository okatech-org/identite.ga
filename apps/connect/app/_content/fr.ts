/**
 * Strings française du point d'authentification fédéré.
 */
export const fr = {
  brand: {
    name: "Identité Numérique",
  },

  signIn: {
    title: "Connexion à votre compte",
    subtitle: "Authentifiez-vous pour continuer vers l'application demandeuse.",
    handleLabel: "Identifiant IDN",
    handleHint: "Avec ou sans @idn.ga",
    handlePlaceholder: "prenom.nom",
    handleInvalid: "Identifiant IDN invalide.",
    continue: "Continuer",
    pinTitle: "Entrez votre PIN",
    pinSub: "Saisissez votre code à 6 chiffres pour vous connecter.",
    pinBack: "Modifier l'identifiant",
    pinPrimary: "Se connecter",
    pinErrorInvalid: "PIN incorrect. Réessayez.",
    pinErrorTooMany: "Trop de tentatives. Réessayez dans une minute.",
    pinNumpadAria: "Pavé numérique",
    pinBackspaceAria: "Effacer le dernier chiffre",
    pinDigitAria: (n: number) => `Chiffre ${n}`,
    pinDotsAria: (filled: number, total: number) =>
      `PIN saisi : ${filled} chiffre${filled > 1 ? "s" : ""} sur ${total}`,
    submitting: "Connexion…",
    errorEmailNotVerified:
      "Veuillez vérifier votre adresse email avant de vous connecter.",
    errorGeneric:
      "Impossible de vous connecter pour le moment. Réessayez dans un instant.",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte sur identite.ga",
  },
} as const
