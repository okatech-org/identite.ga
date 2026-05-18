import { Resend } from "@convex-dev/resend";
import { render } from "@react-email/render";
import type { GenericMutationCtx } from "convex/server";

import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";
import { GenericEmail } from "./templates/genericEmail";
import {
  KycEmail,
  getKycEmailSubject,
  type KycEmailKind,
} from "./templates/kycEmail";
import { OtpEmail, getOtpSubject, type OtpType } from "./templates/otpEmail";

/**
 * Couche email IDN — abstraction au-dessus de @convex-dev/resend.
 *
 * Resend gère :
 *   • file durable d'envoi
 *   • idempotency keys
 *   • batching de l'API Resend
 *   • rate limiting / retries
 *   • webhooks delivery / bounce / complaint persistés
 *
 * Phase 2 : on remplacera l'implémentation par AWS SES ou SMTP local
 * sans toucher aux call-sites — c'est tout l'intérêt d'une abstraction.
 */

const FROM = process.env.RESEND_FROM ?? "Identite.ga <updates@identite.ga>";

// `testMode` = true tant que le webhook secret + domaine Resend ne sont pas
// configurés. Les emails ne sortent pas pour de vrai mais sont quand même
// loggés en BD pour vérif manuelle pendant le dev.
const isTestMode = process.env.RESEND_WEBHOOK_SECRET === undefined;

export const resend = new Resend(components.resend, {
  testMode: isTestMode,
});

type Ctx = GenericMutationCtx<DataModel>;

export async function sendOtpEmail(
  ctx: Ctx,
  args: { to: string; code: string; type: OtpType },
) {
  // Log dev-only : facilite l'E2E sans avoir à ouvrir la boîte mail.
  // (S'affiche dans `bunx convex logs`. À retirer / gater par env var
  // dédiée avant la mise en production.)
  console.log(`[idn:dev] OTP ${args.type} pour ${args.to} = ${args.code}`);

  const html = await render(<OtpEmail code={args.code} type={args.type} />);
  return await resend.sendEmail(ctx, {
    from: FROM,
    to: args.to,
    subject: getOtpSubject(args.type),
    html,
  });
}

export async function sendGenericEmail(
  ctx: Ctx,
  args: {
    to: string;
    subject: string;
    title: string;
    body: string;
    recipientName?: string | null;
  },
) {
  console.log(
    `[idn:dev] generic email → ${args.to} · ${args.subject.slice(0, 60)}`,
  );
  const html = await render(
    <GenericEmail
      title={args.title}
      body={args.body}
      recipientName={args.recipientName ?? null}
    />,
  );
  return await resend.sendEmail(ctx, {
    from: FROM,
    to: args.to,
    subject: args.subject,
    html,
  });
}

export async function sendKycEmail(
  ctx: Ctx,
  args: {
    to: string;
    kind: KycEmailKind;
    recipientName?: string | null;
    /** Message contrôleur (`complement_requested`) ou motif (`rejected`). */
    detail?: string | null;
  },
) {
  console.log(
    `[idn:dev] KYC notif ${args.kind} → ${args.to}` +
      (args.detail ? ` · ${args.detail.slice(0, 60)}…` : ""),
  );

  const html = await render(
    <KycEmail
      kind={args.kind}
      recipientName={args.recipientName ?? null}
      detail={args.detail ?? null}
    />,
  );
  return await resend.sendEmail(ctx, {
    from: FROM,
    to: args.to,
    subject: getKycEmailSubject(args.kind),
    html,
  });
}
