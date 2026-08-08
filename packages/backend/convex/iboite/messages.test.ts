/// <reference types="vite/client" />
import { ConvexError } from "convex/values"
import type { SchemaDefinition } from "convex/server"
import { convexTest } from "convex-test"
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test"
import { describe, expect, test, vi } from "vitest"

import { api, internal } from "../_generated/api"
import schema from "../schema"

// Cf. kyc/mutations.test.ts pour l'explication du glob root-relative.
const modules = import.meta.glob("/convex/**/*.ts")

type SchemaTables =
  typeof schema extends SchemaDefinition<infer S, boolean> ? S : never
type TestClient = ReturnType<typeof convexTest<SchemaTables>>

/** `send`/`generateUploadUrl` passent par `rateLimiter.limit(...)` (composant
 * `@convex-dev/rate-limiter`) — comme pour les aggregates dans
 * `kyc/mutations.test.ts`, le composant doit être enregistré explicitement
 * auprès de `convexTest`, sinon tout appel jette "Component ... is not
 * registered".
 */
function makeTestClient(): TestClient {
  const t = convexTest(schema, modules)
  registerRateLimiter(t)
  return t
}

/**
 * Les mutations/queries citoyen d'iBoîte s'authentifient via
 * `requireAuth` (convex/lib/auth.ts), qui délègue à
 * `authComponent.getAuthUser` (composant Better Auth : session + user
 * stockés dans son propre namespace). Reproduire une session Better Auth
 * valide dans `convex-test` demanderait de seeder les tables internes du
 * composant (hors de portée de ce test) — on isole donc la préoccupation
 * qu'on possède réellement ici : l'autorisation par ownership sur
 * `iboiteMessage` / `iboiteMessageAttachment`, pas le login Better Auth
 * lui-même (déjà couvert par les tests du composant tiers).
 *
 * On stub `requireAuth` pour qu'il dérive l'identité de
 * `ctx.auth.getUserIdentity()` (piloté par `t.withIdentity({ subject })`
 * dans convex-test) au lieu de la session Better Auth — chaque test choisit
 * ainsi précisément quel citoyen agit, ce qui est le seul levier dont on a
 * besoin pour vérifier les invariants d'authz de ce fichier.
 */
vi.mock("../lib/auth", async () => {
  const { ConvexError: CE } = await import("convex/values")
  return {
    requireAuth: async (ctx: {
      auth: {
        getUserIdentity: () => Promise<{
          subject: string
          email?: string
        } | null>
      }
    }) => {
      const identity = await ctx.auth.getUserIdentity()
      if (!identity) {
        throw new CE({
          code: "UNAUTHENTICATED",
          message: "Vous devez être connecté.",
        })
      }
      return {
        userId: identity.subject,
        email: identity.email ?? "",
        emailVerified: true,
        roles: [],
      }
    },
  }
})

vi.mock("../auth", () => ({
  authComponent: {
    getAnyUserById: async (_ctx: unknown, userId: string) => ({
      name: `Citoyen ${userId}`,
      email: `${userId}@example.com`,
    }),
  },
}))

async function seedAccount(t: TestClient, userId: string, handle: string) {
  await t.mutation(internal.iboite.accounts.ensurePersonal, {
    userId,
    idnHandle: handle,
    firstName: handle,
    lastName: "Test",
  })
  const account = await t.run(async (ctx) => {
    return await ctx.db
      .query("iboiteAccount")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
  })
  if (!account)
    throw new Error("seedAccount: compte introuvable après ensurePersonal")
  return account
}

const ATTACHMENT = {
  name: "piece.pdf",
  size: 1234,
  mimeType: "application/pdf",
}

async function seedStorageRef(t: TestClient) {
  return await t.run(async (ctx) => {
    return await ctx.storage.store(new Blob(["contenu de test"]))
  })
}

describe("messages.send — pièces jointes", () => {
  test("PJ jointe visible par l'expéditeur ET le destinataire (hasAttachment dérivé, pas passé par le client)", async () => {
    const t = makeTestClient()
    const sender = await seedAccount(t, "user_sender", "sender")
    await seedAccount(t, "user_recipient", "recipient")
    const storageRef = await seedStorageRef(t)

    const asSender = t.withIdentity({ subject: "user_sender" })
    const sentId = await asSender.mutation(api.iboite.messages.send, {
      accountId: sender._id,
      recipientName: "Recipient",
      recipientEmail: "recipient@idn.ga",
      subject: "Objet test",
      body: "Corps du message",
      attachments: [{ ...ATTACHMENT, storageRef }],
    })

    // Côté expéditeur : hasAttachment=true + PJ visible dans get().
    const sentDetail = await asSender.query(api.iboite.messages.get, {
      messageId: sentId,
    })
    expect(sentDetail?.hasAttachment).toBe(true)
    expect(sentDetail?.attachments).toHaveLength(1)
    expect(sentDetail?.attachments[0]).toMatchObject({
      name: ATTACHMENT.name,
      size: ATTACHMENT.size,
      mimeType: ATTACHMENT.mimeType,
    })

    // Côté destinataire : copie inbox distincte, PJ dupliquée (même storageRef).
    const asRecipient = t.withIdentity({ subject: "user_recipient" })
    const inboxPage = await asRecipient.query(
      api.iboite.messages.listByFolder,
      {
        accountId: (await t.run(async (ctx) =>
          ctx.db
            .query("iboiteAccount")
            .withIndex("by_userId", (q) => q.eq("userId", "user_recipient"))
            .unique(),
        ))!._id,
        folder: "inbox",
        paginationOpts: { numItems: 10, cursor: null },
      },
    )
    expect(inboxPage.page).toHaveLength(1)
    expect(inboxPage.page[0].hasAttachment).toBe(true)

    const inboxDetail = await asRecipient.query(api.iboite.messages.get, {
      messageId: inboxPage.page[0]._id,
    })
    expect(inboxDetail?.attachments).toHaveLength(1)
    expect(inboxDetail?.attachments[0].name).toBe(ATTACHMENT.name)

    // `attachmentUrl` résout bien une URL pour le propriétaire légitime,
    // aussi bien côté expéditeur que côté destinataire (rows distinctes,
    // storageRef partagé).
    const senderAttachmentUrl = await asSender.query(
      api.iboite.messages.attachmentUrl,
      { attachmentId: sentDetail!.attachments[0]._id },
    )
    expect(senderAttachmentUrl).toBeTruthy()

    const recipientAttachmentUrl = await asRecipient.query(
      api.iboite.messages.attachmentUrl,
      { attachmentId: inboxDetail!.attachments[0]._id },
    )
    expect(recipientAttachmentUrl).toBeTruthy()
  })

  test("hasAttachment reste false quand aucune PJ n'est fournie, même si le client tente de le forcer", async () => {
    const t = makeTestClient()
    const sender = await seedAccount(t, "user_sender2", "sender2")
    await seedAccount(t, "user_recipient2", "recipient2")

    const asSender = t.withIdentity({ subject: "user_sender2" })
    const sentId = await asSender.mutation(api.iboite.messages.send, {
      accountId: sender._id,
      recipientName: "Recipient",
      recipientEmail: "recipient2@idn.ga",
      subject: "Sans PJ",
      body: "Corps",
      // Pas de champ `attachments` dans l'arg validator : impossible pour le
      // client de faire passer `hasAttachment` directement (invariant
      // vérifié structurellement — l'arg n'existe plus dans le validator).
    })

    const detail = await asSender.query(api.iboite.messages.get, {
      messageId: sentId,
    })
    expect(detail?.hasAttachment).toBe(false)
    expect(detail?.attachments).toHaveLength(0)
  })

  test("un tiers ne peut pas lire les PJ d'un message qui ne lui appartient pas", async () => {
    const t = makeTestClient()
    const sender = await seedAccount(t, "user_sender3", "sender3")
    await seedAccount(t, "user_recipient3", "recipient3")
    await seedAccount(t, "user_outsider3", "outsider3")
    const storageRef = await seedStorageRef(t)

    const asSender = t.withIdentity({ subject: "user_sender3" })
    const sentId = await asSender.mutation(api.iboite.messages.send, {
      accountId: sender._id,
      recipientName: "Recipient",
      recipientEmail: "recipient3@idn.ga",
      subject: "Confidentiel",
      body: "Corps",
      attachments: [{ ...ATTACHMENT, storageRef }],
    })
    const sentDetail = await asSender.query(api.iboite.messages.get, {
      messageId: sentId,
    })
    const attachmentId = sentDetail!.attachments[0]._id

    // Le tiers ne peut ni lire le message (get → null) ni résoudre l'URL de
    // la PJ (attachmentUrl → null) — ownership check strict, pas de fuite
    // cross-user.
    const asOutsider = t.withIdentity({ subject: "user_outsider3" })
    const outsiderMessageView = await asOutsider.query(
      api.iboite.messages.get,
      {
        messageId: sentId,
      },
    )
    expect(outsiderMessageView).toBeNull()

    const outsiderAttachmentUrl = await asOutsider.query(
      api.iboite.messages.attachmentUrl,
      { attachmentId },
    )
    expect(outsiderAttachmentUrl).toBeNull()

    // Un tiers non authentifié se fait rejeter explicitement (ConvexError),
    // pas seulement filtrer silencieusement.
    await expect(
      t.query(api.iboite.messages.attachmentUrl, { attachmentId }),
    ).rejects.toThrow(ConvexError)
  })

  test("plusieurs pièces jointes sont toutes dupliquées sur les deux copies", async () => {
    const t = makeTestClient()
    const sender = await seedAccount(t, "user_sender4", "sender4")
    await seedAccount(t, "user_recipient4", "recipient4")
    const ref1 = await seedStorageRef(t)
    const ref2 = await seedStorageRef(t)

    const asSender = t.withIdentity({ subject: "user_sender4" })
    const sentId = await asSender.mutation(api.iboite.messages.send, {
      accountId: sender._id,
      recipientName: "Recipient",
      recipientEmail: "recipient4@idn.ga",
      subject: "Deux PJ",
      body: "Corps",
      attachments: [
        {
          name: "a.pdf",
          size: 10,
          mimeType: "application/pdf",
          storageRef: ref1,
        },
        { name: "b.png", size: 20, mimeType: "image/png", storageRef: ref2 },
      ],
    })

    const detail = await asSender.query(api.iboite.messages.get, {
      messageId: sentId,
    })
    expect(detail?.attachments).toHaveLength(2)
    expect(detail?.attachments.map((a) => a.name).sort()).toEqual([
      "a.pdf",
      "b.png",
    ])
  })

  test("plus de 10 pièces jointes → rejeté, aucune ligne insérée (le rate-limit ne borne que les messages, pas les PJ)", async () => {
    const t = makeTestClient()
    const sender = await seedAccount(t, "user_sender5", "sender5")
    await seedAccount(t, "user_recipient5", "recipient5")
    const refs = await Promise.all(
      Array.from({ length: 11 }, () => seedStorageRef(t)),
    )

    const asSender = t.withIdentity({ subject: "user_sender5" })
    await expect(
      asSender.mutation(api.iboite.messages.send, {
        accountId: sender._id,
        recipientName: "Recipient",
        recipientEmail: "recipient5@idn.ga",
        subject: "Trop de PJ",
        body: "Corps",
        attachments: refs.map((storageRef, i) => ({
          name: `file-${i}.pdf`,
          size: 10,
          mimeType: "application/pdf",
          storageRef,
        })),
      }),
    ).rejects.toThrow(ConvexError)

    // Aucun message n'a été créé (échec avant tout insert) — pas de fuite
    // partielle côté expéditeur ni destinataire.
    const sentMessages = await t.run(async (ctx) =>
      ctx.db
        .query("iboiteMessage")
        .withIndex("by_account_folder", (q) =>
          q.eq("accountId", sender._id).eq("folder", "sent"),
        )
        .collect(),
    )
    expect(sentMessages).toHaveLength(0)
  })
})

describe("messages.send — transport SMTP externe", () => {
  test("une adresse externe crée une seule copie envoyée et planifie sa livraison", async () => {
    const t = makeTestClient()
    const sender = await seedAccount(t, "user_external", "external-sender")
    const asSender = t.withIdentity({ subject: "user_external" })

    const sentId = await asSender.mutation(api.iboite.messages.send, {
      accountId: sender._id,
      recipientName: "Alice Externe",
      recipientEmail: "alice@example.net",
      subject: "Message vers Internet",
      body: "Ce message doit être remis à Stalwart.",
    })

    const rows = await t.run(async (ctx) =>
      ctx.db.query("iboiteMessage").collect(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      _id: sentId,
      folder: "sent",
      transport: "smtp",
      deliveryStatus: "queued",
      recipientEmail: "alice@example.net",
    })
  })

  test("une adresse externe syntaxiquement invalide est rejetée", async () => {
    const t = makeTestClient()
    const sender = await seedAccount(
      t,
      "user_invalid_external",
      "invalid-sender",
    )
    const asSender = t.withIdentity({ subject: "user_invalid_external" })

    await expect(
      asSender.mutation(api.iboite.messages.send, {
        accountId: sender._id,
        recipientName: "Invalide",
        recipientEmail: "pas une adresse@",
        subject: "Objet",
        body: "Corps",
      }),
    ).rejects.toThrow(ConvexError)
  })
})

describe("réception SMTP", () => {
  test("l'idempotence Message-ID + destinataire empêche les doublons", async () => {
    const t = makeTestClient()
    const recipient = await seedAccount(t, "user_inbound", "inbound")
    const input = {
      providerMessageId: "<external-123@example.net>",
      fromName: "Alice Externe",
      fromEmail: "alice@example.net",
      recipientEmail: recipient.emailAlias,
      subject: "Bonjour",
      body: "Un vrai email entrant.",
      receivedAt: Date.now(),
      attachments: [],
    }

    const first = await t.mutation(
      internal.iboite.mailInternal.persistInbound,
      input,
    )
    const second = await t.mutation(
      internal.iboite.mailInternal.persistInbound,
      input,
    )

    expect(second).toBe(first)
    const inbox = await t.run(async (ctx) =>
      ctx.db
        .query("iboiteMessage")
        .withIndex("by_account_folder", (q) =>
          q.eq("accountId", recipient._id).eq("folder", "inbox"),
        )
        .collect(),
    )
    expect(inbox).toHaveLength(1)
    expect(inbox[0]).toMatchObject({
      transport: "smtp",
      senderEmail: "alice@example.net",
    })
  })
})
