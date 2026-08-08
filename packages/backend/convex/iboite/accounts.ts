import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { internalMutation, mutation, query } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { requireAuth } from "../lib/auth"
import { generateIboiteEmailAlias, generateIboiteQrCode } from "../lib/iboiteId"

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
  isAddressConfigured: v.boolean(),
  latitude: v.union(v.number(), v.null()),
  longitude: v.union(v.number(), v.null()),
  district: v.union(v.string(), v.null()),
  addressLine: v.union(v.string(), v.null()),
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
    isAddressConfigured: a.isAddressConfigured === true,
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    district: a.district ?? null,
    addressLine: a.addressLine ?? null,
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

/**
 * Configure ou met à jour l'adresse postale du compte (par le citoyen
 * lui-même). Tous les champs sont optionnels individuellement mais on exige
 * **au moins une coordonnée GPS** ou **une ville** pour permettre la livraison
 * physique. Marque `isAddressConfigured: true` à la fin.
 *
 * Pour la V1 (Gabon), pas de validation stricte de format — l'urbanisme local
 * ne le permet pas. Le geocoding (reverse) est fait côté client (Nominatim),
 * on stocke ce que le geocoder a renvoyé + ce que l'utilisateur a édité.
 */
export const setAddress = mutation({
  args: {
    accountId: v.id("iboiteAccount"),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    district: v.optional(v.string()),
    addressLine: v.optional(v.string()),
    street: v.optional(v.string()),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const account = await loadOwnedAccount(ctx, args.accountId, user.userId)

    const hasGps =
      typeof args.latitude === "number" && typeof args.longitude === "number"
    const hasCity = (args.city ?? "").trim().length > 0
    if (!hasGps && !hasCity) {
      throw new ConvexError({
        code: "INVALID",
        message: "Indiquez au moins votre ville ou activez la géolocalisation.",
      })
    }
    if (hasGps) {
      if (
        args.latitude! < -90 ||
        args.latitude! > 90 ||
        args.longitude! < -180 ||
        args.longitude! > 180
      ) {
        throw new ConvexError({
          code: "INVALID",
          message: "Coordonnées GPS invalides.",
        })
      }
    }

    await ctx.db.patch(account._id, {
      latitude: args.latitude ?? undefined,
      longitude: args.longitude ?? undefined,
      district: args.district?.trim() || undefined,
      addressLine: args.addressLine?.trim() || undefined,
      street: (args.street ?? "").trim(),
      city: (args.city ?? "").trim(),
      postalCode: (args.postalCode ?? "").trim(),
      country: (args.country ?? "Gabon").trim() || "Gabon",
      isAddressConfigured: true,
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
    // Handle IDN choisi par l'utilisateur lors du sign-up. Quand fourni,
    // l'iBoîte personnel utilise `<handle>@idn.ga` comme adresse — sinon
    // on fallback sur un alias dérivé du nom (legacy / flow admin).
    idnHandle: v.optional(v.string()),
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
    if (existing) {
      if (
        existing.mailboxStatus !== "provisioned" &&
        process.env.NODE_ENV !== "test"
      ) {
        await ctx.scheduler.runAfter(
          0,
          internal.iboite.mailActions.provisionMailbox,
          { accountId: existing._id },
        )
      }
      return null
    }

    const qrCode = await generateIboiteQrCode(ctx, "personal")
    const emailAlias = args.idnHandle
      ? `${args.idnHandle}@idn.ga`
      : await generateIboiteEmailAlias(ctx, {
          firstName: args.firstName ?? null,
          lastName: args.lastName ?? null,
          idnId: args.idnId ?? null,
        })

    const displayName =
      [args.firstName, args.lastName].filter(Boolean).join(" ") || "Personnel"

    const now = Date.now()
    const accountId = await ctx.db.insert("iboiteAccount", {
      userId: args.userId,
      type: "personal",
      label: "Personnel",
      emailAlias,
      mailboxStatus: "pending",
      // Adresse vide à la création — le citoyen la configure depuis l'UI
      // iBoîte (géolocalisation GPS prioritaire, saisie manuelle en fallback).
      // Au Gabon les adresses formelles sont rares — voir `setAddress`.
      street: "",
      city: "",
      postalCode: "",
      country: "Gabon",
      isAddressConfigured: false,
      qrCode,
      counters: emptyCounters(),
      createdAt: now,
      updatedAt: now,
    })

    // Le nom complet du destinataire est dérivé du pivot KYC : on ne le
    // stocke pas dans `iboiteAccount` pour éviter la duplication
    // (le résolveur d'adresse postale lit `userProfile.pivot`).
    void displayName

    if (process.env.NODE_ENV !== "test") {
      await ctx.scheduler.runAfter(
        0,
        internal.iboite.mailActions.provisionMailbox,
        { accountId },
      )
    }

    return null
  },
})
