import { Resend } from "@convex-dev/resend"
import { render } from "@react-email/render"
import type { GenericMutationCtx } from "convex/server"

import { components } from "../_generated/api"
import type { DataModel } from "../_generated/dataModel"
import { OtpEmail, getOtpSubject, type OtpType } from "./templates/otpEmail"

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

const FROM = "IDN <noreply@identite.ga>"

// `testMode` = true tant que le webhook secret + domaine Resend ne sont pas
// configurés. Les emails ne sortent pas pour de vrai mais sont quand même
// loggés en BD pour vérif manuelle pendant le dev.
const isTestMode = process.env.RESEND_WEBHOOK_SECRET === undefined

export const resend = new Resend(components.resend, {
  testMode: isTestMode,
})

type Ctx = GenericMutationCtx<DataModel>

export async function sendOtpEmail(
  ctx: Ctx,
  args: { to: string; code: string; type: OtpType },
) {
  const html = await render(<OtpEmail code={args.code} type={args.type} />)
  return await resend.sendEmail(ctx, {
    from: FROM,
    to: args.to,
    subject: getOtpSubject(args.type),
    html,
  })
}
