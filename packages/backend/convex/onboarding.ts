import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import { mutation } from "./_generated/server"
import { requireAuth, requireVerifiedAuth } from "./lib/auth"
import { PROFILE_TYPES } from "./schema"

/**
 * Onboarding citoyen (§3.2 du cahier).
 *
 * Le sign-up email/password + envoi OTP + vérification email sont gérés
 * par Better Auth (routes /api/auth/sign-up/email, /api/auth/email-otp/*).
 * Ici on couvre les ÉTAPES IDN-spécifiques :
 *   • Sélection du profil (citizen / resident / visitor / developer)
 *   • Identité pivot (nom, prénom, ddn, genre, lieu, nationalité)
 *   • PIN à 6 chiffres (PBKDF2-SHA256, 600k itérations)
 *
 * À la création du userProfile, on initialise aussi userPreference et
 * notificationPreference avec les valeurs par défaut.
 */

const PIN_REGEX = /^\d{6}$/

export const selectProfile = mutation({
  args: {
    profileType: v.union(...PROFILE_TYPES.map((t) => v.literal(t))),
  },
  returns: v.object({ profileId: v.id("userProfile") }),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)

    const existing = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()

    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, {
        profileType: args.profileType,
        updatedAt: now,
      })
      return { profileId: existing._id }
    }

    const profileId = await ctx.db.insert("userProfile", {
      userId: user.userId,
      profileType: args.profileType,
      loa: 1, // email vérifié = niveau 1
      createdAt: now,
      updatedAt: now,
    })

    // Initialise les préférences par défaut (langue fr, thème auto)
    await ctx.db.insert("userPreference", {
      userId: user.userId,
      language: "fr",
      theme: "auto",
      accessibility: {
        fontSize: "md",
        reducedMotion: false,
        highContrast: false,
      },
      createdAt: now,
      updatedAt: now,
    })

    // Préférences notifications par défaut : tout activé pour security/kyc/consent
    await ctx.db.insert("notificationPreference", {
      userId: user.userId,
      email: { security: true, kyc: true, consent: true, comms: false },
      inApp: { security: true, kyc: true, consent: true, comms: true },
      updatedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_created",
      targetType: "user",
      targetId: user.userId,
      metadata: { profileType: args.profileType },
    })

    return { profileId }
  },
})

export const setIdentityPivot = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(), // ISO YYYY-MM-DD
    gender: v.union(
      v.literal("M"),
      v.literal("F"),
      v.literal("O"),
      v.literal("N"),
    ),
    birthPlace: v.string(),
    nationality: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!profile) {
      throw new ConvexError({
        code: "PROFILE_REQUIRED",
        message: "Sélectionnez votre profil d'abord.",
      })
    }

    if (args.firstName.trim().length < 1 || args.lastName.trim().length < 1) {
      throw new ConvexError({
        code: "INVALID",
        message: "Nom et prénom requis.",
      })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.dateOfBirth)) {
      throw new ConvexError({
        code: "INVALID",
        message: "Date de naissance invalide.",
      })
    }

    await ctx.db.patch(profile._id, {
      pivot: {
        firstName: args.firstName.trim(),
        lastName: args.lastName.trim(),
        dateOfBirth: args.dateOfBirth,
        gender: args.gender,
        birthPlace: args.birthPlace.trim(),
        nationality: args.nationality.trim().toUpperCase(),
      },
      updatedAt: Date.now(),
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_modified",
      targetType: "user",
      targetId: user.userId,
      metadata: { field: "pivot" },
    })

    return null
  },
})

export const createPin = mutation({
  args: { pin: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)

    if (!PIN_REGEX.test(args.pin)) {
      throw new ConvexError({
        code: "INVALID_PIN",
        message: "Le PIN doit contenir exactement 6 chiffres.",
      })
    }

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!profile) {
      throw new ConvexError({
        code: "PROFILE_REQUIRED",
        message: "Sélectionnez votre profil d'abord.",
      })
    }

    const pinHash = await derivePinHash(args.pin, user.userId)
    await ctx.db.patch(profile._id, {
      pinHash,
      updatedAt: Date.now(),
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "pin_changed",
      targetType: "user",
      targetId: user.userId,
    })

    return null
  },
})

/**
 * PBKDF2-SHA256, 600 000 itérations (cf. cahier §6.1).
 * Le sel par utilisateur est dérivé du userId — pas de stockage séparé
 * (on reconstruit toujours le même hash pour le même PIN+user).
 */
async function derivePinHash(pin: string, userId: string): Promise<string> {
  const salt = new TextEncoder().encode(`idn:pin:${userId}`)
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 600_000, hash: "SHA-256" },
    keyMaterial,
    256,
  )
  return [...new Uint8Array(bits)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export const verifyPin = mutation({
  args: { pin: v.string() },
  returns: v.object({ valid: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    if (!PIN_REGEX.test(args.pin)) return { valid: false }

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!profile?.pinHash) return { valid: false }

    const candidate = await derivePinHash(args.pin, user.userId)
    return { valid: candidate === profile.pinHash }
  },
})
