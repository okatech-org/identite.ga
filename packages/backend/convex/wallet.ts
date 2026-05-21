import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import { query } from "./_generated/server"
import { mutation } from "./functions"
import type { Doc, Id } from "./_generated/dataModel"
import { requireAuth, requireVerifiedAuth } from "./lib/auth"
import { rateLimiter } from "./rateLimiter"
import { WALLET_CARD_TYPES } from "./schema"

/**
 * iCarte — Portefeuille numérique de cartes.
 * Cf. ressources/SPECS_FEATURES_CITIZEN.md §1.
 *
 * Toutes les cartes (CNI, permis, transport, CNAMGS, bancaire, visite,
 * électeur, fidélité, consulaire, custom) sont stockées dans `walletCard`
 * et possédées par le citoyen. Le drapeau `featured` + le champ `position`
 * pilotent l'affichage des « Cartes dans le Profil » (max 6) du dashboard.
 */

const MAX_FEATURED = 6
const POSITION_STEP = 1000

const CARD_TYPE_VALIDATOR = v.union(
  ...WALLET_CARD_TYPES.map((t) => v.literal(t)),
)

const STRING_RECORD = v.record(v.string(), v.string())

// ─────────────────────────────────────────────────────────────────────────
// Validators de sortie
// ─────────────────────────────────────────────────────────────────────────

const WALLET_CARD_OUT = v.object({
  _id: v.id("walletCard"),
  _creationTime: v.number(),
  type: CARD_TYPE_VALIDATOR,
  name: v.string(),
  subtitle: v.optional(v.string()),
  gradient: v.string(),
  iconKey: v.string(),
  isOfficialStyle: v.boolean(),
  data: STRING_RECORD,
  backData: v.optional(STRING_RECORD),
  featured: v.boolean(),
  position: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
})

function serializeCard(card: Doc<"walletCard">) {
  return {
    _id: card._id,
    _creationTime: card._creationTime,
    type: card.type,
    name: card.name,
    subtitle: card.subtitle,
    gradient: card.gradient,
    iconKey: card.iconKey,
    isOfficialStyle: card.isOfficialStyle,
    data: card.data,
    backData: card.backData,
    featured: card.featured,
    position: card.position,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────────────────

async function loadActiveCards(
  ctx: { db: { query: any } },
  userId: string,
): Promise<Doc<"walletCard">[]> {
  const all = await ctx.db
    .query("walletCard")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .collect()
  return all.filter((c: Doc<"walletCard">) => c.deletedAt === undefined)
}

async function loadOwnedCard(
  ctx: { db: { get: any } },
  cardId: Id<"walletCard">,
  userId: string,
): Promise<Doc<"walletCard">> {
  const card = await ctx.db.get(cardId)
  if (!card || card.userId !== userId || card.deletedAt !== undefined) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Carte introuvable.",
    })
  }
  return card
}

function nextPosition(cards: Doc<"walletCard">[]): number {
  let max = 0
  for (const c of cards) if (c.position > max) max = c.position
  return max + POSITION_STEP
}

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

export const listMine = query({
  args: {},
  returns: v.object({
    cards: v.array(WALLET_CARD_OUT),
    featuredCount: v.number(),
    featuredLimit: v.number(),
  }),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    const cards = await loadActiveCards(ctx, user.userId)
    cards.sort((a, b) => a.position - b.position)
    const featuredCount = cards.filter((c) => c.featured).length
    return {
      cards: cards.map(serializeCard),
      featuredCount,
      featuredLimit: MAX_FEATURED,
    }
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Mutations citoyen
// ─────────────────────────────────────────────────────────────────────────

const CREATE_ARGS = {
  type: CARD_TYPE_VALIDATOR,
  name: v.string(),
  subtitle: v.optional(v.string()),
  gradient: v.string(),
  iconKey: v.string(),
  isOfficialStyle: v.optional(v.boolean()),
  data: STRING_RECORD,
  backData: v.optional(STRING_RECORD),
}

export const create = mutation({
  args: CREATE_ARGS,
  returns: v.id("walletCard"),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "walletWrite", { key: user.userId, throws: true })

    if (args.name.trim().length < 1) {
      throw new ConvexError({ code: "INVALID", message: "Nom requis." })
    }

    const existing = await loadActiveCards(ctx, user.userId)
    const featuredCount = existing.filter((c) => c.featured).length
    const canFeature = featuredCount < MAX_FEATURED
    const now = Date.now()

    const id = await ctx.db.insert("walletCard", {
      userId: user.userId,
      type: args.type,
      name: args.name.trim(),
      subtitle: args.subtitle?.trim() || undefined,
      gradient: args.gradient,
      iconKey: args.iconKey,
      isOfficialStyle: args.isOfficialStyle ?? false,
      data: args.data,
      backData: args.backData,
      featured: canFeature,
      position: nextPosition(existing),
      createdAt: now,
      updatedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_modified",
      targetType: "user",
      targetId: user.userId,
      metadata: { module: "wallet", op: "create", cardId: id, cardType: args.type },
    })

    return id
  },
})

export const update = mutation({
  args: {
    cardId: v.id("walletCard"),
    name: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    gradient: v.optional(v.string()),
    iconKey: v.optional(v.string()),
    data: v.optional(STRING_RECORD),
    backData: v.optional(STRING_RECORD),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "walletWrite", { key: user.userId, throws: true })
    const card = await loadOwnedCard(ctx, args.cardId, user.userId)

    const patch: Partial<Doc<"walletCard">> = { updatedAt: Date.now() }
    if (args.name !== undefined) {
      if (args.name.trim().length < 1) {
        throw new ConvexError({ code: "INVALID", message: "Nom requis." })
      }
      patch.name = args.name.trim()
    }
    if (args.subtitle !== undefined) patch.subtitle = args.subtitle.trim() || undefined
    if (args.gradient !== undefined) patch.gradient = args.gradient
    if (args.iconKey !== undefined) patch.iconKey = args.iconKey
    if (args.data !== undefined) patch.data = args.data
    if (args.backData !== undefined) patch.backData = args.backData

    await ctx.db.patch(card._id, patch)

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_modified",
      targetType: "user",
      targetId: user.userId,
      metadata: { module: "wallet", op: "update", cardId: card._id },
    })
    return null
  },
})

export const remove = mutation({
  args: { cardId: v.id("walletCard") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "walletWrite", { key: user.userId, throws: true })
    const card = await loadOwnedCard(ctx, args.cardId, user.userId)

    await ctx.db.patch(card._id, {
      deletedAt: Date.now(),
      featured: false,
      updatedAt: Date.now(),
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_modified",
      targetType: "user",
      targetId: user.userId,
      metadata: { module: "wallet", op: "remove", cardId: card._id },
    })
    return null
  },
})

export const setFeatured = mutation({
  args: {
    cardId: v.id("walletCard"),
    featured: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "walletWrite", { key: user.userId, throws: true })
    const card = await loadOwnedCard(ctx, args.cardId, user.userId)

    if (card.featured === args.featured) return null

    if (args.featured) {
      const active = await loadActiveCards(ctx, user.userId)
      const featuredCount = active.filter((c) => c.featured).length
      if (featuredCount >= MAX_FEATURED) {
        throw new ConvexError({
          code: "FEATURED_LIMIT",
          message: `Maximum ${MAX_FEATURED} cartes dans le profil.`,
        })
      }
    }

    await ctx.db.patch(card._id, {
      featured: args.featured,
      updatedAt: Date.now(),
    })
    return null
  },
})

export const reorderFeatured = mutation({
  args: { orderedIds: v.array(v.id("walletCard")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "walletWrite", { key: user.userId, throws: true })

    if (args.orderedIds.length > MAX_FEATURED) {
      throw new ConvexError({
        code: "INVALID",
        message: `Maximum ${MAX_FEATURED} cartes mises en avant.`,
      })
    }
    if (new Set(args.orderedIds).size !== args.orderedIds.length) {
      throw new ConvexError({
        code: "INVALID",
        message: "IDs en double dans l'ordre demandé.",
      })
    }

    // Charge et valide chaque carte (ownership + featured + active).
    const cards: Doc<"walletCard">[] = []
    for (const id of args.orderedIds) {
      const c = await loadOwnedCard(ctx, id, user.userId)
      if (!c.featured) {
        throw new ConvexError({
          code: "INVALID",
          message: "Une carte non mise en avant a été passée à reorderFeatured.",
        })
      }
      cards.push(c)
    }

    const now = Date.now()
    for (let i = 0; i < cards.length; i++) {
      await ctx.db.patch(cards[i]!._id, {
        position: (i + 1) * POSITION_STEP,
        updatedAt: now,
      })
    }
    return null
  },
})

