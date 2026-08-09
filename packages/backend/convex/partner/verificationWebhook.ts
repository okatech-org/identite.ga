import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { signWebhookPayload } from "./webhookSignature";

/**
 * Notification sortante vers l'application partenaire (administration.ga).
 *
 * La réplique côté partenaire est alimentée en PUSH : à chaque changement
 * d'état d'une demande, on lui envoie l'état courant. Le pull
 * (`GET /api/partner/verifications?updatedSince=`) reste le filet de
 * réparation — un webhook peut échouer, le réseau tomber, le partenaire être
 * en cours de déploiement.
 *
 * ⚠️ On envoie l'ÉTAT COURANT, pas un delta. Un delta suppose que le
 * destinataire a bien reçu tous les précédents dans l'ordre ; aucune de ces
 * deux hypothèses ne tient sur un webhook HTTP. Avec l'état complet et son
 * `updatedAt`, un message en retard est simplement ignoré par le partenaire.
 *
 * Aucune PIÈCE n'est poussée ici — ni image, ni URL de média. Le partenaire
 * les demande explicitement, avec le scope `idn:verification:media`, quand un
 * agent ouvre le dossier. Une image dans un webhook finirait dans des logs.
 */

const ENDPOINT_ENV = "IDN_PARTNER_WEBHOOK_URL";
const SECRET_ENV = "IDN_PARTNER_WEBHOOK_SECRET";

export const notify = internalAction({
  args: {
    verificationId: v.id("level3Verification"),
    event: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const endpoint = process.env[ENDPOINT_ENV]?.trim();
    const secret = process.env[SECRET_ENV]?.trim();
    // Déploiement sans partenaire configuré : rien à faire, et surtout pas
    // d'erreur — le trigger se déclenche sur toutes les écritures, y compris
    // en développement local et dans les tests.
    if (!endpoint || !secret) return null;

    const item = await ctx.runQuery(
      internal.partner.verifications.getForWebhook,
      { verificationId: args.verificationId },
    );
    if (!item) return null;

    const body = JSON.stringify({
      event: args.event,
      emittedAt: Date.now(),
      verification: item,
    });
    const signature = await signWebhookPayload(secret, body);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Le partenaire DOIT vérifier cette signature : sans elle, son
          // endpoint accepterait l'état d'identité de n'importe qui sachant
          // son URL.
          "X-IDN-Signature": signature,
          "X-IDN-Event": args.event,
        },
        body,
      });
      if (!response.ok) {
        console.error(
          `[partner/webhook] ${args.event} ${args.verificationId} → HTTP ${response.status}`,
        );
      }
    } catch (error) {
      // On n'échoue JAMAIS la chaîne appelante : le webhook est un raccourci
      // de latence, pas la source de vérité. Le partenaire se répare par
      // `updatedSince`. Faire remonter l'erreur ferait échouer la mutation
      // citoyenne qui l'a déclenchée — un partenaire injoignable empêcherait
      // alors les Gabonais de demander leur vérification.
      console.error(
        `[partner/webhook] ${args.event} ${args.verificationId} injoignable :`,
        error,
      );
    }
    return null;
  },
});
