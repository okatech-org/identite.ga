import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireAuth } from "./lib/auth"
import { FONT_SIZES, LANGUAGES, THEMES } from "./schema"

/**
 * Préférences utilisateur — UI (langue, thème, accessibilité) + notifications.
 * §3.4 du cahier.
 */

const PREF_RETURN = v.object({
  language: v.union(...LANGUAGES.map((l) => v.literal(l))),
  theme: v.union(...THEMES.map((t) => v.literal(t))),
  accessibility: v.object({
    fontSize: v.union(...FONT_SIZES.map((s) => v.literal(s))),
    reducedMotion: v.boolean(),
    highContrast: v.boolean(),
  }),
})

export const getMyPreferences = query({
  args: {},
  returns: v.union(PREF_RETURN, v.null()),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    const pref = await ctx.db
      .query("userPreference")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!pref) return null
    return {
      language: pref.language,
      theme: pref.theme,
      accessibility: pref.accessibility,
    }
  },
})

export const updateMyPreferences = mutation({
  args: {
    language: v.optional(v.union(...LANGUAGES.map((l) => v.literal(l)))),
    theme: v.optional(v.union(...THEMES.map((t) => v.literal(t)))),
    accessibility: v.optional(
      v.object({
        fontSize: v.union(...FONT_SIZES.map((s) => v.literal(s))),
        reducedMotion: v.boolean(),
        highContrast: v.boolean(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const pref = await ctx.db
      .query("userPreference")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    const now = Date.now()

    const next = {
      language: args.language ?? pref?.language ?? "fr",
      theme: args.theme ?? pref?.theme ?? "auto",
      accessibility:
        args.accessibility ??
        pref?.accessibility ?? {
          fontSize: "md" as const,
          reducedMotion: false,
          highContrast: false,
        },
    }

    if (pref) {
      await ctx.db.patch(pref._id, { ...next, updatedAt: now })
    } else {
      await ctx.db.insert("userPreference", {
        userId: user.userId,
        ...next,
        createdAt: now,
        updatedAt: now,
      })
    }
    return null
  },
})

const NOTIF_MATRIX = v.object({
  security: v.boolean(),
  kyc: v.boolean(),
  consent: v.boolean(),
  comms: v.boolean(),
})

export const getMyNotificationPreferences = query({
  args: {},
  returns: v.union(
    v.object({ email: NOTIF_MATRIX, inApp: NOTIF_MATRIX }),
    v.null(),
  ),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    const pref = await ctx.db
      .query("notificationPreference")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!pref) return null
    return { email: pref.email, inApp: pref.inApp }
  },
})

export const updateMyNotificationPreferences = mutation({
  args: {
    email: v.optional(NOTIF_MATRIX),
    inApp: v.optional(NOTIF_MATRIX),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const pref = await ctx.db
      .query("notificationPreference")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    const now = Date.now()

    const fallback = { security: true, kyc: true, consent: true, comms: false }
    const fallbackInApp = { ...fallback, comms: true }

    if (pref) {
      await ctx.db.patch(pref._id, {
        email: args.email ?? pref.email,
        inApp: args.inApp ?? pref.inApp,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("notificationPreference", {
        userId: user.userId,
        email: args.email ?? fallback,
        inApp: args.inApp ?? fallbackInApp,
        updatedAt: now,
      })
    }
    return null
  },
})
