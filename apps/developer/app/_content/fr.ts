/**
 * Strings française du portail développeur.
 *
 * SOURCE — ressources/interfaces/project/idn-desktop.jsx (lignes 2465+, section
 * "Developer portal"). Toutes les chaînes sont copiées **verbatim** depuis les
 * maquettes haute fidélité.
 */

export const fr = {
  brand: {
    name: "IDN",
    role: "DÉVELOPPEUR",
    operator: "dev@startup.ga",
    badge: "D",
    connecte: "connecté",
  },

  welcome: {
    eyebrow: "PORTAIL DÉVELOPPEUR",
    title: "Construisez avec Identité Numérique",
    subtitle:
      "Intégrez « Se connecter avec Identité Numérique » dans vos applications en quelques minutes. OAuth 2.1, OIDC standard, PKCE — et un kit SDK officiel pour les stacks les plus courantes.",
    signIn: "Se connecter",
    signUp: "Créer un compte",
    docs: "Découvrir la documentation",
    secondaryHint: "Vous avez déjà un compte ? Connectez-vous.",
  },

  signIn: {
    title: "Portail développeur",
    subtitle: "Accédez à vos applications enregistrées.",
    emailLabel: "Email",
    passwordLabel: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    submit: "Se connecter",
    submitting: "Connexion…",
    noAccount: "Pas encore de compte ?",
    createAccount: "Créer un compte développeur",
    errorInvalid: "Email ou mot de passe incorrect.",
    errorForbidden: "Ce compte n'est pas habilité comme développeur.",
    errorGeneric:
      "Impossible de vous connecter pour le moment. Réessayez dans un instant.",
  },

  signUp: {
    title: "Créer un compte développeur",
    subtitle: "Quelques informations suffisent — vous pourrez enregistrer votre première application aussitôt.",
    nameLabel: "Nom complet",
    emailLabel: "Email professionnel",
    passwordLabel: "Mot de passe",
    submit: "Créer mon compte",
    submitting: "Création en cours…",
    haveAccount: "Vous avez déjà un compte ?",
    signInLink: "Connectez-vous",
    consent: "En créant un compte, vous acceptez les conditions d'utilisation de la plateforme IDN.",
    errorEmailTaken: "Un compte existe déjà avec cet email.",
    errorGeneric: "Impossible de créer le compte. Réessayez dans un instant.",
  },

  nav: {
    applications: "Mes applications",
    keys: "Clés & secrets",
    docs: "Documentation",
    usage: "Quotas & usage",
    signOut: "Se déconnecter",
  },

  applications: {
    sub: "VOS APPS · {count} ENREGISTRÉES",
    title: "Applications",
    newApp: "Nouvelle app",
    empty: {
      title: "Aucune application enregistrée",
      body: "Créez votre première application pour obtenir un client_id et commencer l'intégration.",
      cta: "Créer ma première app",
    },
    card: {
      usage: "USAGE",
      perMonth: "/ mois",
      env: {
        production: "PRODUCTION",
        sandbox: "SANDBOX",
      },
    },
  },

  newApp: {
    sub: "NOUVELLE APPLICATION",
    title: "Enregistrer une application",
    nameLabel: "Nom de l'application",
    namePlaceholder: "Ex. : Bourses Étudiantes",
    descLabel: "Description",
    descPlaceholder: "À quoi sert cette application ?",
    envLabel: "Environnement",
    envSandbox: "Sandbox",
    envProduction: "Production",
    redirectLabel: "Redirect URIs",
    redirectPlaceholder: "https://yourapp.com/auth/callback",
    redirectHint: "Un par ligne. HTTPS obligatoire en production.",
    scopesLabel: "Scopes demandés",
    loaLabel: "Niveau de garantie minimum",
    submit: "Créer l'application",
    submitting: "Création…",
    cancel: "Annuler",
    errorGeneric: "Création impossible. Vérifiez les champs.",
  },

  appCreated: {
    sub: "APPLICATION CRÉÉE",
    title: "Vos credentials",
    warning:
      "Notez votre client_secret maintenant : il ne sera plus jamais affiché en clair. Vous pourrez le régénérer si nécessaire.",
    continue: "Voir mon application",
  },

  keys: {
    subTemplate: "OAUTH · {appName}",
    title: "Clés & secrets",
    regenerate: "Régénérer le secret",
    integrationTitle: "Intégration en 3 lignes (Better Auth)",
    rows: {
      issuer: "ISSUER",
      discovery: "DISCOVERY",
      clientId: "CLIENT_ID",
      clientSecret: "CLIENT_SECRET",
      redirectUris: "REDIRECT URIS",
      jwks: "JWKS",
    },
  },

  docs: {
    sub: "RÉFÉRENCE · v1.2",
    title: "Documentation",
    sections: {
      gettingStarted: "Démarrage",
      betterAuth: "@idn/better-auth",
      core: "@idn/core",
      react: "@idn/react",
      oidc: "OIDC standard",
    },
    items: {
      quickStart: "Quick start",
      integrationPath: "Choisir un chemin d'intégration",
      loa: "Niveaux de garantie (LoA)",
      helperIdn: "Helper idn()",
      profileMapping: "Mapping de profil",
      genericOAuth: "genericOAuth config",
      createClient: "createIDNClient()",
      signInOut: "signIn / signOut",
      handleCallback: "handleCallback",
      providerComponent: "<IDNProvider>",
      useUser: "useUser()",
      useSession: "useSession()",
      discovery: "Discovery",
      authzPkce: "Authorization Code + PKCE",
      jwks: "JWKS & rotation",
    },
    helper: {
      eyebrow: "@IDN/BETTER-AUTH",
      title: "Helper idn()",
      description:
        "S'utilise comme auth0(), keycloak(), okta() dans Better Auth. Auto-configure le discovery, les scopes par défaut, PKCE et le mapping du profil.",
      infoLeading: "Pour exiger un niveau de garantie minimum, ajouter",
    },
  },

  usage: {
    sub: "QUOTAS · MOIS EN COURS",
    title: "Usage",
    stats: {
      requests: { label: "REQUÊTES / MOIS", value: "38 542 / 100k", delta: "+38.5%", hint: "quota standard" },
      latency:  { label: "LATENCE P95",     value: "142ms",         hint: "seuil SLA : 300ms" },
      errors:   { label: "ERREURS 4XX",     value: "0.42%",         hint: "invalid_grant principalement" },
    },
    chart: {
      title: "Requêtes — derniers 17 jours",
    },
  },
} as const
