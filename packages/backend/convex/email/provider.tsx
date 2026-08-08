"use node"

import { render } from "@react-email/render"

import { sendThroughBridge } from "../iboite/mailActions"
import { GenericEmail } from "./templates/genericEmail"
import {
  KycEmail,
  getKycEmailSubject,
  type KycEmailKind,
} from "./templates/kycEmail"
import { OtpEmail, getOtpSubject, type OtpType } from "./templates/otpEmail"

const FROM_EMAIL = process.env.MAIL_FROM ?? "notifications@idn.ga"
const FROM_NAME = "Identité Numérique"

async function deliver(args: {
  to: string
  subject: string
  html: string
  text: string
}) {
  return await sendThroughBridge({
    idempotencyKey: `transactional:${crypto.randomUUID()}`,
    messageId: `<transactional-${crypto.randomUUID()}@idn.ga>`,
    from: { name: FROM_NAME, email: FROM_EMAIL },
    to: { email: args.to },
    subject: args.subject,
    html: args.html,
    text: args.text,
  })
}

export async function sendOtpEmail(args: {
  to: string
  code: string
  type: OtpType
}) {
  const subject = getOtpSubject(args.type)
  const html = await render(<OtpEmail code={args.code} type={args.type} />)
  return await deliver({
    to: args.to,
    subject,
    html,
    text: `${subject}\n\nVotre code : ${args.code}\n\nCe code est personnel et temporaire.`,
  })
}

export async function sendGenericEmail(args: {
  to: string
  subject: string
  title: string
  body: string
  recipientName?: string | null
}) {
  const html = await render(
    <GenericEmail
      title={args.title}
      body={args.body}
      recipientName={args.recipientName ?? null}
    />,
  )
  return await deliver({
    to: args.to,
    subject: args.subject,
    html,
    text: `${args.title}\n\n${args.body}`,
  })
}

export async function sendKycEmail(args: {
  to: string
  kind: KycEmailKind
  recipientName?: string | null
  detail?: string | null
}) {
  const subject = getKycEmailSubject(args.kind)
  const html = await render(
    <KycEmail
      kind={args.kind}
      recipientName={args.recipientName ?? null}
      detail={args.detail ?? null}
    />,
  )
  return await deliver({
    to: args.to,
    subject,
    html,
    text: `${subject}${args.detail ? `\n\n${args.detail}` : ""}`,
  })
}
