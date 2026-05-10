import { v } from "convex/values"

import { mutation } from "./_generated/server"
import { rateLimiter } from "./rateLimiter"
import { CONTACT_CATEGORIES } from "./schema"

/**
 * Demandes via formulaire de contact public (page /contact).
 * Aucune auth, mais rate limit fort pour éviter le spam.
 */

const CATEGORY = v.union(...CONTACT_CATEGORIES.map((c) => v.literal(c)))

export const submitContactRequest = mutation({
  args: {
    category: CATEGORY,
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  returns: v.object({ id: v.id("contactRequest") }),
  handler: async (ctx, args) => {
    // Rate limit 5 demandes par heure par email
    const status = await rateLimiter.limit(ctx, "contactSubmit", {
      key: args.email.toLowerCase(),
      throws: true,
    })
    void status

    // Validations défensives (le front fait Zod, on vérifie quand même)
    const name = args.name.trim()
    const email = args.email.trim().toLowerCase()
    const subject = args.subject.trim()
    const message = args.message.trim()

    if (name.length < 2) throw new Error("Nom trop court")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Email invalide")
    if (subject.length < 3) throw new Error("Sujet trop court")
    if (message.length < 10) throw new Error("Message trop court")
    if (message.length > 5000) throw new Error("Message trop long")

    const id = await ctx.db.insert("contactRequest", {
      category: args.category,
      name,
      email,
      subject,
      message,
      status: "new",
      createdAt: Date.now(),
    })

    return { id }
  },
})
