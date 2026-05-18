import { cronJobs } from "convex/server"

import { internal } from "./_generated/api"

/**
 * Jobs récurrents IDN.
 *
 * Conventions (cf. convex/_generated/ai/guidelines.md) :
 *   • Utiliser `crons.interval(...)` ou `crons.cron(...)` uniquement (pas
 *     `crons.hourly`/`daily`/`weekly`).
 *   • Passer une `FunctionReference` — pas la fonction directement.
 *   • Toujours importer `internal` depuis `_generated/api` même si la
 *     fonction cible est définie dans ce fichier.
 */

const crons = cronJobs()

// Vérifie les expirations de documents iDocument et dispatch les notifs
// `documents` correspondantes (paliers 30j / 7j / expired).
crons.interval(
  "Vault expirations check",
  { hours: 24 },
  internal.vault.cron.checkExpirations,
  {},
)

export default crons
