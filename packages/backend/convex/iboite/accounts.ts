import { ConvexError, v } from "convex/values"

import {
  internalMutation,
  mutation,
  query,
} from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { requireAuth } from "../lib/auth"
import {
  generateIboiteEmailAlias,
  generateIboiteQrCode,
} from "../lib/iboiteId"

/**
 * iBoîte — Comptes (cf. SPECS_FEATURES_CITIZEN.md §2.3).
 *
 * Phase 1 : seul le compte `personal` est créé automatiquement à l'onboarding
 * (via `internal.iboite.accounts.ensurePersonal`). Les comptes professionnel
 * et association ne sont pas créables côté citoyen pour cette version
 * (workflow d'enrôlement séparé prévu plus tard).
 */

const COUNTERS_OUT = v.object({
  unreadLetters: v.number(),
  pendingLetters: v.number(),
  availablePackages: v.number(),
  unreadMessages: v.number(),
})

const ACCOUNT_OUT = v.object({
  _id: v.id("iboiteAccount"),
  type: v.union(
    v.literal("personal"),
    v.literal("professional"),
    v.literal("association"),
  ),
  label: v.string(),
  emailAlias: v.string(),
  street: v.string(),
  city: v.string(),
  postalCode: v.string(),
  country: v.string(),
  qrCode: v.string(),
  counters: COUNTERS_OUT,
  createdAt: v.number(),
  updatedAt: v.number(),
})

export function emptyCounters() {
  return {
    unreadLetters: 0,
    pendingLetters: 0,
    availablePackages: 0,
    unreadMessages: 0,
  }
}

/**
 * Charge un compte iBoîte en validant l'ownership du user courant.
 * Helper réutilisé par tous les modules iboite/*.
 */
export async function loadOwnedAccount(
  ctx: { db: { get: any } },
  accountId: Id<"iboiteAccount">,
  userId: string,
): Promise<Doc<"iboiteAccount">> {
  const account = await ctx.db.get(accountId)
  if (!account || account.userId !== userId) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Compte iBoîte introuvable.",
    })
  }
  return account
}

export async function loadAccountByQrCode(
  ctx: { db: { query: any } },
  qrCode: string,
): Promise<Doc<"iboiteAccount"> | null> {
  return await ctx.db
    .query("iboiteAccount")
    .withIndex("by_qrCode", (q: any) => q.eq("qrCode", qrCode))
    .unique()
}

export async function loadAccountByEmailAlias(
  ctx: { db: { query: any } },
  emailAlias: string,
): Promise<Doc<"iboiteAccount"> | null> {
  return await ctx.db
    .query("iboiteAccount")
    .withIndex("by_emailAlias", (q: any) => q.eq("emailAlias", emailAlias))
    .unique()
}

function serializeAccount(a: Doc<"iboiteAccount">) {
  return {
    _id: a._id,
    type: a.type,
    label: a.label,
    emailAlias: a.emailAlias,
    street: a.street,
    city: a.city,
    postalCode: a.postalCode,
    country: a.country,
    qrCode: a.qrCode,
    counters: a.counters,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Queries citoyen
// ─────────────────────────────────────────────────────────────────────────

export const listMine = query({
  args: {},
  returns: v.array(ACCOUNT_OUT),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    const accounts = await ctx.db
      .query("iboiteAccount")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .collect()
    accounts.sort((a, b) => a.createdAt - b.createdAt)
    return accounts.map(serializeAccount)
  },
})

export const getById = query({
  args: { accountId: v.id("iboiteAccount") },
  returns: v.union(ACCOUNT_OUT, v.null()),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const account = await ctx.db.get(args.accountId)
    if (!account || account.userId !== user.userId) return null
    return serializeAccount(account)
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Mutations citoyen
// ─────────────────────────────────────────────────────────────────────────

export const setLabel = mutation({
  args: {
    accountId: v.id("iboiteAccount"),
    label: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const account = await loadOwnedAccount(ctx, args.accountId, user.userId)
    const trimmed = args.label.trim()
    if (trimmed.length < 1 || trimmed.length > 80) {
      throw new ConvexError({
        code: "INVALID",
        message: "Le libellé doit faire entre 1 et 80 caractères.",
      })
    }
    await ctx.db.patch(account._id, {
      label: trimmed,
      updatedAt: Date.now(),
    })
    return null
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Internal — appelé depuis onboarding.selectProfile
// ─────────────────────────────────────────────────────────────────────────

export const ensurePersonal = internalMutation({
  args: {
    userId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    idnId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Idempotent : si un compte personal existe déjà, on ne fait rien.
    const existing = await ctx.db
      .query("iboiteAccount")
      .withIndex("by_userId_type", (q) =>
        q.eq("userId", args.userId).eq("type", "personal"),
      )
      .first()
    if (existing) return null

    const qrCode = await generateIboiteQrCode(ctx, "personal")
    const emailAlias = await generateIboiteEmailAlias(ctx, {
      firstName: args.firstName ?? null,
      lastName: args.lastName ?? null,
      idnId: args.idnId ?? null,
    })

    const displayName =
      [args.firstName, args.lastName].filter(Boolean).join(" ") || "Personnel"

    const now = Date.now()
    await ctx.db.insert("iboiteAccount", {
      userId: args.userId,
      type: "personal",
      label: "Personnel",
      emailAlias,
      // Adresse postale virtuelle (point relais idn.ga) — valeurs par défaut
      // alignées avec les maquettes ; le citoyen ne peut pas les modifier
      // (V1) — c'est une adresse fournie par IDN.
      street: "Avenue du Colonel Parant",
      city: "Libreville",
      postalCode: "BP 1000",
      country: "Gabon",
      qrCode,
      counters: emptyCounters(),
      createdAt: now,
      updatedAt: now,
    })

    // Le nom complet du destinataire est dérivé du pivot KYC : on ne le
    // stocke pas dans `iboiteAccount` pour éviter la duplication
    // (le résolveur d'adresse postale lit `userProfile.pivot`).
    void displayName

    return null
  },
})
