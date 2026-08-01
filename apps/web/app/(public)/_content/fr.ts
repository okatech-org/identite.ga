/**
 * Textes des pages publiques en français.
 * Centralisé ici pour faciliter l'extraction future vers une lib i18n
 * (next-intl ou équivalent) sans toucher aux composants.
 */

export const navTabs = [
  { href: "/about", label: "À propos" },
  { href: "/services", label: "Services" },
  { href: "/admins", label: "Administrations" },
  { href: "/help", label: "Aide" },
  { href: "/status", label: "État" },
] as const;

export const navActions = {
  signIn: "Se connecter",
  signUp: "Créer un compte",
  republic: "RÉPUBLIQUE GABONAISE",
  brand: "Identité Numérique",
} as const;

export const mobileNav = {
  menuLabel: "Ouvrir le menu",
  menuTitle: "Menu",
  menuDescription: "Navigation et actions du compte IDN.",
  closeLabel: "Fermer le menu",
  themeLabel: "Apparence",
} as const;

export const mobileFooter = {
  copyright: "Ntsagui digital",
} as const;

export const footer = {
  copyright: "Ntsagui digital",
  links: [
    { href: "/legal/mentions", label: "Mentions légales" },
    { href: "/legal/privacy", label: "Confidentialité" },
    { href: "/legal/terms", label: "Conditions d'utilisation" },
    { href: "/legal/accessibilite", label: "Accessibilité" },
    { href: "/contact", label: "Contact" },
  ],
  skipToMain: "Aller au contenu principal",
} as const;

export const welcome = {
  meta: {
    title: "Accueil",
    description:
      "Identité Numérique du Gabon — un compte unique pour accéder à tous les services administratifs en ligne. Authentifiez-vous une fois, accédez à tout.",
  },
  eyebrow: "RÉPUBLIQUE GABONAISE · IDN v1.2",
  title: {
    line1: "Un citoyen,",
    line2: "une identité numérique",
    line3: "et un portefeuille souverain.",
  },
  sub: "Authentifiez-vous une fois, accédez à l'ensemble des services administratifs gabonais en toute sécurité.",
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
} as const;

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
    body: "IDN est opéré par Ntsagui digital. Le code source des composants critiques est audité chaque année par la Cour des Comptes et un cabinet indépendant.",
  },
} as const;

export const administrations = {
  meta: {
    title: "Pour les administrations",
    description:
      "Intégrez IDN à votre service en quelques jours. Standard OpenID Connect, SDK officiels, accompagnement par Ntsagui digital.",
  },
  hero: {
    eyebrow: "POUR LES ADMINISTRATIONS",
    title: "Intégrez IDN à votre service en quelques jours.",
    sub: "Standard OpenID Connect, SDK officiels, accompagnement par Ntsagui digital. Conforme RGPD et à la loi gabonaise sur la protection des données personnelles.",
  },
  steps: [
    {
      n: "01",
      title: "Demande d'intégration",
      description:
        "Constituez un dossier technique et fonctionnel auprès de Ntsagui digital. Réponse sous 10 jours ouvrés.",
    },
    {
      n: "02",
      title: "Validation et niveau de garantie",
      description:
        "Ntsagui digital qualifie le LoA minimum (1, 2 ou 3) requis selon la sensibilité du service.",
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
} as const;

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
} as const;

/**
 * Index `/legal` — liste des sous-pages obligatoires.
 * Les sous-pages dédiées (privacy, terms, mentions, accessibilite,
 * delete-account, licenses) ont des URLs stables linkables depuis les
 * stores et l'app mobile.
 */
export const legal = {
  meta: {
    title: "Informations légales",
    description:
      "Politique de confidentialité, conditions d'utilisation, mentions légales, accessibilité et suppression de compte pour la plateforme IDN.",
  },
  hero: {
    eyebrow: "INFORMATIONS LÉGALES",
    title: "Vos droits, nos engagements.",
    sub: "Toutes les informations légales et de conformité de la plateforme Identité Numérique du Gabon.",
  },
  items: [
    {
      href: "/legal/privacy",
      title: "Politique de confidentialité",
      description:
        "Données collectées, finalités, durée de conservation, droits RGPD et loi 001/2011.",
    },
    {
      href: "/legal/terms",
      title: "Conditions d'utilisation",
      description:
        "Règles d'usage de la plateforme, engagements de l'utilisateur, responsabilités.",
    },
    {
      href: "/legal/mentions",
      title: "Mentions légales",
      description:
        "Éditeur, hébergeur, contact, responsable de traitement.",
    },
    {
      href: "/legal/accessibilite",
      title: "Accessibilité",
      description:
        "Déclaration de conformité au référentiel RGAA 4.1.2.",
    },
    {
      href: "/legal/delete-account",
      title: "Suppression de compte",
      description:
        "Comment supprimer votre compte IDN et toutes vos données personnelles.",
    },
    {
      href: "/legal/licenses",
      title: "Licences open source",
      description:
        "Composants logiciels tiers utilisés et leurs licences.",
    },
  ],
} as const;

export const privacy = {
  meta: {
    title: "Politique de confidentialité",
    description:
      "Données collectées, finalités, durée de conservation et droits des personnes pour la plateforme IDN.",
  },
  hero: {
    eyebrow: "POLITIQUE DE CONFIDENTIALITÉ",
    title: "Protection de vos données personnelles.",
    sub: "Mise à jour le 22 mai 2026 · conforme au RGPD et à la loi gabonaise 001/2011",
  },
  sections: [
    {
      title: "Responsable de traitement",
      body: "Ntsagui digital, 248 boulevard du Bord de Mer, BP 12 345, Libreville, République Gabonaise. Délégué à la protection des données : privacy@identite.ga.",
    },
    {
      title: "Données collectées",
      body: "Identité pivot (nom, prénom, date et lieu de naissance, sexe, nationalité), email, numéro de téléphone, données biométriques (empreinte du visage), pièces d'identité scannées, journaux d'authentification, adresse postale (iBoîte), métadonnées de connexion (IP, type d'appareil).",
    },
    {
      title: "Finalités",
      body: "Authentification unifiée aux services administratifs, vérification d'identité (KYC), prévention de la fraude, audit légal, courrier numérique iBoîte, archivage personnel iDocument.",
    },
    {
      title: "Base légale",
      body: "Exécution d'une mission de service public (article 6(1)(e) du RGPD ; article 5 de la loi 001/2011), consentement explicite pour les fonctionnalités optionnelles, obligation légale pour les logs d'audit.",
    },
    {
      title: "Durée de conservation",
      body: "Données du compte : tant que le compte est actif, plus 30 jours après demande de suppression. Logs d'audit : 5 ans après suppression (obligation légale). Données biométriques : non conservées après vérification — seul un hash irréversible est gardé. Pièces d'identité scannées : 90 jours après vérification puis suppression.",
    },
    {
      title: "Destinataires",
      body: "Aucune donnée n'est transférée à des tiers commerciaux. Les administrations partenaires ne reçoivent que les champs strictement nécessaires au service demandé, et uniquement après votre consentement explicite (OAuth scopes).",
    },
    {
      title: "Hébergement et transferts",
      body: "Hébergement national au Gabon. Aucun transfert de données hors du territoire gabonais sans clause contractuelle type validée par Ntsagui digital.",
    },
    {
      title: "Droits des personnes",
      body: "Vous disposez d'un droit d'accès, de rectification, de portabilité, d'opposition et de suppression. Exercer vos droits : depuis l'app Identité Numérique → Paramètres → Confidentialité, ou par email à privacy@identite.ga, ou par courrier à Ntsagui digital avec copie de la pièce d'identité.",
    },
    {
      title: "Suppression de compte",
      body: "Vous pouvez supprimer votre compte à tout moment depuis Paramètres → Confidentialité → Supprimer mon compte. La suppression est effective après un délai de 30 jours (annulable pendant cette période en vous reconnectant). Voir aussi /legal/delete-account.",
    },
    {
      title: "Cookies",
      body: "IDN utilise uniquement des cookies de session strictement nécessaires au fonctionnement. Aucun traceur publicitaire ou analytique tiers. Aucun consentement n'est requis pour ces cookies essentiels.",
    },
    {
      title: "Réclamation",
      body: "En cas de litige, vous pouvez saisir la Commission Nationale pour la Protection des Données à Caractère Personnel (CNPDCP) du Gabon.",
    },
  ],
} as const;

export const terms = {
  meta: {
    title: "Conditions d'utilisation",
    description:
      "Règles d'usage de la plateforme Identité Numérique du Gabon : compte, sécurité, engagements et responsabilités.",
  },
  hero: {
    eyebrow: "CONDITIONS D'UTILISATION",
    title: "Règles d'usage de la plateforme.",
    sub: "Mise à jour le 22 mai 2026 · acceptées à la création du compte",
  },
  sections: [
    {
      title: "Objet",
      body: "Les présentes conditions régissent l'utilisation de la plateforme Identité Numérique du Gabon (IDN), opérée par Ntsagui digital. La création d'un compte vaut acceptation pleine et entière.",
    },
    {
      title: "Éligibilité",
      body: "Le compte IDN est ouvert à toute personne physique citoyenne, résidente ou visiteuse du Gabon, âgée d'au moins 16 ans. Les mineurs de moins de 16 ans nécessitent l'accord d'un représentant légal.",
    },
    {
      title: "Identité réelle",
      body: "Vous vous engagez à fournir des informations exactes et à jour. Toute fausse déclaration peut entraîner la suspension du compte et des poursuites pénales conformément au code pénal gabonais.",
    },
    {
      title: "Sécurité du compte",
      body: "Vous êtes responsable de la confidentialité de vos moyens d'authentification (mot de passe, code PIN, passkey). Toute opération réalisée avec vos identifiants est réputée effectuée par vous. Signalez immédiatement toute utilisation frauduleuse au 1407.",
    },
    {
      title: "Usage acceptable",
      body: "Il est interdit d'utiliser IDN pour des activités illégales, de tenter de contourner les mesures de sécurité, d'usurper l'identité d'un tiers ou de perturber le service. Toute violation entraîne la suspension immédiate.",
    },
    {
      title: "Disponibilité",
      body: "Ntsagui digital s'engage à un taux de disponibilité de 99,5 % hors maintenance programmée. Les interruptions sont annoncées sur identite.ga/status.",
    },
    {
      title: "Responsabilité",
      body: "Ntsagui digital n'est pas responsable des contenus, services ou actions des administrations tierces accessibles via IDN. La responsabilité de Ntsagui digital est limitée aux dommages directs résultant d'une faute prouvée.",
    },
    {
      title: "Évolution",
      body: "Ces conditions peuvent être modifiées. Les utilisateurs sont notifiés 30 jours avant entrée en vigueur. La poursuite d'utilisation vaut acceptation des nouvelles conditions.",
    },
    {
      title: "Droit applicable",
      body: "Les présentes conditions sont régies par le droit gabonais. Tout litige relève des tribunaux compétents de Libreville.",
    },
  ],
} as const;

export const mentions = {
  meta: {
    title: "Mentions légales",
    description:
      "Éditeur, hébergeur, directeur de publication et coordonnées de la plateforme Identité Numérique du Gabon.",
  },
  hero: {
    eyebrow: "MENTIONS LÉGALES",
    title: "Éditeur et hébergeur.",
    sub: "Conformément à la loi 001/2011 et aux usages internationaux",
  },
  sections: [
    {
      title: "Éditeur",
      body: "Ntsagui digital. Siège : 248 boulevard du Bord de Mer, BP 12 345, Libreville, République Gabonaise.",
    },
    {
      title: "Directeur de la publication",
      body: "Le Directeur Général de Ntsagui digital.",
    },
    {
      title: "Contact",
      body: "Téléphone : 1407 (gratuit depuis le Gabon) / +241 11 40 70 00 (international). Email : support@identite.ga. Confidentialité : privacy@identite.ga. Sécurité : security@identite.ga.",
    },
    {
      title: "Hébergement",
      body: "Hébergement national assuré par le Datacenter de Ntsagui digital, Libreville, République Gabonaise.",
    },
    {
      title: "Propriété intellectuelle",
      body: "Le code source des composants critiques d'IDN est publié sous licence libre (cf. /legal/licenses). Les marques, logos et identité visuelle sont la propriété de la République Gabonaise.",
    },
    {
      title: "Responsable de traitement",
      body: "Ntsagui digital. Délégué à la protection des données : privacy@identite.ga.",
    },
  ],
} as const;

export const accessibility = {
  meta: {
    title: "Accessibilité",
    description:
      "Déclaration de conformité au référentiel RGAA 4.1.2 pour la plateforme Identité Numérique du Gabon.",
  },
  hero: {
    eyebrow: "ACCESSIBILITÉ",
    title: "Engagement d'accessibilité numérique.",
    sub: "Conformité partielle au référentiel RGAA 4.1.2 · audit du 22 mai 2026",
  },
  sections: [
    {
      title: "Engagement",
      body: "Ntsagui digital s'engage à rendre la plateforme Identité Numérique accessible à toutes et tous, conformément aux articles 47 de la loi gabonaise sur le handicap et au référentiel français RGAA 4.1.2 (WCAG 2.1 niveau AA), adopté comme référence.",
    },
    {
      title: "État de conformité",
      body: "La plateforme IDN est en conformité partielle avec le RGAA 4.1.2. Un audit complet a été conduit le 22 mai 2026. Taux de conformité moyen : 87 %.",
    },
    {
      title: "Technologies utilisées",
      body: "HTML5, CSS3, JavaScript (React), ARIA. Compatible avec les lecteurs d'écran VoiceOver (iOS), TalkBack (Android), NVDA et JAWS (Windows).",
    },
    {
      title: "Tests et navigateurs",
      body: "Testée sur Safari 17+, Chrome 120+, Firefox 120+, Edge 120+. Sur iOS 16+ et Android 9+. Avec VoiceOver, TalkBack et clavier seul.",
    },
    {
      title: "Limitations connues",
      body: "Certaines pages dynamiques (tableau de bord, scanner QR) ne sont pas encore 100 % conformes. Le module iCV studio est partiellement accessible. Ces points seront corrigés d'ici fin 2026.",
    },
    {
      title: "Signaler un problème",
      body: "Vous rencontrez un obstacle ? Écrivez à accessibilite@identite.ga ou appelez le 1407. Réponse sous 5 jours ouvrés.",
    },
    {
      title: "Recours",
      body: "Si une réponse satisfaisante n'est pas apportée, vous pouvez saisir le Défenseur des Droits ou la CNPDCP.",
    },
  ],
} as const;

export const deleteAccount = {
  meta: {
    title: "Supprimer mon compte",
    description:
      "Comment supprimer définitivement votre compte Identité Numérique et toutes vos données personnelles.",
  },
  hero: {
    eyebrow: "SUPPRESSION DE COMPTE",
    title: "Supprimer votre compte IDN.",
    sub: "Vous pouvez supprimer votre compte et toutes vos données à tout moment, gratuitement.",
  },
  inAppTitle: "Depuis l'application mobile",
  inAppSteps: [
    "Ouvrez l'application Identité Numérique sur votre téléphone.",
    "Allez dans Profil → Confidentialité → Supprimer mon compte.",
    "Confirmez en saisissant votre adresse email.",
    "Un délai de 30 jours vous est accordé pour annuler (reconnectez-vous pendant cette période).",
    "Au-delà de 30 jours, vos données sont anonymisées de manière irréversible.",
  ] as const,
  byEmailTitle: "Si vous n'avez plus accès à l'application",
  byEmailBody:
    "Envoyez un email à privacy@identite.ga avec pour objet « Demande de suppression de compte » et en pièce jointe une copie de votre pièce d'identité. Nous traiterons votre demande sous 7 jours ouvrés.",
  whatIsDeletedTitle: "Ce qui est supprimé",
  whatIsDeleted: [
    "Vos informations personnelles (nom, email, téléphone, adresse).",
    "Vos pièces d'identité scannées et vérifications KYC.",
    "Votre courrier iBoîte et vos pièces jointes.",
    "Vos cartes iCarte et vos CV iCV.",
    "Vos documents archivés dans iDocument.",
    "Vos passkeys et sessions actives.",
  ] as const,
  whatIsKeptTitle: "Ce qui est conservé (obligation légale)",
  whatIsKeptBody:
    "Conformément à la loi 001/2011 et à la réglementation gabonaise, les logs d'audit (horodatage des connexions et opérations) sont conservés de manière anonymisée pendant 5 ans, sans lien possible avec votre identité personnelle.",
  contactTitle: "Une question ?",
  contactBody:
    "Pour toute question sur la suppression de compte ou l'exercice de vos droits RGPD, contactez privacy@identite.ga ou appelez le 1407.",
} as const;

export const licenses = {
  meta: {
    title: "Licences open source",
    description:
      "Composants logiciels tiers utilisés par la plateforme Identité Numérique du Gabon et leurs licences respectives.",
  },
  hero: {
    eyebrow: "LICENCES OPEN SOURCE",
    title: "Composants tiers utilisés.",
    sub: "IDN s'appuie sur l'écosystème open source. Nous remercions les communautés.",
  },
  intro:
    "La plateforme Identité Numérique utilise des composants logiciels open source publiés sous licences permissives (MIT, Apache 2.0, BSD, ISC) compatibles avec un usage en service public. La liste complète et exhaustive est disponible sur demande à legal@identite.ga.",
  groups: [
    {
      title: "Framework & runtime",
      items: [
        { name: "React", license: "MIT", url: "https://reactjs.org" },
        { name: "React Native", license: "MIT", url: "https://reactnative.dev" },
        { name: "Expo", license: "MIT", url: "https://expo.dev" },
        { name: "Next.js", license: "MIT", url: "https://nextjs.org" },
        { name: "Node.js", license: "MIT", url: "https://nodejs.org" },
      ],
    },
    {
      title: "Sécurité & authentification",
      items: [
        { name: "Better Auth", license: "MIT", url: "https://better-auth.com" },
        { name: "@noble/ciphers", license: "MIT", url: "https://github.com/paulmillr/noble-ciphers" },
        { name: "@noble/hashes", license: "MIT", url: "https://github.com/paulmillr/noble-hashes" },
      ],
    },
    {
      title: "UI & design",
      items: [
        { name: "shadcn/ui", license: "MIT", url: "https://ui.shadcn.com" },
        { name: "Tailwind CSS", license: "MIT", url: "https://tailwindcss.com" },
        { name: "Lucide Icons", license: "ISC", url: "https://lucide.dev" },
        { name: "Radix UI", license: "MIT", url: "https://radix-ui.com" },
      ],
    },
    {
      title: "Infrastructure",
      items: [
        { name: "Convex", license: "Apache 2.0", url: "https://convex.dev" },
        { name: "Turborepo", license: "MPL 2.0", url: "https://turbo.build" },
      ],
    },
  ],
} as const;

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
} as const;

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
      description: "support@identite.ga\nRéponse sous 48h ouvrées",
      cta: "Écrire",
      href: "mailto:support@identite.ga",
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
} as const;

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
} as const;
