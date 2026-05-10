import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { getCurrentAuthUser, requireAuth, requireVerifiedAuth } from "./lib/auth"
import { internal } from "./_generated/api"

/**
 * Profil citoyen (§3.3 — Mon compte).
 *
 * - getCurrentUser : agrège user Better Auth + userProfile + userPreference
 * - updatePivot     : modifie identité pivot (audit log)
 * - generateUploadUrl : storage pour photo de profil (signed URL Convex)
 * - setProfilePhoto : pose la ref photo après upload
 */

export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      userId: v.string(),
      email: v.string(),
      emailVerified: v.boolean(),
      role: v.string(),
      profile: v.union(
        v.object({
          loa: v.number(),
          profileType: v.string(),
          pivot: v.optional(
            v.object({
              firstName: v.string(),
              lastName: v.string(),
              dateOfBirth: v.string(),
              gender: v.string(),
              birthPlace: v.string(),
              nationality: v.string(),
            }),
          ),
          photoStorageRef: v.optional(v.id("_storage")),
        }),
        v.null(),
      ),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const auth = await getCurrentAuthUser(ctx)
    if (!auth) return null

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", auth.userId))
      .unique()

    return {
      userId: auth.userId,
      email: auth.email,
      emailVerified: auth.emailVerified,
      role: auth.role ?? "user",
      profile: profile
        ? {
            loa: profile.loa,
            profileType: profile.profileType,
            pivot: profile.pivot,
            photoStorageRef: profile.photoStorageRef,
          }
        : null,
    }
  },
})

export const updatePivot = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
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
        code: "PROFILE_NOT_FOUND",
        message: "Profil introuvable.",
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

export const generateProfilePhotoUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAuth(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const setProfilePhoto = mutation({
  args: { storageRef: v.id("_storage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!profile) {
      throw new ConvexError({
        code: "PROFILE_NOT_FOUND",
        message: "Profil introuvable.",
      })
    }

    // Optionnel : supprimer l'ancienne photo
    if (profile.photoStorageRef) {
      await ctx.storage.delete(profile.photoStorageRef)
    }

    await ctx.db.patch(profile._id, {
      photoStorageRef: args.storageRef,
      updatedAt: Date.now(),
    })

    await ctx.db.insert("userDocument", {
      userId: user.userId,
      type: "profilePhoto",
      storageRef: args.storageRef,
      mimeType: "image/jpeg", // TODO(idn): détecter dynamiquement
      sha256: "", // TODO(idn): calculer côté client
      createdAt: Date.now(),
    })

    return null
  },
})
