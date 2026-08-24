import { createHmac, timingSafeEqual } from "node:crypto"
import { appendFile, mkdir, readFile } from "node:fs/promises"
import { createServer } from "node:http"

import { simpleParser } from "mailparser"
import nodemailer from "nodemailer"

const PORT = Number(process.env.PORT ?? 3000)
const DOMAIN = (process.env.MAIL_DOMAIN ?? "idn.ga").toLowerCase()
const BRIDGE_TOKEN = required("MAIL_BRIDGE_TOKEN")
const MTA_HOOK_TOKEN = required("MTA_HOOK_TOKEN")
const CONVEX_INBOUND_URL = required("CONVEX_INBOUND_URL")
const CONVEX_INBOUND_TOKEN = required("CONVEX_INBOUND_TOKEN")
const STALWART_URL = process.env.STALWART_URL ?? "http://stalwart:8080/jmap/"
const STALWART_ADMIN = process.env.STALWART_ADMIN ?? `admin@${DOMAIN}`
const STALWART_PASSWORD = required("STALWART_PASSWORD")
const MAILBOX_PASSWORD_KEY = required("MAILBOX_PASSWORD_KEY")
const DATA_DIR = process.env.DATA_DIR ?? "/data"
const MAX_BODY_BYTES = 25 * 1024 * 1024
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024
const MAX_ATTACHMENTS = 10

const smtpOptions = {
  host: process.env.SMTP_HOST ?? "stalwart",
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: true,
  tls: { rejectUnauthorized: false },
}

const sentIds = new Set()
const inFlightIds = new Set()
const sentLog = `${DATA_DIR}/sent-ids.log`

await mkdir(DATA_DIR, { recursive: true })
try {
  for (const line of (await readFile(sentLog, "utf8")).split("\n")) {
    if (line) sentIds.add(line)
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error
}

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" })
  res.end(JSON.stringify(body))
}

function authorized(req, token) {
  const actual = req.headers.authorization ?? ""
  const expected = `Bearer ${token}`
  const a = Buffer.from(actual)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("Payload too large"), { status: 413 })
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"))
}

function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Object.assign(new Error("Invalid email address"), { status: 400 })
  return email
}

function localMailbox(value) {
  const email = normalizeEmail(value)
  if (!email.endsWith(`@${DOMAIN}`)) throw Object.assign(new Error(`Mailbox must belong to ${DOMAIN}`), { status: 400 })
  return { email, name: email.slice(0, -(DOMAIN.length + 1)) }
}

function mailboxPassword(email) {
  return createHmac("sha256", MAILBOX_PASSWORD_KEY).update(`mailbox:${email}`).digest("base64url")
}

async function stalwartIsReachable() {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)
  try {
    const response = await fetch(new URL("/.well-known/jmap", STALWART_URL), {
      redirect: "manual",
      signal: controller.signal,
    })
    return response.status >= 200 && response.status < 400
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

async function stalwartCall(methodCalls) {
  const response = await fetch(STALWART_URL, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${STALWART_ADMIN}:${STALWART_PASSWORD}`).toString("base64")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ using: [
      "urn:ietf:params:jmap:core",
      "urn:stalwart:jmap",
    ], methodCalls }),
  })
  if (!response.ok) throw new Error(`Stalwart HTTP ${response.status}: ${await response.text()}`)
  const body = await response.json()
  const failure = body.methodResponses?.find(([name]) => name === "error")
  if (failure) throw new Error(`Stalwart JMAP error: ${JSON.stringify(failure[1])}`)
  return body.methodResponses
}

let principalAccountId
let domainId

async function loadManagementIds() {
  if (principalAccountId && domainId) return
  const sessionResponse = await fetch(new URL("/.well-known/jmap", STALWART_URL), {
    headers: { authorization: `Basic ${Buffer.from(`${STALWART_ADMIN}:${STALWART_PASSWORD}`).toString("base64")}` },
    redirect: "follow",
  })
  if (!sessionResponse.ok) throw new Error(`Unable to load Stalwart JMAP session (${sessionResponse.status})`)
  const session = await sessionResponse.json()
  principalAccountId =
    session.primaryAccounts?.["urn:stalwart:jmap"] ??
    session.primaryAccounts?.["urn:ietf:params:jmap:mail"] ??
    Object.keys(session.accounts ?? {})[0]
  if (!principalAccountId) throw new Error("Stalwart management account id missing")

  const responses = await stalwartCall([["x:Domain/query", { accountId: principalAccountId, filter: { name: DOMAIN }, limit: 2 }, "domain"]])
  const query = responses.find(([, , tag]) => tag === "domain")?.[1]
  if (!query?.ids?.length) throw new Error(`Stalwart domain ${DOMAIN} not found`)
  domainId = query.ids[0]
}

async function ensureMailboxNow(address, displayName) {
  const { email, name } = localMailbox(address)
  await loadManagementIds()

  const queryResponses = await stalwartCall([["x:Account/query", { accountId: principalAccountId, filter: { name }, limit: 2 }, "account"]])
  const existing = queryResponses.find(([, , tag]) => tag === "account")?.[1]?.ids ?? []
  if (existing.length > 0) {
    // Une boîte peut avoir été créée avec une ancienne clé HMAC ou depuis
    // l'interface Stalwart. Son existence ne garantit donc pas que le mot de
    // passe calculé par le bridge fonctionne encore pour la soumission SMTP.
    // On resynchronise les identifiants à chaque provisionnement, qui reste
    // idempotent côté Stalwart.
    const accountId = existing[0]
    const updateResponses = await stalwartCall([["x:Account/set", {
      accountId: principalAccountId,
      update: {
        [accountId]: {
          description: String(displayName ?? name).slice(0, 255),
          credentials: {
            0: {
              "@type": "Password",
              secret: mailboxPassword(email),
            },
          },
        },
      },
    }, "reconcile"]])
    const result = updateResponses.find(([, , tag]) => tag === "reconcile")?.[1]
    if (!Object.hasOwn(result?.updated ?? {}, accountId)) {
      throw new Error(`Mailbox credential reconciliation failed: ${JSON.stringify(result?.notUpdated?.[accountId] ?? result)}`)
    }
    return { email, id: accountId, created: false }
  }

  const createId = `mailbox-${name.replace(/[^a-z0-9._-]/g, "-")}`
  const responses = await stalwartCall([["x:Account/set", {
    accountId: principalAccountId,
    create: {
      [createId]: {
        "@type": "User",
        name,
        domainId,
        description: String(displayName ?? name).slice(0, 255),
        locale: "fr_FR",
        timeZone: "Africa/Libreville",
        credentials: { "0": { "@type": "Password", secret: mailboxPassword(email) } },
        memberGroupIds: {},
        roles: { "@type": "User" },
        permissions: { "@type": "Inherit" },
        quotas: {},
        aliases: {},
        encryptionAtRest: { "@type": "Disabled" },
      },
    },
  }, "create"]])
  const result = responses.find(([, , tag]) => tag === "create")?.[1]
  const created = result?.created?.[createId]
  if (!created?.id) throw new Error(`Mailbox creation failed: ${JSON.stringify(result?.notCreated?.[createId] ?? result)}`)
  return { email, id: created.id, created: true }
}

let provisioningQueue = Promise.resolve()

function ensureMailbox(address, displayName) {
  const job = provisioningQueue.then(() => ensureMailboxNow(address, displayName))
  provisioningQueue = job.catch(() => undefined)
  return job
}

async function renameMailboxNow(oldAddress, newAddress) {
  const oldMailbox = localMailbox(oldAddress)
  const newMailbox = localMailbox(newAddress)
  await loadManagementIds()

  const responses = await stalwartCall([
    [
      "x:Account/query",
      {
        accountId: principalAccountId,
        filter: { name: oldMailbox.name },
        limit: 2,
      },
      "old",
    ],
    [
      "x:Account/query",
      {
        accountId: principalAccountId,
        filter: { name: newMailbox.name },
        limit: 2,
      },
      "new",
    ],
  ])
  const oldIds = responses.find(([, , tag]) => tag === "old")?.[1]?.ids ?? []
  const newIds = responses.find(([, , tag]) => tag === "new")?.[1]?.ids ?? []

  if (newIds.length > 0) {
    if (oldIds.length > 0 && oldIds[0] !== newIds[0]) {
      throw Object.assign(new Error(`Target mailbox ${newMailbox.email} already exists`), { status: 409 })
    }
    return {
      oldEmail: oldMailbox.email,
      email: newMailbox.email,
      id: newIds[0],
      renamed: false,
    }
  }
  if (oldIds.length === 0) {
    const created = await ensureMailboxNow(newMailbox.email, newMailbox.name)
    return { oldEmail: oldMailbox.email, ...created, renamed: false }
  }

  const accountId = oldIds[0]
  const updateResponses = await stalwartCall([
    [
      "x:Account/set",
      {
        accountId: principalAccountId,
        update: {
          [accountId]: {
            name: newMailbox.name,
            credentials: {
              0: {
                "@type": "Password",
                secret: mailboxPassword(newMailbox.email),
              },
            },
          },
        },
      },
      "rename",
    ],
  ])
  const result = updateResponses.find(([, , tag]) => tag === "rename")?.[1]
  if (!Object.hasOwn(result?.updated ?? {}, accountId)) {
    throw new Error(`Mailbox rename failed: ${JSON.stringify(result?.notUpdated?.[accountId] ?? result)}`)
  }
  return {
    oldEmail: oldMailbox.email,
    email: newMailbox.email,
    id: accountId,
    renamed: true,
  }
}

function renameMailbox(oldAddress, newAddress) {
  const job = provisioningQueue.then(() => renameMailboxNow(oldAddress, newAddress))
  provisioningQueue = job.catch(() => undefined)
  return job
}

async function sendMail(payload) {
  const from = localMailbox(payload.from?.email ?? payload.from).email
  const to = normalizeEmail(payload.to?.email ?? payload.to)
  const idempotencyKey = String(payload.idempotencyKey ?? "").trim()
  if (!idempotencyKey || idempotencyKey.length > 255) throw Object.assign(new Error("Invalid idempotency key"), { status: 400 })
  if (sentIds.has(idempotencyKey)) return { duplicate: true, messageId: payload.messageId ?? null }
  if (inFlightIds.has(idempotencyKey)) throw Object.assign(new Error("Message is already being sent"), { status: 409 })

  const attachments = Array.isArray(payload.attachments) ? payload.attachments : []
  if (attachments.length > MAX_ATTACHMENTS) throw Object.assign(new Error("Too many attachments"), { status: 400 })
  for (const item of attachments) {
    if (Buffer.byteLength(item.contentBase64 ?? "", "base64") > MAX_ATTACHMENT_BYTES) throw Object.assign(new Error("Attachment too large"), { status: 400 })
  }

  await ensureMailbox(from, payload.from?.name)
  inFlightIds.add(idempotencyKey)
  const transport = nodemailer.createTransport({
    ...smtpOptions,
    auth: { user: from, pass: mailboxPassword(from) },
  })
  try {
    const info = await transport.sendMail({
      from: { name: String(payload.from?.name ?? "Identité Numérique"), address: from },
      to: { name: String(payload.to?.name ?? ""), address: to },
      subject: String(payload.subject ?? ""),
      text: payload.text ? String(payload.text) : undefined,
      html: payload.html ? String(payload.html) : undefined,
      messageId: payload.messageId ? String(payload.messageId) : undefined,
      inReplyTo: payload.inReplyTo ? String(payload.inReplyTo) : undefined,
      references: Array.isArray(payload.references) ? payload.references.map(String) : undefined,
      attachments: attachments.map((item) => ({
        filename: String(item.filename ?? "attachment"),
        content: Buffer.from(String(item.contentBase64 ?? ""), "base64"),
        contentType: String(item.contentType ?? "application/octet-stream"),
      })),
    })
    await appendFile(sentLog, `${idempotencyKey}\n`, { mode: 0o600 })
    sentIds.add(idempotencyKey)
    return { duplicate: false, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected }
  } finally {
    transport.close()
    inFlightIds.delete(idempotencyKey)
  }
}

function rebuildRawMessage(message) {
  const headers = [...(message.serverHeaders ?? []), ...(message.headers ?? [])]
  const serialized = headers.map(([rawName, rawValue]) => {
    const name = String(rawName).trim().replace(/:$/, "")
    const value = String(rawValue).replace(/(?:\r?\n)+$/, "")
    return `${name}:${/^[ \t]/.test(value) ? "" : " "}${value}`
  })
  return Buffer.from(`${serialized.join("\r\n")}\r\n\r\n${message.contents ?? ""}`)
}

async function forwardInbound(payload) {
  const stage = String(payload.context?.stage ?? "").toUpperCase()
  const serverPort = Number(payload.context?.server?.port)
  const authenticated = Boolean(payload.context?.sasl?.login)
  if (stage !== "DATA") return
  if (authenticated || serverPort !== 25) {
    console.log("Skipping non-inbound DATA hook", { authenticated, serverPort })
    return
  }

  const recipients = (payload.envelope?.to ?? []).map((item) => String(item?.address ?? "").toLowerCase()).filter((email) => email.endsWith(`@${DOMAIN}`))
  if (recipients.length === 0) {
    console.log("Skipping DATA hook without local recipients")
    return
  }

  const parsed = await simpleParser(rebuildRawMessage(payload.message ?? {}), { skipHtmlToText: false, skipTextToHtml: true })
  const attachments = (parsed.attachments ?? []).slice(0, MAX_ATTACHMENTS).map((item) => {
    if (item.size > MAX_ATTACHMENT_BYTES) throw new Error(`Inbound attachment ${item.filename ?? "attachment"} is too large`)
    return {
      filename: item.filename ?? "attachment",
      contentType: item.contentType ?? "application/octet-stream",
      size: item.size,
      contentBase64: item.content.toString("base64"),
    }
  })
  const messageId = parsed.messageId ?? `<stalwart-${payload.context?.queue?.id ?? Date.now()}@${DOMAIN}>`
  const response = await fetch(CONVEX_INBOUND_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${CONVEX_INBOUND_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({
      providerMessageId: messageId,
      envelopeFrom: String(payload.envelope?.from?.address ?? parsed.from?.value?.[0]?.address ?? ""),
      from: { name: parsed.from?.value?.[0]?.name ?? "", email: parsed.from?.value?.[0]?.address ?? String(payload.envelope?.from?.address ?? "") },
      recipients,
      subject: parsed.subject ?? "(Sans objet)",
      text: parsed.text ?? parsed.html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? "",
      html: parsed.html || undefined,
      inReplyTo: parsed.inReplyTo || undefined,
      references: parsed.references ?? [],
      date: parsed.date?.getTime() ?? Date.now(),
      attachments,
    }),
  })
  if (!response.ok) throw new Error(`Convex inbound failed (${response.status}): ${await response.text()}`)
  console.log("Inbound message forwarded", { messageId, recipientCount: recipients.length })
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`)
    if (req.method === "GET" && url.pathname === "/health") {
      const stalwart = await stalwartIsReachable()
      return json(res, stalwart ? 200 : 503, {
        ok: stalwart,
        domain: DOMAIN,
        stalwart,
      })
    }
    if (req.method === "POST" && url.pathname === "/provision") {
      if (!authorized(req, BRIDGE_TOKEN)) return json(res, 401, { error: "unauthorized" })
      const body = await readJson(req)
      return json(res, 200, await ensureMailbox(body.email, body.displayName))
    }
    if (req.method === "POST" && url.pathname === "/rename") {
      if (!authorized(req, BRIDGE_TOKEN)) return json(res, 401, { error: "unauthorized" })
      const body = await readJson(req)
      return json(res, 200, await renameMailbox(body.oldEmail, body.newEmail))
    }
    if (req.method === "POST" && url.pathname === "/send") {
      if (!authorized(req, BRIDGE_TOKEN)) return json(res, 401, { error: "unauthorized" })
      return json(res, 200, await sendMail(await readJson(req)))
    }
    if (req.method === "POST" && url.pathname === "/inbound") {
      if (!authorized(req, MTA_HOOK_TOKEN)) return json(res, 401, { error: "unauthorized" })
      await forwardInbound(await readJson(req))
      return json(res, 200, { action: "accept" })
    }
    return json(res, 404, { error: "not_found" })
  } catch (error) {
    console.error(error)
    return json(res, Number(error?.status ?? 500), { error: error instanceof Error ? error.message : "internal_error" })
  }
})

server.listen(PORT, "0.0.0.0", () => console.log(`IDN mail bridge listening on :${PORT}`))

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, async () => {
    server.close()
    process.exit(0)
  })
}
