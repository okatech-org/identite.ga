/**
 * Strings de la page de connexion — copie de
 * `apps/web/app/(auth)/_content/fr.ts:175-196`.
 *
 * Pas de variation par rapport à la version citoyen : la maquette ne
 * propose pas de page de connexion contrôleur dédiée (cf. interfaces).
 */
export const signIn = {
  meta: {
    title: "Connexion",
    description: "Connectez-vous à votre compte IDN.",
  },
  title: "Connectez-vous",
  sub: "à votre compte Identité Numérique",
  emailLabel: "Email",
  passwordLabel: "Mot de passe",
  forgotLink: "Mot de passe oublié ?",
  primary: "Se connecter",
  primarySubmitting: "Connexion en cours…",
  qrLabel: "OU",
  qrCta: "Scanner le QR depuis l'app mobile",
  qrTooltip: "Bientôt disponible",
  twoFactorLabel: "Code à 6 chiffres",
  twoFactorHint:
    "Entrez le code généré par votre application d'authentification.",
  twoFactorPrimary: "Vérifier",
  signUpPrefix: "Pas encore de compte ? ",
  signUpLink: "Créer un compte IDN",
  errorInvalid: "Email ou mot de passe incorrect.",
  errorEmailNotVerified:
    "Veuillez vérifier votre adresse email avant de vous connecter.",
  errorGeneric: "Connexion impossible pour le moment. Réessayez.",
} as const
