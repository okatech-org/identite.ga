/**
 * Strings française de la console super-admin.
 *
 * SOURCE — ressources/interfaces/project/idn-desktop.jsx (lignes 518-1822).
 * Toutes les chaînes sont copiées **verbatim** depuis les maquettes haute
 * fidélité. NE PAS modifier sans validation produit.
 */

export const fr = {
  brand: {
    name: "Identité Numérique",
    operator: "Admin · Système",
    role: "ESPACE ADMIN",
    badge: "O",
    connecte: "connecté",
  },
  settings: {
    sub: "PARAMÈTRES",
    title: "Paramètres du compte",
    menu: "Paramètres",
    signOut: "Se déconnecter",
    tabs: {
      account: "Compte",
      preferences: "Préférences",
    },
    account: {
      title: "Identité",
      sub: "Informations administratives du compte.",
      nameLabel: "Nom complet",
      emailLabel: "Adresse email",
      emailHelper: "Utilisée pour la connexion et les notifications.",
      roleLabel: "Rôle",
      roleValue: "Administrateur Système",
    },
    password: {
      title: "Mot de passe",
      sub: "Choisissez un mot de passe fort, propre à votre compte administrateur.",
      newHint: "Au moins 12 caractères. Différent de l'ancien.",
      cta: "Changer",
      modalTitle: "Changer de mot de passe",
      currentLabel: "Mot de passe actuel",
      newLabel: "Nouveau mot de passe",
      submit: "Mettre à jour",
      cancel: "Annuler",
      successToast: "Mot de passe mis à jour.",
      errorTooShort: "Au moins 12 caractères requis.",
      errorSame: "Le nouveau mot de passe doit être différent de l'ancien.",
    },
    preferences: {
      title: "Préférences",
      sub: "Langue de l'interface et thème.",
      saveSuccessToast: "Préférence enregistrée.",
      language: {
        label: "Langue",
        description: "Langue affichée dans la console.",
        options: [
          { value: "fr", label: "Français" },
          { value: "en", label: "English" },
        ],
      },
      theme: {
        label: "Thème",
        description: "Clair, sombre, ou suivant les préférences système.",
        options: [
          { value: "light", label: "Clair" },
          { value: "dark", label: "Sombre" },
          { value: "auto", label: "Système" },
        ],
      },
    },
  },

  signIn: {
    title: "Console administrateur",
    subtitle: "Réservé aux opérateurs IDN.",
    emailLabel: "Email",
    passwordLabel: "Mot de passe",
    forgotPassword: "Mot de passe oublié ?",
    submit: "Se connecter",
    submitting: "Connexion…",
    errorTitle: "Connexion impossible",
    errorInvalid: "Email ou mot de passe incorrect.",
    errorForbidden:
      "Ce compte n'a pas le rôle administrateur requis pour accéder à la console.",
    errorGeneric:
      "Impossible de vous connecter pour le moment. Réessayez dans un instant.",
  },

  nav: {
    dashboard: "Tableau de bord",
    apps: "Applications OAuth",
    users: "Comptes IDN",
    logs: "Logs & audit",
    roles: "Rôles & habilitations",
    providers: "Providers email/SMS",
    signOut: "Se déconnecter",
  },

  dashboard: {
    sub: "VUE D'ENSEMBLE · 7 derniers jours",
    title: "Tableau de bord",
    exportCsv: "Exporter CSV",
    stats: {
      accounts: { label: "COMPTES IDN", value: "142 318", delta: "+1.4%", hint: "vs sem. dernière" },
      logins:   { label: "CONNEXIONS / 24H", value: "38 942", delta: "+8.2%", hint: "pic à 14h32" },
      apps:     { label: "APPS ACTIVES", value: "23", hint: "2 en attente de revue" },
      otpFail:  { label: "ÉCHECS OTP", value: "2.3%", hint: "seuil alerte : 5%" },
    },
    chart: {
      title: "Connexions par jour",
      subtitle: "15 jours glissants",
      legendSuccess: "Réussies",
      axisLeft: "26 AVR",
      axisMid: "03 MAI",
      axisRight: "10 MAI",
    },
    pie: {
      title: "Répartition par niveau",
      subtitle: "Comptes actifs",
    },
    activity: {
      title: "Activité récente",
    },
  },

  apps: {
    sub: "OAUTH · 23 APPLICATIONS",
    title: "Applications",
    search: "Rechercher…",
    newApp: "Nouvelle app",
    cols: {
      name: "NOM",
      clientId: "CLIENT_ID",
      loaMin: "NIVEAU MIN.",
      scopes: "SCOPES",
      status: "STATUT",
    },
  },

  appDetail: {
    titleHead: "Détail de l'application",
    deactivate: "Désactiver",
    approveProd: "Approuver pour production",
    oauthConfig: "Configuration OAuth",
    dailyConnections: "Connexions par jour",
    eventHistory: "Historique d'événements",
    cred: {
      clientId: "CLIENT_ID",
      redirectUris: "REDIRECT URIS",
      scopes: "SCOPES",
      loaMin: "NIVEAU MIN.",
      consent: "CONSENT",
    },
  },

  users: {
    sub: "COMPTES · 142 318 ACTIFS",
    title: "Utilisateurs",
    search: "Email, ID IDN, nom…",
    cols: {
      name: "NOM",
      email: "EMAIL",
      loa: "NIVEAU",
      profile: "PROFIL",
      joined: "INSCRIT",
    },
  },

  logs: {
    sub: "AUDIT · TEMPS RÉEL",
    title: "Logs",
    filters: "Filtres",
    export: "Exporter",
  },

  roles: {
    sub: "HABILITATIONS · 56 AGENTS",
    title: "Rôles & habilitations",
    newRole: "Nouveau rôle",
    agents: "agents",
  },

  providers: {
    sub: "COMMUNICATION · MULTI-PROVIDER",
    title: "Providers email & SMS",
    emailSectionTitle: "Email — un provider actif",
    smsSectionTitle: "SMS — Phase 2 (non actif)",
    badgeActive: "ACTIF",
    activate: "Activer",
  },
} as const
