/**
 * Strings française du portail développeur.
 *
 * SOURCE — ressources/interfaces/project/idn-desktop.jsx (lignes 2465+, section
 * "Developer portal"). Toutes les chaînes sont copiées **verbatim** depuis les
 * maquettes haute fidélité.
 */

export const fr = {
  brand: {
    name: "Identité Numérique",
    republic: "RÉPUBLIQUE GABONAISE",
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

  verifyEmail: {
    title: "Vérifiez votre email",
    subPrefix: "Saisissez le code à 6 chiffres envoyé à ",
    expiresIn: "Le code expire dans 15 minutes.",
    primary: "Vérifier",
    resend: "Renvoyer le code",
    resendCooldown: (s: number) => `Renvoyer dans ${s}s`,
    resentToast: "Code renvoyé.",
    successToast: "Email vérifié.",
    errorInvalid: "Code invalide. Vérifiez votre email puis réessayez.",
    errorTooManyAttempts: "Trop de tentatives. Réessayez dans quelques minutes.",
    errorMissingEmail:
      "Impossible de retrouver l'email à vérifier. Recommencez l'inscription.",
    changeEmail: "Changer d'email",
  },

  nav: {
    applications: "Mes applications",
    keys: "Clés & secrets",
    apiKeys: "Clés API",
    docs: "Documentation",
    usage: "Quotas & usage",
    settings: "Paramètres",
    services: "Services",
    signOut: "Se déconnecter",
  },

  applications: {
    sub: "VOS APPS · {count} ENREGISTRÉES",
    title: "Applications",
    newApp: "Nouvelle app",
    services: "Services",
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
    sandboxNote:
      "Toute nouvelle application est créée en sandbox. Le passage en production se demande depuis la fiche de l'app, après ajout de redirect URIs en HTTPS.",
    redirectLabel: "Redirect URIs",
    redirectPlaceholder: "https://yourapp.com/auth/callback",
    redirectHint: "Une URI par ligne. HTTPS sera requis au moment de passer en production.",
    scopesLabel: "Scopes demandés",
    loaLabel: "Niveau de garantie minimum",
    submit: "Créer l'application",
    submitting: "Création…",
    cancel: "Annuler",
    errorGeneric: "Création impossible. Vérifiez les champs.",
  },

  appCreated: {
    sub: "APPLICATION CRÉÉE",
    title: "Vos credentials sandbox",
    warning:
      "Notez votre client_secret maintenant : il ne sera plus jamais affiché en clair. Vous pourrez le régénérer si nécessaire. Ces clés (préfixes idn_sk_test_ / _sbx_) ne fonctionnent qu'en mode test.",
    continue: "Voir mon application",
  },

  apiKeys: {
    sub: "MACHINE-TO-MACHINE",
    title: "Clés API",
    description:
      "Créez des clés pour authentifier vos appels serveur-à-serveur (annuaire citoyen, identité déléguée). Ces clés sont indépendantes de vos credentials OAuth.",
    empty: {
      title: "Aucune clé API",
      body: "Créez votre première clé pour accéder aux APIs partenaires (résolution citoyen, identité déléguée).",
    },
    newKeyBtn: "Nouvelle clé",
    form: {
      nameLabel: "Nom de la clé",
      namePlaceholder: "Ex. : Gabon Connect – production",
      scopesLabel: "Scopes",
      expiresLabel: "Expire dans (jours)",
      expiresPlaceholder: "Ex. : 90 (vide = jamais)",
      submit: "Créer la clé",
      submitting: "Création…",
      cancel: "Annuler",
    },
    created: {
      title: "Clé créée — affichée une seule fois",
      warning:
        "Copiez ce token maintenant. Il ne sera plus jamais affiché en clair.",
    },
    table: {
      name: "NOM",
      prefix: "PRÉFIXE",
      scopes: "SCOPES",
      created: "CRÉÉE LE",
      expires: "EXPIRE",
      lastUsed: "DERNIÈRE UTILISATION",
      status: "STATUT",
      actions: "",
    },
    status: {
      active: "Active",
      expired: "Expirée",
      revoked: "Révoquée",
    },
    revokeBtn: "Révoquer",
    revokeConfirm: "Révoquer cette clé ? L'opération est irréversible.",
    revokedToast: "Clé révoquée.",
    never: "Jamais",
    errorGeneric: "Action impossible. Réessayez.",
    scopeDescriptions: {
      "citizens:resolve": "Résolution citoyen (annuaire partenaire)",
      "idn:delegate:lookup": "Identité déléguée — recherche",
      "idn:delegate:create": "Identité déléguée — création",
      "idn:delegate:status": "Identité déléguée — suivi",
    },
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
    redirectUrisEditor: {
      title: "Redirect URIs",
      desc: "URLs de retour autorisées après authentification. Sandbox et production ont chacune leurs propres URIs.",
      descProd: "URLs de retour autorisées. En production, HTTPS est obligatoire.",
      addBtn: "Ajouter une URI",
      save: "Enregistrer",
      saving: "Enregistrement…",
      placeholder: "https://exemple.ga/api/auth/callback/idn",
      removeAria: "Retirer cette URI",
      saved: "Redirect URIs mises à jour.",
      atLeastOne: "Au moins une redirect URI est requise.",
    },
  },

  sandbox: {
    testUsersTitle: "Comptes de test",
    testUsersDesc:
      "Seules ces adresses IDN pourront se connecter à votre application tant qu'elle est en sandbox.",
    testUsersEmpty:
      "Aucun compte de test pour l'instant. Ajoutez les emails IDN autorisés.",
    addEmailPlaceholder: "ex. testeur@idn.ga",
    addBtn: "Ajouter",
    removeAriaTemplate: "Retirer {email}",
    productionRequest: {
      title: "Passer en production",
      none: "Quand votre application est prête, demandez l'approbation pour la production. Une jumelle prod sera créée avec des credentials distincts.",
      requestBtn: "Demander la production",
      requestSubmitting: "Demande en cours…",
      confirm:
        "Une application jumelle « production » sera créée avec des credentials distincts. La sandbox restera active pour vos tests. Continuer ?",
      pendingTitle: "Demande en cours de revue",
      pendingDesc:
        "Notre équipe vérifie la conformité (mentions légales, RGPD, scopes, redirect URIs). Délai indicatif : 48–72h ouvrées.",
      approvedTitle: "Production approuvée",
      approvedDesc: "Votre application jumelle est active. Identifiant production : ",
      rejectedTitle: "Demande refusée",
      rejectedDesc:
        "Votre demande de production a été refusée. Vous pouvez ajuster votre app et la soumettre à nouveau.",
      newCredentialsTitle: "Credentials production — affichés une seule fois",
      newCredentialsWarning:
        "Notez le client_secret prod immédiatement. Il ne sera plus affiché en clair. Préfixes : idn_sk_live_ / _prd_.",
    },
    errors: {
      invalidEmail: "Adresse email invalide.",
      tooManyTestUsers: "Maximum 25 comptes de test par application.",
      notVerified:
        "Votre compte développeur doit être validé par un super-administrateur avant de publier en production.",
      httpsRequired: "Toutes les redirect URIs doivent être en HTTPS pour la production.",
      alreadyRequested: "Une demande de production existe déjà pour cette application.",
      generic: "Action impossible. Réessayez.",
    },
  },

  services: {
    sub: "CATALOGUE CITOYEN",
    title: "Services proposés",
    description:
      "Les services listés ici apparaissent dans l'app mobile des citoyens ayant consenti à votre application. Chaque entrée est un point de redirection vers une page de votre service.",
    emptyTitle: "Aucun service publié",
    emptyDesc:
      "Ajoutez les démarches que votre application propose pour les rendre visibles dans le catalogue citoyen.",
    addService: "Ajouter un service",
    serviceId: "Identifiant",
    serviceIdHint: "Identifiant interne unique (a-z, 0-9, _, -).",
    label: "Libellé",
    labelPlaceholder: "Déclaration fiscale 2025",
    descriptionLabel: "Description",
    descriptionPlaceholder: "Déposez votre déclaration en ligne en 5 minutes.",
    category: "Catégorie",
    link: "Lien d'accès",
    linkHint: "URL absolue (HTTPS recommandé en production).",
    remove: "Retirer",
    save: "Enregistrer",
    saving: "Enregistrement…",
    savedToast: "Services mis à jour.",
    errorGeneric: "Impossible de mettre à jour les services. Réessayez.",
    categories: {
      administrative: "Administratif",
      civilStatus: "État civil",
      fiscal: "Fiscalité",
      education: "Éducation",
      health: "Santé",
      transport: "Transport",
      social: "Social",
      other: "Autres",
    },
  },

  docs: {
    sub: "RÉFÉRENCE · v1.2",
    title: "Documentation",
    sections: {
      gettingStarted: "Démarrage",
      betterAuth: "@idn-ga/better-auth",
      core: "@idn-ga/core",
      react: "@idn-ga/react",
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
      requests: { label: "REQUÊTES / MOIS", hint: "quota standard" },
      latency:  { label: "LATENCE P95",     hint: "seuil SLA : 300ms" },
      errors:   { label: "ERREURS 4XX",     hint: "invalid_grant principalement" },
    },
    chart: {
      title: "Requêtes — derniers 17 jours",
    },
    empty: {
      title: "Pas encore de trafic",
      body: "Les métriques s'afficheront ici dès que vos applications recevront leurs premières requêtes.",
    },
  },

  settings: {
    sub: "COMPTE · PRÉFÉRENCES",
    title: "Paramètres",
    tabs: {
      account: "Compte",
      preferences: "Préférences",
    },
    account: {
      title: "Informations du compte",
      sub: "Identité affichée dans le portail développeur et utilisée pour l'audit.",
      nameLabel: "Nom",
      emailLabel: "Email",
      emailHelper:
        "Adresse utilisée pour la connexion et les notifications. Pour la modifier, contactez le support.",
      roleLabel: "Rôle",
      roleValue: "Développeur",
      verifiedYes: "Email vérifié",
      verifiedNo: "Email non vérifié",
    },
    password: {
      title: "Mot de passe",
      sub: "Modifiez régulièrement votre mot de passe. Minimum 12 caractères.",
      cta: "Modifier",
      modalTitle: "Modifier le mot de passe",
      currentLabel: "Mot de passe actuel",
      newLabel: "Nouveau mot de passe",
      newHint: "Minimum 12 caractères. Mélangez lettres, chiffres et symboles.",
      submit: "Modifier",
      cancel: "Annuler",
      successToast: "Mot de passe modifié.",
      errorTooShort: "Le nouveau mot de passe doit contenir au moins 12 caractères.",
      errorSame: "Le nouveau mot de passe doit être différent de l'ancien.",
    },
    preferences: {
      title: "Préférences",
      sub: "Langue d'interface et thème.",
      language: {
        label: "Langue",
        description: "Langue d'interface et communications.",
        options: [
          { value: "fr", label: "Français" },
          { value: "en", label: "English" },
        ],
      },
      theme: {
        label: "Thème",
        description: "Apparence claire, sombre ou automatique.",
        options: [
          { value: "light", label: "Clair" },
          { value: "dark", label: "Sombre" },
          { value: "auto", label: "Automatique" },
        ],
      },
      saveSuccessToast: "Préférences enregistrées.",
    },
  },
} as const
