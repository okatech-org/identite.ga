import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

/**
 * Schéma applicatif IDN (Identité Numérique du Gabon).
 *
 * Les tables Better Auth (user / account / session / oauthApplication /
 * oauthConsent / oauthAccessToken / verification / twoFactor / jwks)
 * vivent dans le composant @convex-dev/better-auth, isolées de notre
 * data model. On ne les redéfinit PAS ici — on s'y connecte via le
 * helper `authComponent.getAuthUser(ctx)` (cf. convex/auth.ts).
 *
 * Ici on définit uniquement les tables métier IDN qui complètent le
 * profil Better Auth — référencées par `userId` (ID Better Auth) en
 * v.string() (les IDs ne traversent pas la frontière composant).
 */

// Énumérations partagées (cf. cahier §5.6, §6.7)
export const PROFILE_TYPES = [
  "citizen",
  "resident",
  "visitor",
  "developer",
] as const

export const KYC_DOCUMENT_TYPES = [
  "cni_gabon",
  "birth_certificate",
  "residence_card",
  "passport",
  "visa",
] as const

export const KYC_STATUSES = [
  "pending",
  "submitted",
  "under_review",
  // Le contrôleur a demandé un complément ; le citoyen voit la demande
  // sur sa page `/kyc/request` et peut ré-uploader pour repasser en
  // `under_review`. Cf. controller.queue.requestComplement +
  // kyc.respondComplement.
  "complement_required",
  "approved",
  "rejected",
  "expired",
] as const

export const USER_DOCUMENT_TYPES = [
  "profilePhoto",
  "kycDocFront",
  "kycDocBack",
  "selfie",
  "attestation",
] as const

export const NOTIFICATION_CHANNELS = ["email", "in_app"] as const
export const NOTIFICATION_CATEGORIES = [
  "security",
  "kyc",
  "consent",
  "comms",
  "documents",
  "ai",
  "cv",
  "system",
] as const

// Catalogue des cartes du portefeuille citoyen (iCarte).
export const WALLET_CARD_TYPES = [
  "cni",
  "driving",
  "transport",
  "health",
  "bank",
  "business",
  "consular",
  "voter",
  "loyalty",
  "custom",
] as const

// Comptes iBoîte (boîte aux lettres souveraine multi-comptes).
export const IBOITE_ACCOUNT_TYPES = [
  "personal",
  "professional",
  "association",
] as const

// Dossiers iDocument (coffre-fort numérique chiffré E2E).
export const VAULT_FOLDERS = [
  "identity",
  "civil_status",
  "residence",
  "education",
  "work",
  "health",
  "vehicle",
  "other",
] as const

export const AUDIT_ACTIONS = [
  // Auth
  "login_success",
  "login_failure",
  "login_lockout",
  // OTP
  "otp_sent",
  "otp_verified",
  "otp_expired",
  // Profil / compte
  "account_created",
  "account_modified",
  "account_disabled",
  "password_changed",
  "email_changed",
  "pin_changed",
  // KYC
  "kyc_submitted",
  "kyc_under_review",
  "kyc_complement_requested",
  "kyc_complement_provided",
  "kyc_approved",
  "kyc_rejected",
  // OAuth / consentement
  "consent_granted",
  "consent_revoked",
  "oauth_app_created",
  "oauth_app_modified",
  "oauth_app_disabled",
  // Sessions
  "session_revoked",
  "session_revoked_global",
  // Admin / RBAC
  "admin_action",
  "role_assigned",
  "role_revoked",
  // Contrôleur
  "identity_check_performed",
  "signature_verified",
  // Présentation d'identité (mobile)
  "presentation_minted",
] as const

export const AUDIT_TARGET_TYPES = [
  "user",
  "app",
  "session",
  "kyc",
  "role",
  "consent",
  "document",
  "system",
] as const

export const ROLES = ["admin", "identity_controller", "developer"] as const

export const CONTACT_CATEGORIES = [
  "citoyen",
  "administration",
  "presse",
  "securite",
] as const

export const CONTACT_STATUSES = ["new", "read", "responded", "spam"] as const

export const LANGUAGES = ["fr", "en"] as const
export const THEMES = ["light", "dark", "auto"] as const
export const FONT_SIZES = ["sm", "md", "lg", "xl"] as const

// iCV — 12 thèmes de présentation (cf. SPECS_FEATURE_ICV.md §9).
export const CV_THEMES = [
  "modern",
  "classic",
  "minimalist",
  "professional",
  "creative",
  "startup",
  "bold",
  "tech",
  "academic",
  "executive",
  "elegant",
  "compact",
] as const

// iCV — origine d'un CV (utile pour distinguer les variants dans l'UI).
export const CV_SOURCES = [
  "onboarding",   // seed initial à la sélection de profil
  "manual",       // créé / dupliqué à la main par le citoyen
  "ai_optimize",  // dérivé via cv.ai.optimizeForJob
  "import",       // créé via cv.import.parseAndApply
] as const

// iCV — features IA disponibles (cf. PLAN_BACKEND_ICV.md §8).
export const CV_AI_FEATURES = [
  "improve_summary",
  "suggest_skills",
  "optimize_job",
  "generate_letter",
  "ats_check",
] as const

// iCV — cycle de vie d'un job IA.
export const CV_AI_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
] as const

export default defineSchema({
  /**
   * Profil étendu IDN — un par user Better Auth.
   * Contient l'identité pivot, le LoA, le type de profil, le PIN hashé.
   */
  userProfile: defineTable({
    userId: v.string(), // ID Better Auth (composant isolé)
    profileType: v.union(...PROFILE_TYPES.map((t) => v.literal(t))),
    loa: v.union(v.literal(1), v.literal(2), v.literal(3)),

    /**
     * Identifiant public stable de l'utilisateur (format `GA-XXXX-XXXX`).
     * Généré au signup (`onboarding.selectProfile`), unique global.
     * Optional pour les users créés avant l'introduction du champ.
     */
    idnId: v.optional(v.string()),

    // Identité pivot (§3.2) — optionnelle au signup, complétée à l'étape pivot
    pivot: v.optional(
      v.object({
        firstName: v.string(),
        lastName: v.string(),
        dateOfBirth: v.string(), // ISO date YYYY-MM-DD
        gender: v.union(
          v.literal("M"),
          v.literal("F"),
          v.literal("O"),
          v.literal("N"),
        ),
        birthPlace: v.string(),
        nationality: v.string(), // ISO 3166-1 alpha-2
      }),
    ),

    photoStorageRef: v.optional(v.id("_storage")),
    pinHash: v.optional(v.string()), // PBKDF2-SHA256, 600k itérations

    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()), // soft delete RGPD
  })
    .index("by_userId", ["userId"])
    .index("by_idnId", ["idnId"])
    .index("by_loa", ["loa"])
    .index("by_profileType", ["profileType"])
    .index("by_deletedAt", ["deletedAt"]),

  /**
   * Demande KYC (L2 / L3).
   * Liée au workflow Convex `kycLevel2` qui orchestre OCR + biométrie + revue.
   */
  kycRequest: defineTable({
    userId: v.string(),
    documentType: v.union(...KYC_DOCUMENT_TYPES.map((t) => v.literal(t))),

    // Stockage Convex pour les images (chiffrement applicatif Phase 2)
    documentImages: v.object({
      front: v.optional(v.id("_storage")),
      back: v.optional(v.id("_storage")),
    }),
    selfieImage: v.optional(v.id("_storage")),

    // Scores d'analyse automatique (0-100)
    score: v.optional(v.number()),
    faceMatchScore: v.optional(v.number()),
    livenessVerdict: v.optional(
      v.union(v.literal("real"), v.literal("spoof"), v.literal("uncertain")),
    ),

    status: v.union(...KYC_STATUSES.map((s) => v.literal(s))),

    // Revue manuelle (contrôleur)
    reviewerId: v.optional(v.string()), // userId du contrôleur
    reviewedAt: v.optional(v.number()),
    rejectionReason: v.optional(v.string()),

    /**
     * Demande de complément en cours (status = "complement_required").
     * Posée par `controller.queue.requestComplement`, vidée par
     * `kyc.respondComplement` au ré-upload citoyen.
     */
    complementRequest: v.optional(
      v.object({
        message: v.string(),
        requestedAt: v.number(),
        requestedBy: v.string(), // userId du contrôleur
      }),
    ),

    submittedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_reviewer", ["reviewerId"])
    .index("by_userId_status", ["userId", "status"]),

  /**
   * Trail des décisions KYC du contrôleur (un par décision).
   * Append-only par convention.
   */
  kycReview: defineTable({
    kycRequestId: v.id("kycRequest"),
    reviewerId: v.string(),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_kycRequest", ["kycRequestId"])
    .index("by_reviewer", ["reviewerId"]),

  /**
   * Journal d'audit — append-only (jamais patch, jamais delete).
   * Signature HMAC-SHA256 Phase 1, RSA Phase 2 (WORM réel).
   */
  auditLog: defineTable({
    actorId: v.optional(v.string()), // null = action système
    action: v.union(...AUDIT_ACTIONS.map((a) => v.literal(a))),
    targetType: v.union(...AUDIT_TARGET_TYPES.map((t) => v.literal(t))),
    targetId: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
    signature: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_actor", ["actorId", "createdAt"])
    .index("by_action", ["action", "createdAt"])
    .index("by_target", ["targetType", "targetId", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  /**
   * Notifications utilisateur (email + in-app).
   * Lien optionnel vers email Resend pour traçabilité delivery/bounce.
   * `deletedAt` permet le bouton « Tout effacer » du centre de notifications
   * sans purger les enregistrements (préserve les liens audit).
   */
  notification: defineTable({
    userId: v.string(),
    channel: v.union(...NOTIFICATION_CHANNELS.map((c) => v.literal(c))),
    category: v.union(...NOTIFICATION_CATEGORIES.map((c) => v.literal(c))),
    title: v.string(),
    body: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),

    readAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    emailMessageId: v.optional(v.string()), // ref @convex-dev/resend message id
    deletedAt: v.optional(v.number()),

    createdAt: v.number(),
  })
    .index("by_userId", ["userId", "createdAt"])
    .index("by_userId_unread", ["userId", "readAt"])
    .index("by_userId_category", ["userId", "category", "createdAt"])
    .index("by_category", ["category", "createdAt"]),

  /**
   * Préférences notifications (matrice canal × catégorie).
   * Les nouvelles catégories (documents/ai/cv/system) sont optionnelles
   * en lecture pour rester rétro-compatible avec les anciens documents ;
   * une valeur absente est traitée comme « activée » côté dispatcher.
   */
  notificationPreference: defineTable({
    userId: v.string(),
    email: v.object({
      security: v.boolean(),
      kyc: v.boolean(),
      consent: v.boolean(),
      comms: v.boolean(),
      documents: v.optional(v.boolean()),
      ai: v.optional(v.boolean()),
      cv: v.optional(v.boolean()),
      system: v.optional(v.boolean()),
    }),
    inApp: v.object({
      security: v.boolean(),
      kyc: v.boolean(),
      consent: v.boolean(),
      comms: v.boolean(),
      documents: v.optional(v.boolean()),
      ai: v.optional(v.boolean()),
      cv: v.optional(v.boolean()),
      system: v.optional(v.boolean()),
    }),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  /**
   * Préférences UI : langue, thème, accessibilité.
   */
  userPreference: defineTable({
    userId: v.string(),
    language: v.union(...LANGUAGES.map((l) => v.literal(l))),
    theme: v.union(...THEMES.map((t) => v.literal(t))),
    accessibility: v.object({
      fontSize: v.union(...FONT_SIZES.map((s) => v.literal(s))),
      reducedMotion: v.boolean(),
      highContrast: v.boolean(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  /**
   * Documents utilisateur — refs vers Convex storage.
   * Profil photo, pièces KYC, attestations PDF signées par IDN.
   */
  userDocument: defineTable({
    userId: v.string(),
    type: v.union(...USER_DOCUMENT_TYPES.map((t) => v.literal(t))),
    storageRef: v.id("_storage"),
    mimeType: v.string(),
    sha256: v.string(),
    expiresAt: v.optional(v.number()),
    metadata: v.optional(v.record(v.string(), v.any())),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId", "createdAt"])
    .index("by_userId_type", ["userId", "type"]),

  /**
   * Habilitations IDN — un utilisateur peut avoir plusieurs rôles
   * (admin, identity_controller, developer). Géré côté app et pas via le
   * plugin admin de Better Auth (qui ajoute des colonnes incompatibles
   * avec l'adapter @convex-dev/better-auth).
   */
  userRole: defineTable({
    userId: v.string(),
    role: v.union(...ROLES.map((r) => v.literal(r))),
    assignedAt: v.number(),
    assignedBy: v.optional(v.string()),
    revokedAt: v.optional(v.number()),
    // Spécifique au rôle `developer` : flag de validation par le super-admin.
    // Tant qu'il vaut `false` ou est absent, le développeur ne peut publier
    // ses apps qu'en sandbox (cf. developer/apps.requestProduction).
    // Pour les autres rôles, le champ est ignoré.
    verified: v.optional(v.boolean()),
    verifiedAt: v.optional(v.number()),
    verifiedBy: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_role", ["role"])
    .index("by_userId_role", ["userId", "role"]),

  /**
   * Clé/valeur pour la configuration système modifiable par le super-admin
   * (providers email/SMS actifs, feature flags, etc.).
   *
   * Une seule entrée par clé. `value` est un objet libre pour pouvoir
   * stocker des structures variées (id de provider, options de config).
   */
  systemConfig: defineTable({
    key: v.string(),
    value: v.record(v.string(), v.any()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_key", ["key"]),

  // ─────────────────────────────────────────────────────────────────────
  // iCarte — Portefeuille numérique de cartes (cf. ressources/SPECS_FEATURES_CITIZEN.md §1).
  // Toutes les cartes sont stockées ici (CNI, permis, transport, CNAMGS, bancaire,
  // visite, électeur, fidélité, consulaire + custom). Le citoyen peut éditer ou
  // supprimer n'importe laquelle (V1 — pas de couche "officielle non-éditable").
  // ─────────────────────────────────────────────────────────────────────
  walletCard: defineTable({
    userId: v.string(),
    type: v.union(...WALLET_CARD_TYPES.map((t) => v.literal(t))),
    name: v.string(),
    subtitle: v.optional(v.string()),
    // Apparence
    gradient: v.string(),
    iconKey: v.string(),
    isOfficialStyle: v.boolean(),
    // Données affichées (recto + verso)
    data: v.record(v.string(), v.string()),
    backData: v.optional(v.record(v.string(), v.string())),
    // Mise en avant dans le profil — max 6 par utilisateur
    featured: v.boolean(),
    position: v.number(), // multiples de 1000 pour insertions sans renumérotation
    // Soft delete
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_featured", ["userId", "featured", "position"])
    .index("by_userId_deletedAt", ["userId", "deletedAt"]),

  // ─────────────────────────────────────────────────────────────────────
  // iBoîte — Boîte aux lettres souveraine multi-comptes
  // (cf. ressources/SPECS_FEATURES_CITIZEN.md §2). Trois sections :
  // Courriers physiques (saisie admin), Colis (saisie admin), eMails internes
  // (IDN ↔ administrations, app-only — pas de SMTP entrant).
  // ─────────────────────────────────────────────────────────────────────
  iboiteAccount: defineTable({
    userId: v.string(),
    type: v.union(...IBOITE_ACCOUNT_TYPES.map((t) => v.literal(t))),
    label: v.string(),
    emailAlias: v.string(), // ex "jean.dupont@idn.ga" — alias interne, pas SMTP
    // Adresse postale virtuelle (point relais idn.ga)
    street: v.string(),
    city: v.string(),
    postalCode: v.string(),
    country: v.string(),
    qrCode: v.string(), // identifiant unique global, ex "IDNGA-12345"
    // Compteurs dénormalisés — maintenus par les mutations métier pour éviter
    // les .collect().length sur les listes (cf. Convex guidelines).
    counters: v.object({
      unreadLetters: v.number(),
      pendingLetters: v.number(),
      availablePackages: v.number(),
      unreadMessages: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_type", ["userId", "type"])
    .index("by_qrCode", ["qrCode"])
    .index("by_emailAlias", ["emailAlias"]),

  iboiteLetter: defineTable({
    accountId: v.id("iboiteAccount"),
    userId: v.string(), // dénormalisé pour ownership rapide
    folder: v.union(
      v.literal("inbox"),
      v.literal("sent"),
      v.literal("pending"), // « À traiter »
      v.literal("trash"),
    ),
    senderName: v.string(),
    senderAddress: v.string(),
    recipientName: v.string(),
    recipientAddress: v.string(),
    subject: v.string(),
    body: v.string(), // texte pré-formaté (whitespace pre-line)
    type: v.union(
      v.literal("action_required"),
      v.literal("informational"),
      v.literal("standard"),
    ),
    stampColor: v.union(
      v.literal("red"),
      v.literal("blue"),
      v.literal("green"),
    ),
    isRead: v.boolean(),
    dueAt: v.optional(v.number()),
    originOperator: v.optional(v.string()), // userId de l'admin qui a déposé
    createdAt: v.number(),
  })
    .index("by_user_folder", ["userId", "folder", "createdAt"])
    .index("by_account_folder", ["accountId", "folder", "createdAt"])
    .index("by_user_unread", ["userId", "folder", "isRead"]),

  iboiteLetterAttachment: defineTable({
    letterId: v.id("iboiteLetter"),
    name: v.string(),
    size: v.number(),
    storageRef: v.id("_storage"),
    mimeType: v.string(),
  }).index("by_letter", ["letterId"]),

  iboitePackage: defineTable({
    accountId: v.id("iboiteAccount"),
    userId: v.string(),
    trackingNumber: v.string(),
    senderName: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("transit"),
      v.literal("available"), // à retirer au point relais
      v.literal("delivered"),
    ),
    estimatedDeliveryAt: v.optional(v.number()),
    pickedUpAt: v.optional(v.number()),
    originOperator: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user_status", ["userId", "status", "createdAt"])
    .index("by_account_status", ["accountId", "status", "createdAt"])
    .index("by_tracking", ["trackingNumber"]),

  iboiteMessage: defineTable({
    accountId: v.id("iboiteAccount"),
    userId: v.string(),
    threadId: v.string(), // UUID au premier message d'un fil
    senderKind: v.union(v.literal("admin"), v.literal("citizen")),
    senderName: v.string(),
    senderEmail: v.string(),
    recipientName: v.string(),
    recipientEmail: v.string(),
    subject: v.string(),
    preview: v.string(),
    body: v.string(),
    folder: v.union(
      v.literal("inbox"),
      v.literal("sent"),
      v.literal("trash"),
    ),
    isRead: v.boolean(),
    isStarred: v.boolean(),
    hasAttachment: v.boolean(),
    inReplyTo: v.optional(v.id("iboiteMessage")),
    createdAt: v.number(),
  })
    .index("by_user_folder", ["userId", "folder", "createdAt"])
    .index("by_account_folder", ["accountId", "folder", "createdAt"])
    .index("by_thread", ["threadId", "createdAt"])
    .index("by_user_starred", ["userId", "isStarred", "createdAt"]),

  // ─────────────────────────────────────────────────────────────────────
  // iDocument — Coffre-fort numérique chiffré E2E
  // (cf. ressources/SPECS_FEATURES_CITIZEN.md §3). Le serveur ne voit jamais
  // le contenu en clair : seuls `folderId`, `fileSize`, `expirationDate`,
  // `status` restent en clair pour permettre filtres et notifs d'expiration.
  // Architecture envelope encryption :
  //   • MVK (Master Vault Key) AES-256-GCM générée côté client à l'activation.
  //   • MVK wrappée par PBKDF2(passe vault) — stockée dans `vaultKey`.
  //   • Optionnel : wrap MVK par PBKDF2(code de récupération BIP-39).
  //   • Chaque item : blob chiffré + DEK aléatoire wrappée par MVK.
  // ─────────────────────────────────────────────────────────────────────
  vaultKey: defineTable({
    userId: v.string(),
    algorithm: v.string(), // ex "AES-256-GCM"
    kdf: v.string(), // ex "PBKDF2-SHA256"
    kdfIterations: v.number(), // 600 000 (cf. cahier §6.1)
    passwordSalt: v.string(), // base64
    wrappedMvk: v.string(), // base64 — MVK wrap par la clé dérivée du mot de passe
    passwordHint: v.optional(v.string()),
    recoverySalt: v.optional(v.string()),
    wrappedMvkRecovery: v.optional(v.string()),
    activatedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  vaultItem: defineTable({
    userId: v.string(),
    folderId: v.union(...VAULT_FOLDERS.map((f) => v.literal(f))),
    // Chiffrement
    contentRef: v.id("_storage"), // blob ciphertext
    encryptedMetadata: v.string(), // base64 — JSON chiffré (name, original_name, métadonnées libres)
    wrappedDek: v.string(), // base64 — DEK wrappée par MVK
    iv: v.string(), // base64 — IV utilisé pour le blob
    metaIv: v.string(), // base64 — IV utilisé pour encryptedMetadata
    // Cleartext utile pour filtres / notifs d'expiration
    fileType: v.union(
      v.literal("pdf"),
      v.literal("image"),
      v.literal("other"),
    ),
    fileSize: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected"),
      v.literal("expired"),
    ),
    expirationDate: v.optional(v.string()), // ISO YYYY-MM-DD
    // Recto/verso (pairing)
    side: v.optional(v.union(v.literal("front"), v.literal("back"))),
    pairedItemId: v.optional(v.id("vaultItem")),
    // Soft delete
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_folder", ["userId", "folderId", "createdAt"])
    .index("by_userId_expiration", ["userId", "expirationDate"])
    .index("by_userId_deletedAt", ["userId", "deletedAt"])
    .index("by_expiration", ["expirationDate"]),

  /**
   * Trace de notification d'expiration vault — utilisée par le cron pour
   * dédupliquer (on ne re-notifie pas deux fois le même item dans la fenêtre
   * « < 30 jours »). Une ligne par (item, palier) ; palier = 30 / 7 / 0.
   */
  vaultExpirationNotice: defineTable({
    userId: v.string(),
    vaultItemId: v.id("vaultItem"),
    tier: v.union(v.literal("30d"), v.literal("7d"), v.literal("expired")),
    notifiedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_item_tier", ["vaultItemId", "tier"]),

  /**
   * Cross-device login (scanner mobile depuis un QR affiché côté web).
   * Le web crée une session pending, affiche un QR avec le `sessionCode`,
   * et poll le status. Le mobile authentifié scanne le QR et approuve.
   * Phase 1 : le serveur ne crée pas encore de session Better Auth pour
   * le web — il signale juste qu'une approbation a eu lieu. Le web
   * pourra ensuite proposer un sign-in léger (PIN) pré-rempli avec
   * l'email retourné. La fabrication d'une session Better Auth complète
   * via ce flow demande un plugin dédié (device-authorization) — laissé
   * pour la V2.
   */
  crossDeviceSession: defineTable({
    sessionCode: v.string(), // identifiant aléatoire encodé dans le QR
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("expired"),
      v.literal("cancelled"),
    ),
    // userId Better Auth — renseigné quand le mobile approuve.
    userId: v.optional(v.string()),
    // Email du citoyen approuvant — utilisé côté web pour pré-remplir
    // le sign-in PIN.
    approvedEmail: v.optional(v.string()),
    // Métadonnées (user agent web pour distinguer la session)
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
    approvedAt: v.optional(v.number()),
  })
    .index("by_sessionCode", ["sessionCode"])
    .index("by_expiresAt", ["expiresAt"]),

  // ─────────────────────────────────────────────────────────────────────
  // iCV — Constructeur de CV professionnel (cf. SPECS_FEATURE_ICV.md +
  // PLAN_BACKEND_ICV.md). Multi-CV : un user peut avoir N CV (max 10),
  // avec un CV principal (isDefault) + des variantes générées via
  // l'outil IA `optimize_job` ou importées.
  //
  // Les sections (experiences, education, skills, languages) sont des
  // tableaux embarqués dans le document — cardinalité bornée par usage
  // humain (≤ ~50 entrées), aucun risque d'atteindre la limite de 1 MB.
  // ─────────────────────────────────────────────────────────────────────
  citizenCv: defineTable({
    userId: v.string(),
    name: v.string(),            // ex « CV principal », « CV - Chef de projet »
    isDefault: v.boolean(),      // un seul `true` par user — appliqué en mutation
    source: v.union(...CV_SOURCES.map((s) => v.literal(s))),
    derivedFromCvId: v.optional(v.id("citizenCv")),

    // Coordonnées (champs racine éditables via cv.profile.upsert)
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    summary: v.string(),
    portfolioUrl: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    activeTheme: v.union(...CV_THEMES.map((t) => v.literal(t))),

    // Sections embarquées
    experiences: v.array(
      v.object({
        id: v.string(),
        position: v.number(), // multiples de 1000
        title: v.string(),
        company: v.string(),
        startDate: v.string(),         // ISO YYYY-MM ou YYYY-MM-DD
        endDate: v.optional(v.string()),
        current: v.boolean(),
        description: v.string(),
      }),
    ),
    education: v.array(
      v.object({
        id: v.string(),
        position: v.number(),
        degree: v.string(),
        school: v.string(),
        year: v.string(),
        description: v.optional(v.string()),
      }),
    ),
    skills: v.array(
      v.object({
        id: v.string(),
        position: v.number(),
        name: v.string(),
        level: v.union(
          v.literal("Débutant"),
          v.literal("Intermédiaire"),
          v.literal("Avancé"),
          v.literal("Expert"),
        ),
      }),
    ),
    languages: v.array(
      v.object({
        id: v.string(),
        position: v.number(),
        name: v.string(),
        level: v.union(
          v.literal("A1"),
          v.literal("A2"),
          v.literal("B1"),
          v.literal("B2"),
          v.literal("C1"),
          v.literal("C2"),
          v.literal("Natif"),
        ),
      }),
    ),
    hobbies: v.array(v.string()),

    // Score de complétion (0..100) — dénormalisé, recalculé à chaque write
    completionScore: v.number(),

    // Soft delete (le multi-CV permet la suppression sans casser les liens
    // `derivedFromCvId` qui peuvent pointer vers ce CV depuis une variante)
    deletedAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_default", ["userId", "isDefault"])
    .index("by_userId_deletedAt", ["userId", "deletedAt"]),

  /**
   * Cache des exports PDF générés pour un CV donné.
   * Permet de réutiliser le blob si le CV n'a pas changé depuis le dernier
   * export avec le même thème (clé = sha256(JSON canonique du CV + theme)).
   */
  citizenCvExport: defineTable({
    userId: v.string(),
    cvId: v.id("citizenCv"),
    theme: v.union(...CV_THEMES.map((t) => v.literal(t))),
    contentHash: v.string(), // hash 64 chars du couple (CV serialisé + theme)
    storageRef: v.id("_storage"),
    expiresAt: v.number(), // TTL 24h
    createdAt: v.number(),
  })
    .index("by_user_cv", ["userId", "cvId", "createdAt"])
    .index("by_hash", ["contentHash"]),

  /**
   * Trace asynchrone des appels IA iCV — pour rate-limit, audit, retry,
   * historique. Une ligne par appel (`cv.ai.improveSummary`, etc.).
   */
  citizenCvAiJob: defineTable({
    userId: v.string(),
    cvId: v.id("citizenCv"),
    feature: v.union(...CV_AI_FEATURES.map((f) => v.literal(f))),
    status: v.union(...CV_AI_STATUSES.map((s) => v.literal(s))),

    // Provider effectivement utilisé (audit + observabilité multi-provider)
    provider: v.optional(v.string()), // "gemini" | "anthropic" | "openai" | "ollama" | "mock"
    model: v.optional(v.string()),    // ex "gemini-2.5-flash"

    // Entrée libre (paramètres feature-specific)
    input: v.optional(v.record(v.string(), v.any())),
    // Résultat structuré
    result: v.optional(v.record(v.string(), v.any())),
    // Pour optimize_job : pointe vers le CV dérivé créé
    derivedCvId: v.optional(v.id("citizenCv")),
    errorMessage: v.optional(v.string()),

    // Métriques
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),

    createdAt: v.number(),
  })
    .index("by_userId", ["userId", "createdAt"])
    .index("by_user_cv", ["userId", "cvId", "createdAt"])
    .index("by_user_cv_feature", ["userId", "cvId", "feature", "createdAt"])
    .index("by_status", ["status", "createdAt"]),

  /**
   * Demandes via formulaire de contact public (page /contact).
   * Pas d'auth requise.
   */
  contactRequest: defineTable({
    category: v.union(...CONTACT_CATEGORIES.map((c) => v.literal(c))),
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    status: v.union(...CONTACT_STATUSES.map((s) => v.literal(s))),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
    respondedBy: v.optional(v.string()),
  })
    .index("by_status", ["status", "createdAt"])
    .index("by_email", ["email"])
    .index("by_createdAt", ["createdAt"]),
})
