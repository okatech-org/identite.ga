/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { register as registerAggregate } from "@convex-dev/aggregate/test"
import { describe, expect, test } from "vitest"

import { internal } from "../_generated/api"
import schema from "../schema"

// Glob root-relative (leading "/") : depuis un fichier nesté dans convex/kyc/,
// "../**/*.ts" produit des clés incohérentes (Vite raccourcit les chemins
// vers des fichiers du même dossier en "./x.ts" au lieu de "../kyc/x.ts"),
// ce qui casse la détection du préfixe de convex-test (basée sur
// "_generated"). "/convex/**/*.ts" est résolu relativement à la racine du
// projet Vite et reste stable quel que soit l'emplacement du fichier de test.
const modules = import.meta.glob("/convex/**/*.ts")

/**
 * `approveAuto` / `enqueueForReview` / `rejectAuto` sont les 3 mutations
 * terminales du workflow KYC L2 (`kyc/workflow.ts`), pilotées par les
 * résultats du microservice d'inférence auto-hébergé (`kyc/actions.ts`).
 * Un step de workflow peut être rejoué (retry réseau, redémarrage) — seule
 * l'idempotence sur les états terminaux (`approved`/`rejected`) empêche
 * qu'un rejeu ne ré-écrive une décision déjà prise.
 *
 * Ces mutations passent par les mutations "trigger-aware" de
 * `convex/functions.ts` (patch kycRequest / userProfile), qui maintiennent
 * les agrégats `kycByStatus` / `usersByLoa` / `usersByProfile` — ces
 * components doivent donc être enregistrés auprès de `convexTest`, sinon
 * tout patch déclenche "Component ... is not registered".
 */
function makeTestClient() {
  const t = convexTest(schema, modules)
  registerAggregate(t, "kycByStatus")
  registerAggregate(t, "usersByLoa")
  registerAggregate(t, "usersByProfile")
  return t
}

async function seedKyc(
  t: ReturnType<typeof convexTest>,
  userId: string,
  status: "submitted" | "under_review" | "approved" | "rejected" = "submitted",
) {
  const now = Date.now()
  return await t.run(async (ctx) => {
    const kycRequestId = await ctx.db.insert("kycRequest", {
      userId,
      documentType: "cni_gabon",
      documentImages: { front: undefined },
      status,
      createdAt: now,
      updatedAt: now,
    })
    await ctx.db.insert("userProfile", {
      userId,
      profileType: "citizen",
      loa: 1,
      createdAt: now,
      updatedAt: now,
    } as any)
    // Coupe le canal email (évite un appel au composant Better Auth dans
    // ces tests) tout en gardant l'in-app pour vérifier le dispatch.
    await ctx.db.insert("notificationPreference", {
      userId,
      email: { security: true, kyc: false, consent: true, comms: true },
      inApp: { security: true, kyc: true, consent: true, comms: true },
      updatedAt: now,
    } as any)
    return kycRequestId
  })
}

describe("approveAuto", () => {
  test("approuve + upgrade LoA 1 → 2 + audit kyc_approved", async () => {
    const t = makeTestClient()
    const userId = "user_approved"
    const kycRequestId = await seedKyc(t, userId)

    await t.mutation(internal.kyc.mutations.approveAuto, {
      kycRequestId,
      score: 0.97,
      faceMatchScore: 0.9,
    })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("approved")
    expect(kyc?.score).toBe(0.97)
    expect(kyc?.faceMatchScore).toBe(0.9)
    expect(kyc?.reviewedAt).toBeDefined()

    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique(),
    )
    expect(profile?.loa).toBe(2)

    const audit = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_target", (q) =>
          q.eq("targetType", "kyc").eq("targetId", kycRequestId),
        )
        .collect(),
    )
    expect(audit.some((e) => e.action === "kyc_approved")).toBe(true)

    const notifications = await t.run(async (ctx) =>
      ctx.db
        .query("notification")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    )
    expect(notifications.some((n) => n.title.includes("validée"))).toBe(true)
  })

  test("idempotent : une demande déjà rejected (rejet humain) n'est JAMAIS ré-approuvée — ferme le contournement du rejet contrôleur", async () => {
    // Régression de sécurité : sans cette garde, un rejeu du step
    // `approveAuto` (ou, combiné à l'absence de garde côté `kyc.submit`, un
    // citoyen re-soumettant après un rejet humain pour fraude) pouvait faire
    // remonter `approved` + LoA 2 et écraser silencieusement une décision de
    // rejet déjà prise, sans nouvelle revue.
    const t = makeTestClient()
    const userId = "user_already_rejected"
    const kycRequestId = await seedKyc(t, userId, "rejected")
    await t.run(async (ctx) =>
      ctx.db.patch(kycRequestId, { rejectionReason: "Fraude constatée" }),
    )

    await t.mutation(internal.kyc.mutations.approveAuto, {
      kycRequestId,
      score: 0.99,
      faceMatchScore: 0.99,
    })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("rejected")
    expect(kyc?.rejectionReason).toBe("Fraude constatée")

    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique(),
    )
    expect(profile?.loa).toBe(1)

    const audit = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_target", (q) =>
          q.eq("targetType", "kyc").eq("targetId", kycRequestId),
        )
        .collect(),
    )
    expect(audit.some((e) => e.action === "kyc_approved")).toBe(false)
  })

  test("idempotent : une demande déjà approved n'est pas re-patchée (pas de doublon d'audit)", async () => {
    const t = makeTestClient()
    const userId = "user_already_approved"
    const kycRequestId = await seedKyc(t, userId, "approved")
    await t.run(async (ctx) =>
      ctx.db.patch(kycRequestId, { score: 0.91, faceMatchScore: 0.7 }),
    )

    await t.mutation(internal.kyc.mutations.approveAuto, {
      kycRequestId,
      score: 0.5, // score dégradé d'un rejeu — ne doit jamais écraser l'original
      faceMatchScore: 0.5,
    })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.score).toBe(0.91)
    expect(kyc?.faceMatchScore).toBe(0.7)

    const audit = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_target", (q) =>
          q.eq("targetType", "kyc").eq("targetId", kycRequestId),
        )
        .collect(),
    )
    expect(audit.filter((e) => e.action === "kyc_approved")).toHaveLength(0)
  })
})

describe("enqueueForReview", () => {
  test("passe under_review, scores enregistrés, LoA NON modifié", async () => {
    const t = makeTestClient()
    const userId = "user_review"
    const kycRequestId = await seedKyc(t, userId)

    await t.mutation(internal.kyc.mutations.enqueueForReview, {
      kycRequestId,
      score: 0.8,
      faceMatchScore: 0.5,
      livenessVerdict: "uncertain",
      ocrAvailable: true,
      biometricAvailable: true,
    })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("under_review")
    expect(kyc?.score).toBe(0.8)
    expect(kyc?.faceMatchScore).toBe(0.5)
    expect(kyc?.livenessVerdict).toBe("uncertain")
    expect(kyc?.ocrAvailable).toBe(true)
    expect(kyc?.biometricAvailable).toBe(true)

    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique(),
    )
    expect(profile?.loa).toBe(1)

    const audit = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_target", (q) =>
          q.eq("targetType", "kyc").eq("targetId", kycRequestId),
        )
        .collect(),
    )
    expect(audit.some((e) => e.action === "kyc_under_review")).toBe(true)
  })

  /**
   * La revue manuelle peut durer des jours. Sans notification, le citoyen n'a
   * aucun moyen de distinguer "en cours d'examen" de "perdu" — et c'est le
   * chemin par défaut tant que l'OCR CNI n'est pas calibré. Ce test échoue si
   * on retire le dispatch ou si le kind repasse à un libellé non prévu.
   */
  test("notifie le citoyen que son dossier part en revue manuelle", async () => {
    const t = makeTestClient()
    const userId = "user_review_notif"
    const kycRequestId = await seedKyc(t, userId)

    await t.mutation(internal.kyc.mutations.enqueueForReview, {
      kycRequestId,
      score: 0.8,
      faceMatchScore: 0.5,
      livenessVerdict: "uncertain",
      ocrAvailable: false,
      biometricAvailable: false,
    })

    const notifs = await t.run(async (ctx) =>
      ctx.db
        .query("notification")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    )
    const review = notifs.find(
      (n) => (n.metadata as { kind?: string } | undefined)?.kind === "under_review",
    )
    expect(review).toBeDefined()
    expect(review?.category).toBe("kyc")
    expect(review?.channel).toBe("in_app")
    // Le corps doit dire au citoyen qu'il n'a rien à faire : sinon il ré-uploade
    // ses pièces et re-remplit la file d'attente qu'on essaie de désengorger.
    expect(review?.body).toMatch(/aucune action/i)
  })
})

describe("rejectAuto", () => {
  test("rejette + rejectionReason + audit kyc_rejected + notification, LoA NON modifié", async () => {
    const t = makeTestClient()
    const userId = "user_rejected"
    const kycRequestId = await seedKyc(t, userId)

    await t.mutation(internal.kyc.mutations.rejectAuto, {
      kycRequestId,
      rejectionReason: "Détection anti-usurpation",
    })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("rejected")
    expect(kyc?.rejectionReason).toBe("Détection anti-usurpation")
    expect(kyc?.reviewedAt).toBeDefined()

    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique(),
    )
    // Un rejet ne doit jamais upgrader le LoA — invariant de sécurité.
    expect(profile?.loa).toBe(1)

    const audit = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_target", (q) =>
          q.eq("targetType", "kyc").eq("targetId", kycRequestId),
        )
        .collect(),
    )
    expect(audit.some((e) => e.action === "kyc_rejected")).toBe(true)

    const notifications = await t.run(async (ctx) =>
      ctx.db
        .query("notification")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    )
    expect(notifications.some((n) => n.title.includes("refusée"))).toBe(true)
  })

  test("idempotent : une demande déjà approved n'est jamais rétrogradée en rejected", async () => {
    const t = makeTestClient()
    const userId = "user_already_approved"
    const kycRequestId = await seedKyc(t, userId, "approved")
    // LoA déjà monté à 2 par la précédente approbation (simulé ici).
    await t.run(async (ctx) => {
      const profile = await ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique()
      if (profile) await ctx.db.patch(profile._id, { loa: 2 })
    })

    await t.mutation(internal.kyc.mutations.rejectAuto, {
      kycRequestId,
      rejectionReason: "rejeu tardif — ne doit rien changer",
    })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.status).toBe("approved")
    expect(kyc?.rejectionReason).toBeUndefined()

    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique(),
    )
    expect(profile?.loa).toBe(2)

    const audit = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_target", (q) =>
          q.eq("targetType", "kyc").eq("targetId", kycRequestId),
        )
        .collect(),
    )
    expect(audit.some((e) => e.action === "kyc_rejected")).toBe(false)
  })

  test("idempotent : un rejet déjà terminal n'écrase pas le motif d'origine", async () => {
    const t = makeTestClient()
    const userId = "user_already_rejected"
    const kycRequestId = await seedKyc(t, userId, "rejected")
    await t.run(async (ctx) =>
      ctx.db.patch(kycRequestId, { rejectionReason: "motif original" }),
    )

    await t.mutation(internal.kyc.mutations.rejectAuto, {
      kycRequestId,
      rejectionReason: "rejeu — ne doit pas remplacer le motif",
    })

    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId))
    expect(kyc?.rejectionReason).toBe("motif original")

    const audit = await t.run(async (ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_target", (q) =>
          q.eq("targetType", "kyc").eq("targetId", kycRequestId),
        )
        .collect(),
    )
    expect(audit.filter((e) => e.action === "kyc_rejected")).toHaveLength(0)
  })
})
