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

// Anonymise les comptes dont la suppression demandée a passé son
// cooldown 30j (Apple Guideline 5.1.1(v) + RGPD §3.4).
crons.interval(
  "Process scheduled deletions",
  { hours: 24 },
  internal.privacy.deletion.processScheduledDeletions,
  {},
)

// Filet de sécurité des rappels d'entretien Niveau 3. Le rappel principal est
// planifié exactement à J-1 lors de la réservation ; ce passage récupère un
// éventuel job manqué sans créer de doublon.
crons.interval(
  "Level 3 appointment reminders",
  { minutes: 30 },
  internal.level3.scheduling.dispatchDueReminders,
  {},
)

// Filet de reprise : les actions planifiées peuvent être interrompues par un
// déploiement. Les claims et identifiants rendent ce passage idempotent.
crons.interval(
  "Webhook delivery recovery",
  { minutes: 5 },
  internal.webhooks.dispatch.recoverPending,
  {},
)

crons.interval(
  "Webhook retention cleanup",
  { hours: 24 },
  internal.webhooks.dispatch.pruneExpired,
  {},
)

crons.interval(
  "PIN recovery cleanup",
  { hours: 1 },
  internal.pinRecovery.pruneExpired,
  {},
)

export default crons
