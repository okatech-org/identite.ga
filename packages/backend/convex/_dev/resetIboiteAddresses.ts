import { internalMutation } from "../_generated/server"

/**
 * Backfill one-shot — vide les adresses postales codées en dur ajoutées aux
 * comptes iBoîte créés AVANT l'arrivée du flow de configuration utilisateur
 * (géolocalisation / saisie manuelle). Marque tous les comptes comme
 * `isAddressConfigured: false` pour que l'UI propose la configuration.
 *
 * Sécurité : `internalMutation`, donc invocable uniquement via
 * `bunx convex run _dev/resetIboiteAddresses:run`.
 *
 * Idempotent : exécuter plusieurs fois est sûr.
 */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    let reset = 0
    for await (const doc of ctx.db.query("iboiteAccount")) {
      if (doc.isAddressConfigured === true) continue
      await ctx.db.patch(doc._id, {
        street: "",
        city: "",
        postalCode: "",
        country: "Gabon",
        isAddressConfigured: false,
        latitude: undefined,
        longitude: undefined,
        district: undefined,
        addressLine: undefined,
        updatedAt: Date.now(),
      })
      reset++
    }
    return { reset }
  },
})
