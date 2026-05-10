/**
 * Textes des pages publiques en français.
 * Centralisé ici pour faciliter l'extraction future vers une lib i18n
 * (next-intl ou équivalent) sans toucher aux composants.
 */

export const navTabs = [
  { href: "/a-propos", label: "À propos" },
  { href: "/services", label: "Services" },
  { href: "/administrations", label: "Administrations" },
  { href: "/aide", label: "Aide" },
  { href: "/etat", label: "État" },
] as const

export const navActions = {
  signIn: "Se connecter",
  signUp: "Créer un compte",
  republic: "RÉPUBLIQUE GABONAISE",
  brand: "Identité Numérique",
} as const

export const footer = {
  copyright:
    "© République Gabonaise — Agence Nationale des Infrastructures Numériques",
  links: [
    { href: "/mentions-legales", label: "Mentions légales" },
    { href: "/mentions-legales", label: "Confidentialité" },
    { href: "/aide", label: "Accessibilité" },
    { href: "/contact", label: "Contact" },
  ],
  skipToMain: "Aller au contenu principal",
} as const

export const welcome = {
  meta: {
    title: "Accueil",
    description:
      "Identité Numérique du Gabon — un compte unique pour accéder à tous les services administratifs en ligne. Authentifiez-vous une fois, accédez à tout.",
  },
  eyebrow: "RÉPUBLIQUE GABONAISE · IDN v1.2",
  title: {
    line1: "Un compte unique",
    line2: "pour tous les services",
    line3: "de l'État.",
  },
  sub: "Authentifiez-vous une fois sur IDN, accédez à l'ensemble des services administratifs gabonais — consulats, ministères, e-Visa, bourses, santé.",
  ctaPrimary: "Créer un compte IDN",
  ctaSecondary: "Se connecter",
  loa: {
    eyebrow: "NIVEAUX DE GARANTIE",
    items: [
      {
        level: 1,
        name: "Faible",
        description: "Email vérifié — services informatifs, e-Visa.",
      },
      {
        level: 2,
        name: "Substantiel",
        description: "Document + selfie liveness — résidents.",
      },
      {
        level: 3,
        name: "Élevé",
        description: "KYC vidéo + état civil — services régaliens.",
      },
    ] as const,
  },
} as const

export const about = {
  meta: {
    title: "À propos",
    description:
      "L'IDN est l'infrastructure de confiance qui relie chaque citoyen, résident et visiteur aux services administratifs en ligne du Gabon.",
  },
  hero: {
    eyebrow: "À PROPOS D'IDN",
    title: "Une identité numérique souveraine pour chaque Gabonais·e.",
    sub: "L'IDN est l'infrastructure de confiance qui relie chaque citoyen, résident et visiteur à l'ensemble des services administratifs en ligne — sans recréer un compte à chaque fois.",
  },
  stats: [
    { value: "142 318", label: "Comptes IDN actifs" },
    { value: "23", label: "Services intégrés" },
    { value: "99,98 %", label: "Disponibilité 12 mois" },
  ],
  principles: {
    eyebrow: "NOS PRINCIPES",
    items: [
      {
        title: "Souveraineté des données",
        description:
          "Hébergement national, chiffrement de bout en bout, pas de transfert hors du Gabon.",
      },
      {
        title: "Consentement explicite",
        description:
          "Chaque service obtient votre accord pour les données strictement nécessaires.",
      },
      {
        title: "Niveaux de garantie eIDAS",
        description:
          "Trois niveaux (faible, substantiel, élevé) calibrés sur la sensibilité des services.",
      },
      {
        title: "Inclusion territoriale",
        description:
          "Parcours mobile complet, USSD pour zones non connectées, antennes dans les neuf provinces.",
      },
    ],
  },
  governance: {
    eyebrow: "GOUVERNANCE",
    body: "IDN est opéré par l'Agence Nationale des Infrastructures Numériques (ANINF) sous la tutelle du Ministère de l'Économie Numérique. Le code source des composants critiques est audité chaque année par la Cour des Comptes et un cabinet indépendant.",
  },
} as const

export const administrations = {
  meta: {
    title: "Pour les administrations",
    description:
      "Intégrez IDN à votre service en quelques jours. Standard OpenID Connect, SDK officiels, accompagnement par l'ANINF.",
  },
  hero: {
    eyebrow: "POUR LES ADMINISTRATIONS",
    title: "Intégrez IDN à votre service en quelques jours.",
    sub: "Standard OpenID Connect, SDK officiels, accompagnement par l'ANINF. Conforme RGPD et à la loi gabonaise sur la protection des données personnelles.",
  },
  steps: [
    {
      n: "01",
      title: "Demande d'intégration",
      description:
        "Constituez un dossier technique et fonctionnel auprès de l'ANINF. Réponse sous 10 jours ouvrés.",
    },
    {
      n: "02",
      title: "Validation et niveau de garantie",
      description:
        "L'ANINF qualifie le LoA minimum (1, 2 ou 3) requis selon la sensibilité du service.",
    },
    {
      n: "03",
      title: "Mise en production",
      description:
        "Test sur sandbox, audit de sécurité, déploiement progressif puis bascule complète.",
    },
  ],
  cta: {
    title: "Vous êtes développeur·se intégrant un service public ?",
    sub: "Le portail développeur expose les SDK, la sandbox et les clés OAuth.",
    primary: "Portail développeur",
    secondary: "Documentation",
  },
} as const

export const help = {
  meta: {
    title: "Aide & FAQ",
    description:
      "Réponses aux questions fréquentes sur IDN, les niveaux de garantie, la sécurité et la confidentialité.",
  },
  hero: {
    eyebrow: "AIDE & FAQ",
    title: "Questions fréquentes.",
    sub: "Vous ne trouvez pas votre réponse ? Contactez le support au 1407 ou via le formulaire.",
  },
  faqs: [
    {
      q: "Qu'est-ce qu'un niveau de garantie (LoA) ?",
      a: "Le niveau de garantie indique le degré de certitude avec lequel IDN connaît votre identité. Niveau 1 (faible) = email vérifié. Niveau 2 (substantiel) = pièce d'identité + selfie liveness. Niveau 3 (élevé) = vérification vidéo + état civil croisé.",
    },
    {
      q: "Comment passer du Niveau 1 au Niveau 2 ?",
      a: "Depuis votre tableau de bord, lancez la vérification d'identité. Vous serez guidé pour photographier votre CNI ou passeport, puis effectuer un selfie animé. Comptez 5 minutes.",
    },
    {
      q: "Que faire si j'ai perdu mon téléphone ?",
      a: "Connectez-vous depuis un autre appareil, allez dans Paramètres → Appareils & sessions, et révoquez la session de l'appareil perdu. Si vous avez perdu l'accès au compte entièrement, contactez le support avec votre PIN de récupération.",
    },
    {
      q: "Mes données sont-elles partagées avec les administrations ?",
      a: "Uniquement avec votre consentement explicite et seulement les champs nécessaires au service. Vous pouvez révoquer un consentement à tout moment.",
    },
    {
      q: "IDN fonctionne-t-il sans internet ?",
      a: "Un canal USSD (*242#) permet les opérations essentielles depuis n'importe quel téléphone. Antennes physiques dans les neuf provinces.",
    },
    {
      q: "Comment supprimer mon compte ?",
      a: "Paramètres → Données & confidentialité → Supprimer mon compte. Délai légal de conservation des logs d'audit : 5 ans après suppression.",
    },
  ],
  callCenter: {
    title: "Centre d'appel IDN",
    sub: "1407 — gratuit depuis le Gabon · 24/7 · français, fang, myènè, punu, nzébi",
    cta: "Formulaire",
  },
} as const

export const legal = {
  meta: {
    title: "Mentions légales",
    description:
      "Politique de confidentialité, responsable de traitement, durée de conservation et droits des personnes pour la plateforme IDN.",
  },
  hero: {
    eyebrow: "MENTIONS LÉGALES",
    title: "Politique de confidentialité.",
    sub: "Mise à jour le 18 mars 2026 · version 4.2",
  },
  sections: [
    {
      title: "Responsable de traitement",
      body: "Agence Nationale des Infrastructures Numériques (ANINF), 248 boulevard du Bord de Mer, BP 12 345, Libreville, République Gabonaise.",
    },
    {
      title: "Données collectées",
      body: "Identité pivot (nom, prénom, date et lieu de naissance, sexe, nationalité), email, numéro de téléphone, données biométriques (empreinte du visage), pièces d'identité scannées, journaux d'authentification.",
    },
    {
      title: "Finalités",
      body: "Authentification unifiée aux services administratifs, vérification d'identité (KYC), prévention de la fraude, audit légal.",
    },
    {
      title: "Durée de conservation",
      body: "Données du compte : tant que le compte est actif, plus 30 jours après suppression. Logs d'audit : 5 ans (obligation légale). Données biométriques : non conservées après vérification — seul un hash est gardé.",
    },
    {
      title: "Droits",
      body: "Accès, rectification, portabilité, opposition, suppression. Exercer vos droits depuis Paramètres → Données & confidentialité, ou par courrier à l'ANINF avec copie de la pièce d'identité.",
    },
    {
      title: "Cookies",
      body: "IDN utilise uniquement des cookies de session strictement nécessaires. Aucun traceur publicitaire ou analytique tiers.",
    },
  ],
} as const

export const status = {
  meta: {
    title: "État du service",
    description:
      "Disponibilité en temps réel des composants IDN : authentification, OIDC, KYC, notifications, USSD.",
  },
  hero: {
    eyebrow: "ÉTAT DU SERVICE",
    title: "Tous les systèmes essentiels fonctionnent.",
    sub: "Vue temps réel · mise à jour il y a 23 secondes",
  },
  incidentsLabel: "INCIDENTS RÉCENTS",
} as const

export const contact = {
  meta: {
    title: "Contact",
    description:
      "Centre d'appel 1407, antennes provinciales, formulaire de contact pour citoyens, administrations, presse et sécurité.",
  },
  hero: {
    eyebrow: "NOUS CONTACTER",
    title: "Comment pouvons-nous vous aider ?",
    sub: "Choisissez le canal le plus adapté à votre demande.",
  },
  channels: [
    {
      title: "Centre d'appel",
      description:
        "1407 (gratuit depuis le Gabon)\n+241 11 40 70 00 (international)",
      cta: "Appeler",
      href: "tel:1407",
    },
    {
      title: "Antenne physique",
      description:
        "9 antennes provinciales\nLibreville · Port-Gentil · Franceville · Oyem · Lambaréné · Mouila · Tchibanga · Makokou · Koulamoutou",
      cta: "Voir la carte",
      href: "#",
    },
    {
      title: "Email",
      description: "support@idn.ga\nRéponse sous 48h ouvrées",
      cta: "Écrire",
      href: "mailto:support@idn.ga",
    },
  ],
  form: {
    title: "Envoyer un message",
    sub: "Nous répondons sous 48h ouvrées. Pour une urgence, privilégiez le 1407.",
    categoryLabel: "Catégorie",
    categories: [
      { value: "citoyen", label: "Citoyen" },
      { value: "administration", label: "Administration" },
      { value: "presse", label: "Presse" },
      { value: "securite", label: "Sécurité (faille, fraude)" },
    ],
    nameLabel: "Nom complet",
    emailLabel: "Email",
    subjectLabel: "Sujet",
    messageLabel: "Message",
    submit: "Envoyer le message",
    submitting: "Envoi en cours…",
    successTitle: "Message envoyé",
    successDescription:
      "Nous accusons réception de votre demande. Une réponse vous parviendra par email sous 48h ouvrées.",
    errorTitle: "Échec de l'envoi",
    errorDescription:
      "Une erreur est survenue. Réessayez dans un instant ou contactez le 1407.",
    validation: {
      nameMin: "Le nom doit contenir au moins 2 caractères.",
      emailInvalid: "Adresse email invalide.",
      subjectMin: "Le sujet doit contenir au moins 3 caractères.",
      messageMin: "Le message doit contenir au moins 10 caractères.",
    },
  },
} as const

export const services = {
  meta: {
    title: "Annuaire des services",
    description:
      "23 démarches administratives accessibles avec votre compte IDN — affaires consulaires, état civil, fiscalité, éducation, santé, justice.",
  },
  hero: {
    eyebrow: "ANNUAIRE",
    title: "Tous les services intégrés.",
    sub: "23 démarches administratives accessibles avec votre compte IDN — selon votre niveau de garantie.",
  },
  filters: [
    { value: "all", label: "Tous" },
    { value: "1", label: "Niveau 1" },
    { value: "2", label: "Niveau 2" },
    { value: "3", label: "Niveau 3" },
  ] as const,
} as const
