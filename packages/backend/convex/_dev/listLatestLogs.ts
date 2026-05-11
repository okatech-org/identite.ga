import { internalQuery } from "../_generated/server"

export const all = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("auditLog")
      .withIndex("by_createdAt")
      .order("desc")
      .take(10)
  },
})
