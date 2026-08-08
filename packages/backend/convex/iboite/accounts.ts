import { ConvexError, v } from "convex/values"

import { components, internal } from "../_generated/api"
import { internalMutation, mutation, query } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { authComponent } from "../auth"
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

const IDN_EMAIL_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*@idn\.ga$/

function normalizeIdnEmail(value: string): string | null {
  const normalized = value.trim().toLowerCase()
  const email = normalized.includes("@") ? normalized : `${normalized}@idn.ga`
  return IDN_EMAIL_PATTERN.test(email) ? email : null
}

async function canonicalPersonalEmail(
  ctx: Parameters<typeof authComponent.getAnyUserById>[0],
  userId: string,
  idnHandle?: string,
): Promise<string | null> {
  if (idnHandle) return normalizeIdnEmail(idnHandle)
  const authUser = await authComponent.getAnyUserById(ctx, userId)
  return normalizeIdnEmail(authUser?.email ?? "")
}

async function assertAliasAvailable(
  ctx: { db: { query: any } },
  emailAlias: string,
  currentAccountId?: Id<"iboiteAccount">,
) {
  const owner = await ctx.db
    .query("iboiteAccount")
    .withIndex("by_emailAlias", (q: any) => q.eq("emailAlias", emailAlias))
    .first()
  if (owner && owner._id !== currentAccountId) {
    throw new Error(`L'adresse iBoîte ${emailAlias} est déjà attribuée.`)
  }
}

async function renameStoredEmailReferences(
  ctx: { db: any },
  oldEmail: string,
  newEmail: string,
) {
  let messagesUpdated = 0
  const messages = await ctx.db.query("iboiteMessage").collect()
  for (const message of messages) {
    const update: { senderEmail?: string; recipientEmail?: string } = {}
    if (message.senderEmail === oldEmail) update.senderEmail = newEmail
    if (message.recipientEmail === oldEmail) update.recipientEmail = newEmail
    if (Object.keys(update).length > 0) {
      await ctx.db.patch(message._id, update)
      messagesUpdated += 1
    }
  }

  let receiptsUpdated = 0
  const receipts = await ctx.db.query("iboiteInboundReceipt").collect()
  for (const receipt of receipts) {
    if (receipt.recipientEmail !== oldEmail) continue
    const collision = await ctx.db
      .query("iboiteInboundReceipt")
      .withIndex("by_provider_recipient", (q: any) =>
        q
          .eq("providerMessageId", receipt.providerMessageId)
          .eq("recipientEmail", newEmail),
      )
      .unique()
    if (collision && collision._id !== receipt._id) {
      throw new Error(
        `Un reçu entrant existe déjà pour ${receipt.providerMessageId} et ${newEmail}.`,
      )
    }
    await ctx.db.patch(receipt._id, { recipientEmail: newEmail })
    receiptsUpdated += 1
  }

  return { messagesUpdated, receiptsUpdated }
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
    // L'adresse IDN de connexion est la source de vérité. L'ancien parcours
    // créait parfois l'iBoîte avant de connaître cette adresse, à partir du
    // prénom/nom ; on resynchronise donc aussi les comptes déjà existants.
    const desiredAlias = await canonicalPersonalEmail(
      ctx,
      args.userId,
      args.idnHandle,
    )
    const existing = await ctx.db
      .query("iboiteAccount")
      .withIndex("by_userId_type", (q) =>
        q.eq("userId", args.userId).eq("type", "personal"),
      )
      .first()
    if (existing) {
      if (desiredAlias && existing.emailAlias !== desiredAlias) {
        await assertAliasAvailable(ctx, desiredAlias, existing._id)
        const oldEmail = existing.emailAlias
        await renameStoredEmailReferences(ctx, oldEmail, desiredAlias)
        await ctx.db.patch(existing._id, {
          emailAlias: desiredAlias,
          mailboxStatus: "pending",
          mailboxProvisioningError: undefined,
          updatedAt: Date.now(),
        })
        if (process.env.NODE_ENV !== "test") {
          await ctx.scheduler.runAfter(
            0,
            internal.iboite.mailActions.renameMailbox,
            { accountId: existing._id, oldEmail, newEmail: desiredAlias },
          )
        }
        return null
      }
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
    const emailAlias =
      desiredAlias ??
      (await generateIboiteEmailAlias(ctx, {
        firstName: args.firstName ?? null,
        lastName: args.lastName ?? null,
        idnId: args.idnId ?? null,
      }))
    await assertAliasAvailable(ctx, emailAlias)

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

/**
 * Réconcilie les comptes personnels historiques avec leur adresse IDN.
 *
 * - si Better Auth possède déjà une adresse @idn.ga, elle est canonique ;
 * - pour les anciens citoyens encore connectés avec une adresse externe,
 *   l'adresse iBoîte @idn.ga devient leur adresse de connexion ;
 * - les comptes techniques et les lignes orphelines sont volontairement
 *   ignorés : ils ne représentent pas une identité citoyenne.
 */
export const reconcilePersonalEmails = internalMutation({
  args: { apply: v.boolean() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const accounts = await ctx.db.query("iboiteAccount").collect()
    const changed: Array<Record<string, unknown>> = []
    const skipped: Array<Record<string, unknown>> = []

    for (const account of accounts) {
      if (account.type !== "personal") continue
      const profile = await ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", account.userId))
        .unique()
      if (!profile) {
        skipped.push({
          accountId: account._id,
          reason: "no_citizen_profile",
        })
        continue
      }

      const authUser = await authComponent.getAnyUserById(ctx, account.userId)
      if (!authUser) {
        skipped.push({ accountId: account._id, reason: "auth_user_missing" })
        continue
      }

      const authEmail = authUser.email.trim().toLowerCase()
      const iboiteEmail = account.emailAlias.trim().toLowerCase()
      const canonicalEmail =
        normalizeIdnEmail(authEmail) ?? normalizeIdnEmail(iboiteEmail)
      if (!canonicalEmail) {
        skipped.push({ accountId: account._id, reason: "no_idn_email" })
        continue
      }
      if (authEmail === canonicalEmail && iboiteEmail === canonicalEmail) {
        continue
      }

      await assertAliasAvailable(ctx, canonicalEmail, account._id)
      const authOwner = (await ctx.runQuery(
        components.betterAuth.adapter.findOne,
        {
          model: "user",
          where: [{ field: "email", value: canonicalEmail, operator: "eq" }],
        },
      )) as { _id: string } | null
      if (authOwner && authOwner._id !== account.userId) {
        skipped.push({
          accountId: account._id,
          reason: "auth_email_already_used",
          canonicalEmail,
        })
        continue
      }

      changed.push({
        accountId: account._id,
        userId: account.userId,
        oldAuthEmail: authEmail,
        oldIboiteEmail: iboiteEmail,
        canonicalEmail,
      })
      if (!args.apply) continue

      if (authEmail !== canonicalEmail) {
        await ctx.runMutation(components.betterAuth.adapter.updateOne, {
          input: {
            model: "user",
            where: [{ field: "_id", value: account.userId, operator: "eq" }],
            update: {
              email: canonicalEmail,
              emailVerified: true,
              updatedAt: Date.now(),
            },
          },
        })
      }

      if (iboiteEmail !== canonicalEmail) {
        await renameStoredEmailReferences(ctx, iboiteEmail, canonicalEmail)
        await ctx.db.patch(account._id, {
          emailAlias: canonicalEmail,
          mailboxStatus: "pending",
          mailboxProvisioningError: undefined,
          updatedAt: Date.now(),
        })
        if (process.env.NODE_ENV !== "test") {
          await ctx.scheduler.runAfter(
            0,
            internal.iboite.mailActions.renameMailbox,
            {
              accountId: account._id,
              oldEmail: iboiteEmail,
              newEmail: canonicalEmail,
            },
          )
        }
      }
    }

    return { changed, skipped }
  },
})

/** Migration ciblée des références historiques après renommage d'une boîte. */
export const renameEmailReferences = internalMutation({
  args: {
    oldEmail: v.string(),
    newEmail: v.string(),
    apply: v.boolean(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const oldEmail = normalizeIdnEmail(args.oldEmail)
    const newEmail = normalizeIdnEmail(args.newEmail)
    if (!oldEmail || !newEmail) throw new Error("Adresse IDN invalide.")

    const messages = await ctx.db.query("iboiteMessage").collect()
    const messageIds = messages
      .filter(
        (message) =>
          message.senderEmail === oldEmail ||
          message.recipientEmail === oldEmail,
      )
      .map((message) => message._id)
    const receipts = await ctx.db.query("iboiteInboundReceipt").collect()
    const receiptIds = receipts
      .filter((receipt) => receipt.recipientEmail === oldEmail)
      .map((receipt) => receipt._id)

    if (args.apply) {
      await renameStoredEmailReferences(ctx, oldEmail, newEmail)
    }
    return { oldEmail, newEmail, messageIds, receiptIds }
  },
})
