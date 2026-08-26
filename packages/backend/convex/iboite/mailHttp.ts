import { internal } from "../_generated/api"
import { httpAction } from "../_generated/server"

const MAX_ATTACHMENTS = 10
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

function tokenMatches(actual: string | null, secret: string) {
  const expected = `Bearer ${secret}`
  if (!actual || actual.length !== expected.length) return false
  let diff = 0
  for (let index = 0; index < expected.length; index += 1) {
    diff |= actual.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return diff === 0
}

function decodeBase64(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export const inbound = httpAction(async (ctx, request) => {
  const secret = process.env.MAIL_INBOUND_TOKEN
  if (!secret || !tokenMatches(request.headers.get("authorization"), secret)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  }

  const providerMessageId = String(body.providerMessageId ?? "").slice(0, 1000)
  const recipients = Array.isArray(body.recipients)
    ? body.recipients
        .map((email: unknown) => String(email).trim().toLowerCase())
        .filter((email: string) => email.endsWith("@idn.ga"))
        .slice(0, 50)
    : []
  if (!providerMessageId || recipients.length === 0) {
    return new Response(JSON.stringify({ error: "missing_fields" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  }

  const knownRecipients = await ctx.runQuery(
    internal.iboite.mailInternal.resolveInboundRecipients,
    { emails: recipients, providerMessageId },
  )
  if (knownRecipients.length === 0) {
    return new Response(
      JSON.stringify({ accepted: 0, ignored: recipients.length }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    )
  }

  const inputAttachments = Array.isArray(body.attachments)
    ? body.attachments.slice(0, MAX_ATTACHMENTS)
    : []
  const attachments = []
  try {
    for (const input of inputAttachments) {
      const bytes = decodeBase64(String(input.contentBase64 ?? ""))
      if (bytes.byteLength > MAX_ATTACHMENT_BYTES) {
        throw new Error("attachment_too_large")
      }
      const mimeType = String(
        input.contentType ?? "application/octet-stream",
      ).slice(0, 255)
      const storageRef = await ctx.storage.store(
        new Blob([bytes], { type: mimeType }),
      )
      attachments.push({
        name: String(input.filename ?? "attachment").slice(0, 255),
        size: bytes.byteLength,
        mimeType,
        storageRef,
      })
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "invalid_attachment",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    )
  }

  const fromEmail = String(body.from?.email ?? body.envelopeFrom ?? "")
    .trim()
    .toLowerCase()
  const fromName = String(body.from?.name ?? "").slice(0, 255)
  let accepted = 0
  for (const recipientEmail of knownRecipients) {
    const messageId = await ctx.runMutation(
      internal.iboite.mailInternal.persistInbound,
      {
        providerMessageId,
        fromName,
        fromEmail,
        recipientEmail,
        subject: String(body.subject ?? "(Sans objet)").slice(0, 998),
        body: String(body.text ?? "").slice(0, 5_000_000),
        bodyHtml: body.html ? String(body.html).slice(0, 500_000) : undefined,
        inReplyTo: body.inReplyTo
          ? String(body.inReplyTo).slice(0, 1000)
          : undefined,
        receivedAt:
          Number.isFinite(Number(body.date)) && Number(body.date) > 0
            ? Number(body.date)
            : Date.now(),
        attachments,
      },
    )
    if (messageId) accepted += 1
  }

  return new Response(JSON.stringify({ accepted }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
})
