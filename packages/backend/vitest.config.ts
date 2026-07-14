import { defineConfig } from "vitest/config"

/**
 * Config vitest pour les tests `convex-test` (cf. convex/_generated/ai/guidelines.md
 * §Testing guidelines). Runtime `edge-runtime` : plus proche du runtime V8
 * Convex que Node — évite les faux positifs sur des APIs Node absentes en
 * prod (ex. `Buffer`).
 */
export default defineConfig({
  test: {
    environment: "edge-runtime",
    server: {
      deps: {
        // Ces packages exposent des sources TS non pré-compilées consommées
        // directement par les tests (ex. `@convex-dev/aggregate/test` pour
        // enregistrer le component agrégat via `t.registerComponent`) —
        // Vitest doit les transformer plutôt que les traiter en external SSR.
        inline: ["convex-test", "@convex-dev/aggregate", "@convex-dev/rate-limiter"],
      },
    },
  },
})
