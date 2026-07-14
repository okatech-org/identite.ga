import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import type { QueryCtx } from "./_generated/server"
import { getCurrentAuthUser, requireVerifiedAuth } from "./lib/auth"
import {
  DOCUMENT_SIGNING_KEY_ID,
  signDocument,
  verifyDocumentToken,
} from "./lib/documentSigning"
import { USER_DOCUMENT_TYPES } from "./schema"

/**
 * Documents utilisateur (§3.4 — Paramètres / Documents).
 * Liste les pièces fournies par l'utilisateur (photo profil, KYC, attestations).
 */

export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("userDocument"),
      type: v.union(...USER_DOCUMENT_TYPES.map((t) => v.literal(t))),
      mimeType: v.string(),
      sha256: v.string(),
      expiresAt: v.optional(v.number()),
      createdAt: v.number(),
      url: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    // Lecture gracieuse (pas de throw au mount).
    const user = await getCurrentAuthUser(ctx)
    if (!user) return []

    const docs = await ctx.db
      .query("userDocument")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .order("desc")
      .collect()

    return await Promise.all(
      docs.map(async (d) => ({
        _id: d._id,
        type: d.type,
        mimeType: d.mimeType,
        sha256: d.sha256,
        expiresAt: d.expiresAt,
        createdAt: d.createdAt,
        url: await ctx.storage.getUrl(d.storageRef),
      })),
    )
  },
})

/**
 * Signer un document — attestation cryptographique simple (RS256, PAS
 * eIDAS qualifiée). Cf. `lib/documentSigning.ts` pour le format du JWT et
 * le choix d'algorithme.
 *
 * Ownership : réservé au propriétaire du `documentItem` (jamais d'identité
 * passée en argument — dérivée de `ctx.auth` via `requireVerifiedAuth`).
 * Le sha256 signé est celui déjà calculé par Convex Storage à l'upload
 * (`_storage.sha256`, cf. guidelines) — pas de re-téléchargement du blob.
 */
export const sign = mutation({
  args: {
    itemId: v.id("documentItem"),
  },
  returns: v.object({
    signatureId: v.id("documentSignature"),
    signature: v.string(),
    sha256: v.string(),
    signedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)

    const item = await ctx.db.get(args.itemId)
    if (!item || item.userId !== user.userId || item.deletedAt !== undefined) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Document introuvable.",
      })
    }

    const storageMeta = await ctx.db.system.get(item.contentRef)
    if (!storageMeta) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Fichier introuvable dans le stockage.",
      })
    }

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    const signerName = profile?.pivot
      ? `${profile.pivot.firstName} ${profile.pivot.lastName}`
      : user.email
    const signerIdnId = profile?.idnId

    const now = Date.now()
    const signature = await signDocument({
      sub: user.userId,
      name: signerName,
      idnId: signerIdnId,
      hash: storageMeta.sha256,
      documentItemId: item._id,
      documentName: item.name,
      iat: now,
    })

    const signatureId = await ctx.db.insert("documentSignature", {
      userId: user.userId,
      documentItemId: item._id,
      documentName: item.name,
      sha256: storageMeta.sha256,
      algorithm: "RS256",
      keyId: DOCUMENT_SIGNING_KEY_ID,
      signature,
      signerName,
      signerIdnId,
      signedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "document_signed",
      targetType: "document",
      targetId: item._id,
      metadata: { sha256: storageMeta.sha256, documentItemId: item._id },
    })

    return { signatureId, signature, sha256: storageMeta.sha256, signedAt: now }
  },
})

async function currentDocumentHash(
  ctx: QueryCtx,
  documentItemId: Id<"documentItem"> | undefined,
): Promise<string | null> {
  if (!documentItemId) return null
  const item: Doc<"documentItem"> | null = await ctx.db.get(documentItemId)
  if (!item || item.deletedAt !== undefined) return null
  const storageMeta = await ctx.db.system.get(item.contentRef)
  return storageMeta?.sha256 ?? null
}

/**
 * Vérifie une signature de document — query PUBLIQUE (pas d'auth requise :
 * c'est le point d'entrée pour qu'un tiers vérifie une attestation).
 *
 * Ne renvoie AUCUNE PII au-delà du strict nécessaire : nom affiché + idnId
 * du signataire, horodatage, hash du document. Jamais l'email, le NIP, la
 * date de naissance, etc.
 *
 * Deux modes d'appel :
 *   • `id` — id `documentSignature` connu (ex. lien de vérification interne).
 *   • `token` — le JWT brut (ex. scanné depuis un QR / collé par un tiers).
 * Fournir les deux est une erreur ; n'en fournir aucun renvoie `valid: false`.
 *
 * Intégrité : le JWT est d'abord vérifié cryptographiquement (RS256), PUIS
 * le hash embarqué dans le payload est comparé au hash COURANT du document
 * référencé (recalculé depuis `_storage`, pas depuis la table de signature)
 * — toute altération du blob depuis la signature fait diverger les deux et
 * invalide le résultat.
 */
export const verifySignature = query({
  args: {
    id: v.optional(v.id("documentSignature")),
    token: v.optional(v.string()),
  },
  returns: v.object({
    valid: v.boolean(),
    signerIdentity: v.optional(
      v.object({
        name: v.string(),
        idnId: v.optional(v.string()),
      }),
    ),
    signedAt: v.optional(v.number()),
    documentHash: v.optional(v.string()),
    documentName: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    if (args.id && args.token) {
      throw new ConvexError({
        code: "INVALID_ARGS",
        message: "Fournir soit `id`, soit `token`, pas les deux.",
      })
    }

    let token = args.token
    if (!token && args.id) {
      const record = await ctx.db.get(args.id)
      token = record?.signature
    }
    if (!token) return { valid: false }

    const result = await verifyDocumentToken(token)
    if (!result.valid) return { valid: false }

    const currentHash = await currentDocumentHash(
      ctx,
      result.payload.documentItemId as Id<"documentItem"> | undefined,
    )
    if (currentHash !== null && currentHash !== result.payload.hash) {
      return { valid: false }
    }

    return {
      valid: true,
      signerIdentity: {
        name: result.payload.name,
        idnId: result.payload.idnId,
      },
      signedAt: result.payload.iat,
      documentHash: result.payload.hash,
      documentName: result.payload.documentName,
    }
  },
})
