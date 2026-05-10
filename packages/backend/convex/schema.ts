import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  identities: defineTable({
    userId: v.string(),
    fullName: v.string(),
    email: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
})
