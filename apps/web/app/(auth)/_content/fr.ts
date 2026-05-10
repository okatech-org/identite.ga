/**
 * Textes du tunnel d'onboarding et des écrans d'auth.
 * Comme `(public)/_content/fr.ts`, centralisé pour faciliter la
 * migration future vers next-intl.
 */

export const STEP_TOTAL = 5

export const onboardingHeader = {
  backToHome: "Retour à l'accueil",
  backToProfile: "Retour à la sélection du profil",
  backToSignUp: "Modifier l'email",
  backToVerify: "Retour à la vérification",
  backToIdentity: "Retour à l'identité",
  backToEnter: "Re-saisir le PIN",
} as const

export const profile = {
  meta: { title: "Choisir mon profil", description: "Sélectionnez votre profil pour démarrer la création de votre compte IDN." },
  step: 1,
  title: "Quel est votre profil ?",
  sub: "Votre profil détermine les pièces demandées et les services accessibles.",
  options: [
    {
      value: "citizen" as const,
      label: "Citoyen Gabonais",
      sub: "CNI ou acte de naissance — Niveau 3 cible",
      loa: 3 as const,
    },
    {
      value: "resident" as const,
      label: "Résident",
      sub: "Carte de séjour + passeport — Niveau 2 cible",
      loa: 2 as const,
    },
    {
      value: "visitor" as const,
      label: "Visiteur Temporaire",
      sub: "Passeport + visa — Niveau 1",
      loa: 1 as const,
    },
    {
      value: "developer" as const,
      label: "Développeur",
      sub: "Entité morale, accès API",
      loa: null,
    },
  ],
  primary: "Continuer",
  back: "← Retour",
} as const

export const signUp = {
  meta: { title: "Créer un compte", description: "Créez votre compte IDN avec un email et un mot de passe sécurisé." },
  step: 2,
  title: "Créer un compte",
  sub: "Étape 2 sur 5 — vos identifiants de connexion.",
  emailLabel: "Adresse email",
  emailPlaceholder: "vous@example.ga",
  passwordLabel: "Mot de passe",
  passwordHint: "Minimum 12 caractères. Mélangez lettres, chiffres et symboles.",
  termsPrefix: "J'accepte les ",
  termsLink: "conditions d'utilisation et la politique de confidentialité",
  primary: "Recevoir le code de vérification",
  errorEmailTaken: "Cet email est déjà utilisé.",
  errorPasswordCompromised:
    "Ce mot de passe figure dans une fuite de données publique. Choisissez-en un autre.",
  errorPasswordWeak:
    "Mot de passe trop faible. Combinez plusieurs mots, chiffres et symboles.",
  errorGeneric:
    "Création de compte impossible pour le moment. Réessayez dans un instant.",
  signInPrefix: "Vous avez déjà un compte ? ",
  signInLink: "Se connecter",
  validation: {
    emailInvalid: "Adresse email invalide.",
    passwordTooShort: "Le mot de passe doit contenir au moins 12 caractères.",
    termsRequired: "Vous devez accepter les conditions d'utilisation.",
  },
} as const

export const verify = {
  meta: { title: "Vérifier mon email", description: "Saisissez le code à 6 chiffres reçu par email pour confirmer votre adresse." },
  step: 3,
  title: "Vérifiez votre adresse email",
  subPrefix: "Code à 6 chiffres envoyé à ",
  expiresIn: "Le code est valable 15 minutes.",
  resend: "Renvoyer le code",
  resendCooldown: (s: number) => `Renvoyer le code (${s}s)`,
  resentToast: "Nouveau code envoyé.",
  primary: "Vérifier",
  back: "← Modifier l'email",
  errorInvalid: "Code incorrect ou expiré.",
  errorTooManyAttempts: "Trop de tentatives. Réessayez plus tard.",
  successToast: "Email vérifié.",
} as const

export const identity = {
  meta: { title: "Mon identité", description: "Saisissez votre identité pivot." },
  step: 4,
  title: "Vos informations",
  sub: "Identité pivot — telles qu'elles figurent sur vos documents officiels.",
  fields: {
    firstName: { label: "Prénom", placeholder: "Aïssatou" },
    lastName: { label: "Nom", placeholder: "Mboumba" },
    dateOfBirth: { label: "Date de naissance" },
    gender: {
      label: "Genre",
      options: [
        { value: "F" as const, label: "Féminin" },
        { value: "M" as const, label: "Masculin" },
        { value: "O" as const, label: "Autre" },
        { value: "N" as const, label: "Préfère ne pas dire" },
      ],
    },
    birthPlace: { label: "Lieu de naissance", placeholder: "Libreville" },
    nationality: {
      label: "Nationalité",
      options: [
        { value: "GA", label: "Gabonaise" },
        { value: "CG", label: "Congolaise (Brazzaville)" },
        { value: "CD", label: "Congolaise (RDC)" },
        { value: "CM", label: "Camerounaise" },
        { value: "GQ", label: "Équato-guinéenne" },
        { value: "ST", label: "Santoméenne" },
        { value: "FR", label: "Française" },
        { value: "SN", label: "Sénégalaise" },
        { value: "CI", label: "Ivoirienne" },
        { value: "ML", label: "Malienne" },
        { value: "BJ", label: "Béninoise" },
        { value: "TG", label: "Togolaise" },
        { value: "BF", label: "Burkinabé" },
        { value: "NG", label: "Nigériane" },
        { value: "MA", label: "Marocaine" },
        { value: "CN", label: "Chinoise" },
        { value: "US", label: "Américaine" },
        { value: "GB", label: "Britannique" },
        { value: "JP", label: "Japonaise" },
      ],
    },
  },
  primary: "Continuer",
  back: "← Retour",
  validation: {
    required: "Champ requis.",
    dateInvalid: "Date invalide.",
    dateFuture: "La date de naissance doit être dans le passé.",
  },
} as const

export const pin = {
  meta: { title: "Créer mon PIN", description: "Créez votre PIN à 6 chiffres pour l'accès rapide à votre compte IDN." },
  step: 5,
  enterTitle: "Créer votre PIN",
  enterSub: "Un code à 6 chiffres pour les actions sensibles : signature, validation, accès rapide.",
  confirmTitle: "Confirmer votre PIN",
  confirmSub: "Saisissez à nouveau le même code pour confirmer.",
  primary: "Confirmer",
  primaryConfirm: "Confirmer",
  back: "← Retour",
  successToast: "Compte créé avec succès. Bienvenue sur IDN.",
  numpadAria: "Pavé numérique",
  backspaceAria: "Effacer le dernier chiffre",
  digitAria: (n: number) => `Chiffre ${n}`,
  dotsAria: (filled: number, total: number) =>
    `PIN saisi : ${filled} chiffre${filled > 1 ? "s" : ""} sur ${total}`,
  validation: {
    sixDigits: "Le PIN doit contenir exactement 6 chiffres.",
    weakSequence:
      "Suite trop évidente (par ex. 123456 ou 000000). Choisissez un autre PIN.",
    matchesDob: "Le PIN ne peut pas être votre date de naissance.",
    mismatch: "Les deux PIN ne correspondent pas.",
  },
} as const

export const signIn = {
  meta: { title: "Connexion", description: "Connectez-vous à votre compte IDN." },
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
  twoFactorHint: "Entrez le code généré par votre application d'authentification.",
  twoFactorPrimary: "Vérifier",
  signUpPrefix: "Pas encore de compte ? ",
  signUpLink: "Créer un compte IDN",
  errorInvalid: "Email ou mot de passe incorrect.",
  errorEmailNotVerified:
    "Veuillez vérifier votre adresse email avant de vous connecter.",
  errorGeneric: "Connexion impossible pour le moment. Réessayez.",
} as const

export const forgotPassword = {
  meta: { title: "Mot de passe oublié", description: "Recevez un code par email pour réinitialiser votre mot de passe." },
  title: "Réinitialiser votre mot de passe",
  sub: "Saisissez l'adresse email associée à votre compte. Vous recevrez un code à 6 chiffres pour choisir un nouveau mot de passe.",
  emailLabel: "Adresse email",
  primary: "Recevoir un code",
  primarySubmitting: "Envoi en cours…",
  back: "← Retour à la connexion",
  successToast: "Code envoyé. Vérifiez votre boîte de réception.",
  errorGeneric: "Envoi impossible pour le moment. Réessayez.",
} as const

export const resetPassword = {
  meta: { title: "Nouveau mot de passe", description: "Choisissez un nouveau mot de passe pour votre compte IDN." },
  title: "Nouveau mot de passe",
  sub: "Saisissez le code reçu par email et choisissez un nouveau mot de passe.",
  otpLabel: "Code à 6 chiffres",
  passwordLabel: "Nouveau mot de passe",
  confirmLabel: "Confirmation",
  primary: "Réinitialiser",
  primarySubmitting: "Réinitialisation en cours…",
  successToast: "Mot de passe réinitialisé. Vous pouvez vous connecter.",
  errorInvalidCode: "Code incorrect ou expiré.",
  errorMismatch: "Les deux mots de passe ne correspondent pas.",
  errorGeneric: "Réinitialisation impossible. Réessayez.",
} as const

