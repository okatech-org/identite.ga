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
    delegation: {
      title: "Délégation d'identité",
      description:
        "Autoriser cette application à créer des identités numériques pour le compte de citoyens.",
      enabled: "Activée",
      disabled: "Désactivée",
      maxLoa: "Niveau max. assignable",
      loa1: "Niveau 1 — Pivot seul",
      loa2: "Niveau 2 — Pièce d'identité vérifiée",
      enable: "Activer la délégation",
      disable: "Désactiver la délégation",
      historyTitle: "Identités créées",
      emptyHistory: "Aucune identité créée par cette application.",
      cols: {
        idnId: "IDN ID",
        name: "NOM",
        loa: "NIVEAU",
        status: "STATUT",
        date: "DATE",
      },
      statusCreated: "En attente",
      statusClaimed: "Réclamée",
    },
  },

  users: {
    sub: "COMPTES · 142 318 ACTIFS",
    title: "Utilisateurs",
    search: "Email, ID IDN, NIP, nom…",
    searchLabel: "Rechercher un compte",
    clearSearch: "Effacer la recherche",
    loading: "Chargement…",
    tabsLabel: "Vue des comptes",
    tabList: "Tous les comptes",
    listTruncated:
      "Liste partielle : le registre dépasse la capacité de balayage. Utilisez la recherche pour atteindre un compte précis.",
    resultCount: (n: number) =>
      n === 0 ? "Aucun résultat" : n === 1 ? "1 résultat" : `${n} résultats`,
    searchTruncated:
      "Recherche partielle : seuls les premiers comptes ont été balayés. Affinez avec un email ou un ID IDN.",
    cols: {
      name: "NOM",
      email: "EMAIL",
      loa: "NIVEAU",
      profile: "PROFIL",
      joined: "INSCRIT",
    },
    actions: {
      anonymize: "Anonymiser",
      delete: "Supprimer",
      anonymizeTitle: "Anonymiser ce compte",
      anonymizeBody:
        "Les données personnelles (identité pivot, KYC, iBoîte, iDoc, iCV, iCarte) sont effacées et les sessions révoquées. Le compte Better Auth survit : le handle @idn.ga reste réservé et ne pourra pas être réattribué.",
      deleteTitle: "Supprimer définitivement ce compte",
      deleteBody:
        "Le compte Better Auth est supprimé en plus des données personnelles. Le handle @idn.ga redevient disponible et pourra être réattribué à quelqu'un d'autre. Cette action est irréversible.",
      auditNote:
        "Les journaux d'audit sont conservés dans les deux cas — 5 ans, loi 001/2011.",
      confirmLabel: (id: string) => `Saisissez « ${id} » pour confirmer`,
      reasonLabel: "Motif (facultatif, journalisé)",
      cancel: "Annuler",
      anonymized: "Compte anonymisé.",
      deleted: "Compte supprimé définitivement.",
    },
  },

  pagination: {
    label: "Pagination",
    previous: "Précédent",
    next: "Suivant",
    goToPage: (n: number) => `Aller à la page ${n}`,
    summary: (page: number, pageCount: number, total: number) =>
      `Page ${page} sur ${pageCount} · ${total.toLocaleString("fr-FR")} compte${total > 1 ? "s" : ""}`,
    totalOnly: (total: number) =>
      `${total.toLocaleString("fr-FR")} compte${total > 1 ? "s" : ""}`,
  },

  duplicates: {
    sub: "DOUBLONS · NOM + PRÉNOM + DATE DE NAISSANCE",
    title: "Comptes en double",
    navLabel: "Doublons",
    emptyTitle: "Aucun doublon détecté",
    emptyBody:
      "Aucun compte ne partage nom, prénom et date de naissance avec un autre. Les comptes sans identité pivot renseignée ne sont pas comparables et n'apparaissent pas ici.",
    groupCount: (n: number) => (n === 1 ? "1 compte" : `${n} comptes`),
    bornOn: "né(e) le",
    oldest: "Plus ancien",
    bestLoa: "Mieux vérifié",
    kycYes: "KYC",
    truncated:
      "Rapport partiel : le balayage a atteint sa limite, des doublons peuvent manquer.",
    cols: {
      account: "COMPTE",
      loa: "NIVEAU",
      created: "CRÉÉ LE",
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
