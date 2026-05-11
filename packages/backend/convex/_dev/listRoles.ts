import { internalQuery } from "../_generated/server"

/**
 * Helper de dev — liste toutes les entrées `userRole`. À supprimer dès que
 * la console admin est câblée pour cette visualisation.
 */
export const all = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userRole").collect()
  },
})
