import { MINUTE, HOUR, RateLimiter } from "@convex-dev/rate-limiter"

import { components } from "./_generated/api"

/**
 * Rate limiter applicatif IDN (§6.6 du cahier).
 * Transactionnel : si la mutation appelante échoue, le quota n'est pas consommé.
 *
 * Granularités :
 *   • Par IP   → signIn, signUp
 *   • Par user → otpSend, otpVerify, kycSubmit
 *   • Par email → passwordReset, contactSubmit
 *   • Par client OAuth → oauthToken (sharded ×4 pour scalabilité)
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  signIn: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 10 },
  signUp: { kind: "fixed window", rate: 5, period: HOUR },
  otpSend: { kind: "fixed window", rate: 3, period: HOUR },
  otpVerify: { kind: "token bucket", rate: 10, period: HOUR, capacity: 10 },
  passwordReset: { kind: "fixed window", rate: 3, period: HOUR },
  // Récupération du PIN : envoi par identifiant, vérification par demande.
  pinRecoverySend: { kind: "fixed window", rate: 3, period: HOUR },
  pinRecoveryVerify: {
    kind: "token bucket",
    rate: 10,
    period: HOUR,
    capacity: 10,
  },
  // Changement de téléphone depuis une session authentifiée.
  phoneChangeSend: { kind: "fixed window", rate: 3, period: HOUR },
  phoneChangeVerify: {
    kind: "token bucket",
    rate: 10,
    period: HOUR,
    capacity: 10,
  },
  oauthToken: {
    kind: "token bucket",
    rate: 60,
    period: MINUTE,
    capacity: 60,
    shards: 4,
  },
  kycSubmit: { kind: "fixed window", rate: 3, period: HOUR },
  contactSubmit: { kind: "fixed window", rate: 5, period: HOUR },
  // iCarte (wallet) : create/update/remove/setFeatured/reorder — token bucket par user.
  walletWrite: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 30 },
  // iBoîte messages : envoi citoyen → admin. Token bucket par user.
  messageSend: { kind: "token bucket", rate: 30, period: HOUR, capacity: 30 },
  // iDocument : protection des uploads (signed URL) — par user.
  vaultUpload: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 30 },
  // iDocument : opérations sensibles sur les clés (activate / changePassword).
  vaultKeyOp: { kind: "fixed window", rate: 10, period: HOUR },
  // iCV : écritures CRUD (profile / sections / cvs.*).
  cvWrite: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 60 },
  // iCV : appels IA (5 features) — borne quotidienne généreuse.
  cvAi: { kind: "fixed window", rate: 10, period: HOUR * 24 },
  // iCV : import PDF/image — borne quotidienne (chaque appel Gemini coûte).
  // Le quota n'est consommé qu'après un appel IA réussi (cf. cv/import.ts) ;
  // les échecs (parse, réseau) ne pénalisent pas l'utilisateur.
  cvImport: { kind: "fixed window", rate: 20, period: HOUR * 24 },
  // iCV : export PDF serveur — cap quotidien (rendu @react-pdf coûteux).
  cvExport: { kind: "token bucket", rate: 30, period: HOUR * 24, capacity: 30 },
  // RGPD : export complet des données — 1 par 24h par utilisateur.
  dataExport: { kind: "fixed window", rate: 1, period: HOUR * 24 },
  // Présentation d'identité (mobile id-card) — le QR se renouvelle ~toutes
  // les 28 s côté UI, donc ~130 mints/h écran ouvert. Token bucket large
  // pour ne pas bloquer l'usage normal, garde-fou contre le scripting.
  presentationMint: {
    kind: "token bucket",
    rate: 30,
    period: MINUTE,
    capacity: 30,
  },
  // Vérification d'un token de présentation — contrôleur identité.
  // Un contrôleur peut enchaîner les contrôles : ceiling généreux.
  presentationVerify: {
    kind: "token bucket",
    rate: 60,
    period: MINUTE,
    capacity: 60,
  },
})
