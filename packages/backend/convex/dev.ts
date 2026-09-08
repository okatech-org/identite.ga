/**
 * Utilitaires DEV.
 *
 * À n'utiliser qu'en environnement de développement / test. Toutes les
 * fonctions exposées ici sont des `internalMutation`/`internalAction`, donc
 * non joignables depuis le client public — elles s'invoquent uniquement via
 * la CLI Convex (`bunx convex run dev:<nom>`) ou depuis du code serveur.
 */

import { v } from "convex/values"

import { components } from "./_generated/api"
import { internalMutation } from "./_generated/server"
// ⚠️ Le wrapper à TRIGGERS — obligatoire dès qu'on écrit dans
// `userProfile`, `kycRequest` ou `level3Verification` : sans lui, les
// agrégats se désynchronisent ET aucun webhook ne part vers les
// applications partenaires. Un seed qui contourne les triggers produit un
// état que la réplique ne verra jamais.
import { internalMutation as triggeredInternalMutation } from "./functions"
import { generateApiToken } from "./lib/secureToken"
import { VALID_M2M_SCOPES } from "./developer/apiKeys"
import { derivePivotKeys } from "./lib/identity"

/**
 * Réinitialise TOUS les rate-limits (toutes les définitions, tous les
 * utilisateurs). Utile quand on a saturé un quota en testant et qu'on veut
 * repartir d'une ardoise vierge.
 *
 * Usage :
 *   bunx convex run dev:clearAllRateLimits
 *
 * NE JAMAIS appeler en production.
 */
export const clearAllRateLimits = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Le composant purge par lots de 100 lignes et se reschedule
    // automatiquement tant qu'il en reste — un seul appel suffit.
    await ctx.runMutation(components.rateLimiter.lib.clearAll, {})
    return null
  },
})

/**
 * Crée une clé API M2M avec tous les scopes, sans session développeur.
 * Le token est affiché UNE SEULE FOIS dans la sortie CLI.
 *
 * Usage :
 *   bunx convex run dev:createM2mApiKey '{"ownerLabel":"gabon-gouv"}'
 *
 * NE JAMAIS appeler en production.
 */
export const createM2mApiKey = internalMutation({
  args: {
    ownerLabel: v.string(),
  },
  returns: v.object({
    token: v.string(),
    tokenPrefix: v.string(),
    id: v.id("developerApiKey"),
    scopes: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const scopes = [...VALID_M2M_SCOPES]
    const { token, tokenHash, tokenPrefix } = await generateApiToken()
    const now = Date.now()
    const id = await ctx.db.insert("developerApiKey", {
      userId: `dev-script:${args.ownerLabel}`,
      name: `M2M – ${args.ownerLabel}`,
      tokenHash,
      tokenPrefix,
      scopes,
      createdAt: now,
    })
    return { token, tokenPrefix, id, scopes }
  },
})

/**
 * Crée la clé d'annuaire minimale utilisée par Gabon Connect.
 *
 * Contrairement à `createM2mApiKey`, cette clé ne peut ni consulter ni créer
 * de délégation : elle porte exclusivement `citizens:resolve`.
 *
 * Usage :
 *   bunx convex run dev:createDirectoryApiKey '{"ownerLabel":"gabon-gouv"}'
 *
 * NE JAMAIS appeler en production : la clé de production doit être émise par
 * un développeur authentifié depuis le portail Identité.ga.
 */
export const createDirectoryApiKey = internalMutation({
  args: {
    ownerLabel: v.string(),
  },
  returns: v.object({
    token: v.string(),
    tokenPrefix: v.string(),
    id: v.id("developerApiKey"),
    scopes: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const scopes = ["citizens:resolve"]
    const { token, tokenHash, tokenPrefix } = await generateApiToken()
    const now = Date.now()
    const id = await ctx.db.insert("developerApiKey", {
      userId: `dev-script:${args.ownerLabel}`,
      name: `Annuaire – ${args.ownerLabel}`,
      tokenHash,
      tokenPrefix,
      scopes,
      createdAt: now,
    })
    return { token, tokenPrefix, id, scopes }
  },
})

/**
 * Crée un dossier de vérification de démonstration, prêt à être instruit.
 *
 * Reproduit l'état exact d'un parcours FUSIONNÉ réel : citoyen au LoA 1,
 * demande de Niveau 3, pièces soumises, créneau réservé dans la fenêtre de
 * jointure. C'est le seul état où toutes les actions de l'agent sont
 * disponibles à la fois — donc le seul qui permette de recetter la chaîne
 * complète depuis administration.ga.
 *
 * Usage :
 *   bunx convex run dev:seedVerificationDemo '{"firstName":"Ariane","lastName":"Nziengui"}'
 *
 * NE JAMAIS appeler en production : fabrique une identité et une piste
 * documentaire sans qu'aucune pièce réelle n'ait été vérifiée.
 */
export const seedVerificationDemo = triggeredInternalMutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    /** Minutes avant le rendez-vous. 0 = la salle est ouverte tout de suite. */
    startsInMinutes: v.optional(v.number()),
  },
  returns: v.object({
    userId: v.string(),
    verificationId: v.id("level3Verification"),
    kycRequestId: v.id("kycRequest"),
    roomName: v.string(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now()
    const userId = `demo_citizen_${now}`

    await ctx.db.insert("userProfile", {
      userId,
      profileType: "citizen",
      loa: 1,
      idnId: `GA-DEMO-${String(now).slice(-4)}`,
      pivot: {
        firstName: args.firstName,
        lastName: args.lastName,
        dateOfBirth: "1990-01-01",
        gender: "F",
        birthPlace: "Libreville",
        nationality: "GA",
      },
      ...derivePivotKeys({
        firstName: args.firstName,
        lastName: args.lastName,
        dateOfBirth: "1990-01-01",
      }),
      createdAt: now,
      updatedAt: now,
    })

    const kycRequestId = await ctx.db.insert("kycRequest", {
      userId,
      documentType: "cni_gabon",
      documentImages: {},
      status: "submitted",
      score: 88,
      faceMatchScore: 91,
      livenessVerdict: "real",
      ocrAvailable: true,
      biometricAvailable: true,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    })

    const scheduledAt = now + (args.startsInMinutes ?? 0) * 60 * 1000
    const verificationId = await ctx.db.insert("level3Verification", {
      userId,
      status: "waiting_controller",
      roomName: "pending",
      kycRequestId,
      entryLoa: 1,
      scheduledAt,
      scheduledEndAt: scheduledAt + 30 * 60 * 1000,
      requestedAt: now,
      updatedAt: now,
    })
    const roomName = `idn-l3-${verificationId}`
    await ctx.db.patch(verificationId, { roomName })

    return { userId, verificationId, kycRequestId, roomName }
  },
})
