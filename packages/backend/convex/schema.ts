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

    createdAt: v.number(),
  })
    .index("by_userId", ["userId", "createdAt"])
    .index("by_userId_unread", ["userId", "readAt"])
    .index("by_category", ["category", "createdAt"]),

  /**
   * Préférences notifications (matrice canal × catégorie).
   */
  notificationPreference: defineTable({
    userId: v.string(),
    email: v.object({
      security: v.boolean(),
      kyc: v.boolean(),
      consent: v.boolean(),
      comms: v.boolean(),
    }),
    inApp: v.object({
      security: v.boolean(),
      kyc: v.boolean(),
      consent: v.boolean(),
      comms: v.boolean(),
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
