/// <reference types="vite/client" />
import { register as registerAggregate } from "@convex-dev/aggregate/test";
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test";
import { ConvexError } from "convex/values";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";

/**
 * Canal PARTENAIRE — traitement d'une demande depuis administration.ga.
 *
 * Ce canal est celui qu'on surveille le moins : il n'a pas d'écran chez nous,
 * et l'agent qui agit n'est pas authentifié par identite.ga mais VOUCHÉ par
 * une clé M2M. Ce sont donc précisément ses garde-fous qu'il faut verrouiller
 * par des tests : imputabilité de l'acte, exclusivité de la prise en charge,
 * et — surtout — le fait qu'il n'a aucune latitude propre sur la doctrine de
 * preuve documentaire.
 */

const modules = import.meta.glob("/convex/**/*.ts");

vi.mock("../lib/auth", async () => {
  const { ConvexError: CE } = await import("convex/values");
  const authUser = async (ctx: {
    auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
  }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      throw new CE({ code: "UNAUTHENTICATED", message: "Connexion requise." });
    return {
      userId: identity.subject,
      email: `${identity.subject}@example.ga`,
      emailVerified: true,
      roles: identity.subject.startsWith("controller_")
        ? ["identity_controller"]
        : [],
    };
  };
  return {
    requireAuth: authUser,
    requireVerifiedAuth: authUser,
    requireController: async (ctx: {
      auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
    }) => {
      const user = await authUser(ctx);
      if (!user.roles.includes("identity_controller")) {
        throw new CE({ code: "FORBIDDEN", message: "Accès refusé." });
      }
      return user;
    },
  };
});

function makeTestClient() {
  const t = convexTest(schema, modules);
  registerAggregate(t, "kycByStatus");
  registerAggregate(t, "usersByLoa");
  registerAggregate(t, "usersByProfile");
  registerRateLimiter(t);
  return t;
}

async function seedProfile(
  t: ReturnType<typeof convexTest>,
  userId: string,
  loa: 1 | 2 | 3,
) {
  const now = Date.now();
  await t.run(async (ctx) => {
    await ctx.db.insert("userProfile", {
      userId,
      profileType: "citizen",
      loa,
      pivot: {
        firstName: "Ariane",
        lastName: "Nziengui",
        dateOfBirth: "1990-01-01",
        gender: "F",
        birthPlace: "Libreville",
        nationality: "GA",
      },
      createdAt: now,
      updatedAt: now,
    } as any);
    await ctx.db.insert("notificationPreference", {
      userId,
      email: { security: true, kyc: false, consent: true, comms: true },
      inApp: { security: true, kyc: true, consent: true, comms: true },
      updatedAt: now,
    } as any);
  });
}

/** Clé M2M fictive : `partnerKeyId` est ce qui rend l'acte révocable. */
async function seedPartnerKey(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) =>
    ctx.db.insert("developerApiKey", {
      userId: "dev_admin_ga",
      name: "administration.ga",
      tokenPrefix: "idn_test",
      tokenHash: "hash",
      scopes: [
        "idn:verification:list",
        "idn:verification:claim",
        "idn:verification:decide",
      ],
      createdAt: Date.now(),
    } as any),
  );
}

/** Ouvre une demande fusionnée, pièces soumises, rendez-vous imminent. */
async function seedPendingRequest(t: ReturnType<typeof convexTest>) {
  await seedProfile(t, "citizen_partner", 1);
  const citizen = t.withIdentity({ subject: "citizen_partner" });
  const { verificationId, kycRequestId } = await citizen.mutation(
    api.verification.request,
    { targetLoa: 3, documentType: "cni_gabon" },
  );
  await t.run(async (ctx) => {
    const front = await ctx.storage.store(new Blob(["recto"]));
    const selfie = await ctx.storage.store(new Blob(["selfie"]));
    await ctx.db.patch(kycRequestId!, {
      documentImages: { front },
      selfieImage: selfie,
      status: "submitted",
      submittedAt: Date.now(),
      updatedAt: Date.now(),
    });
    // Fenêtre de rendez-vous ouverte : `beginInterview` la contrôle.
    const now = Date.now();
    await ctx.db.patch(verificationId!, {
      scheduledAt: now,
      scheduledEndAt: now + 30 * 60 * 1000,
      updatedAt: now,
    });
  });
  return {
    verificationId: verificationId as Id<"level3Verification">,
    kycRequestId: kycRequestId as Id<"kycRequest">,
  };
}

beforeEach(() => {
  process.env.LIVEKIT_URL = "wss://video.identite.ga";
  process.env.LIVEKIT_API_KEY = "test-api-key";
  process.env.LIVEKIT_API_SECRET = "test-api-secret-at-least-32-characters";
  process.env.LIVEKIT_AUTOSUSPEND_ENABLED = "false";
  // Aucun partenaire configuré : le webhook déclenché par le trigger doit
  // sortir sans bruit plutôt que faire échouer les mutations sous test.
  delete process.env.IDN_PARTNER_WEBHOOK_URL;
  delete process.env.IDN_PARTNER_WEBHOOK_SECRET;
});

describe("prise en charge par un agent partenaire", () => {
  test("assigne l'agent et conserve la clé qui a vouché pour lui", async () => {
    // Sans `partnerKeyId`, révoquer une clé compromise laisserait ses actes
    // passés sans moyen d'être retrouvés.
    const t = makeTestClient();
    const partnerKeyId = await seedPartnerKey(t);
    const { verificationId } = await seedPendingRequest(t);

    await t.mutation(internal.partner.verifications.claim, {
      verificationId,
      agentSub: "agent_dgdi_1",
      agentName: "Awa Ondo",
      partnerKeyId,
    });

    const row = await t.run(async (ctx) => ctx.db.get(verificationId));
    expect(row?.status).toBe("claimed");
    expect(row?.controllerId).toBe("agent_dgdi_1");
    expect(row?.controllerName).toBe("Awa Ondo");
    expect(row?.handledVia).toBe("partner");
    expect(row?.partnerKeyId).toBe(partnerKeyId);
  });

  test("est rejouable sans effet par le même agent", async () => {
    // Le partenaire doit pouvoir réessayer après un timeout réseau sans
    // casser l'état de la demande.
    const t = makeTestClient();
    const partnerKeyId = await seedPartnerKey(t);
    const { verificationId } = await seedPendingRequest(t);
    const args = { verificationId, agentSub: "agent_dgdi_1", partnerKeyId };

    await t.mutation(internal.partner.verifications.claim, args);
    await expect(
      t.mutation(internal.partner.verifications.claim, args),
    ).resolves.toBeNull();
  });

  test("refuse un second agent sur une demande déjà prise", async () => {
    const t = makeTestClient();
    const partnerKeyId = await seedPartnerKey(t);
    const { verificationId } = await seedPendingRequest(t);

    await t.mutation(internal.partner.verifications.claim, {
      verificationId,
      agentSub: "agent_dgdi_1",
      partnerKeyId,
    });
    await expect(
      t.mutation(internal.partner.verifications.claim, {
        verificationId,
        agentSub: "agent_dgdi_2",
        partnerKeyId,
      }),
    ).rejects.toThrow(ConvexError);
  });
});

describe("accès à la salle d'entretien", () => {
  test("refuse un agent qui n'est pas l'assignataire", async () => {
    // Le scope M2M autorise à DEMANDER un jeton ; il ne désigne pas quel
    // entretien. Sans ce contrôle, toute clé valide entrerait dans n'importe
    // quelle salle, face à n'importe quel citoyen.
    const t = makeTestClient();
    const partnerKeyId = await seedPartnerKey(t);
    const { verificationId } = await seedPendingRequest(t);
    await t.mutation(internal.partner.verifications.claim, {
      verificationId,
      agentSub: "agent_dgdi_1",
      partnerKeyId,
    });

    await expect(
      t.query(internal.partner.verifications.getJoinContext, {
        verificationId,
        agentSub: "agent_dgdi_2",
      }),
    ).rejects.toThrow(ConvexError);

    const context = await t.query(
      internal.partner.verifications.getJoinContext,
      { verificationId, agentSub: "agent_dgdi_1" },
    );
    // Même salle que le citoyen : c'est ce qui permet à l'agent de mener
    // l'entretien sans quitter administration.ga.
    expect(context.roomName).toBe(`idn-l3-${verificationId}`);
  });
});

describe("décision partenaire", () => {
  async function claimAndOpen(t: ReturnType<typeof convexTest>) {
    const partnerKeyId = await seedPartnerKey(t);
    const { verificationId, kycRequestId } = await seedPendingRequest(t);
    await t.mutation(internal.partner.verifications.claim, {
      verificationId,
      agentSub: "agent_dgdi_1",
      partnerKeyId,
    });
    await t.mutation(internal.partner.verifications.beginInterview, {
      verificationId,
      agentSub: "agent_dgdi_1",
    });
    return { verificationId, kycRequestId };
  }

  test("applique la même doctrine fusionnée que la console native", async () => {
    // Le canal partenaire n'a aucune latitude propre : il accorde le Niveau 2
    // et le Niveau 3 du même geste, et clôt la piste documentaire.
    const t = makeTestClient();
    const { verificationId, kycRequestId } = await claimAndOpen(t);

    await t.mutation(internal.partner.verifications.decide, {
      verificationId,
      decision: "approved",
      agentSub: "agent_dgdi_1",
    });

    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", "citizen_partner"))
        .unique(),
    );
    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId));
    expect(profile?.loa).toBe(3);
    expect(kyc?.status).toBe("approved");
    expect(kyc?.reviewerId).toBe("agent_dgdi_1");
  });

  test("ne peut pas décider sans avoir ouvert l'entretien", async () => {
    const t = makeTestClient();
    const partnerKeyId = await seedPartnerKey(t);
    const { verificationId } = await seedPendingRequest(t);
    await t.mutation(internal.partner.verifications.claim, {
      verificationId,
      agentSub: "agent_dgdi_1",
      partnerKeyId,
    });

    await expect(
      t.mutation(internal.partner.verifications.decide, {
        verificationId,
        decision: "approved",
        agentSub: "agent_dgdi_1",
      }),
    ).rejects.toThrow(ConvexError);
  });

  test("ne peut pas décider sur la demande d'un autre agent", async () => {
    const t = makeTestClient();
    const { verificationId } = await claimAndOpen(t);

    await expect(
      t.mutation(internal.partner.verifications.decide, {
        verificationId,
        decision: "approved",
        agentSub: "agent_dgdi_2",
      }),
    ).rejects.toThrow(ConvexError);
  });

  test("ne peut pas passer outre un refus des pièces", async () => {
    const t = makeTestClient();
    const { verificationId, kycRequestId } = await claimAndOpen(t);
    await t.run(async (ctx) => {
      await ctx.db.patch(kycRequestId, {
        status: "rejected",
        rejectionReason: "Pièce illisible",
        updatedAt: Date.now(),
      });
    });

    await expect(
      t.mutation(internal.partner.verifications.decide, {
        verificationId,
        decision: "approved",
        agentSub: "agent_dgdi_1",
      }),
    ).rejects.toThrow(ConvexError);
  });
});

describe("resynchronisation de la réplique", () => {
  test("rend tout ce qui a changé depuis un horodatage, tous statuts confondus", async () => {
    // C'est le filet quand un webhook s'est perdu : filtrer par statut ici
    // manquerait précisément les demandes passées à un statut inattendu.
    const t = makeTestClient();
    const partnerKeyId = await seedPartnerKey(t);
    const before = Date.now();
    const { verificationId } = await seedPendingRequest(t);
    await t.mutation(internal.partner.verifications.claim, {
      verificationId,
      agentSub: "agent_dgdi_1",
      partnerKeyId,
    });

    const resync = await t.query(internal.partner.verifications.listQueue, {
      updatedSince: before,
    });
    expect(resync.items.map((i) => i.verificationId)).toContain(verificationId);
    expect(resync.items[0]?.status).toBe("claimed");
    expect(resync.syncedAt).toBeGreaterThanOrEqual(before);

    // La file de travail, elle, ne montre plus la demande : elle est prise.
    const queue = await t.query(internal.partner.verifications.listQueue, {
      status: "waiting_controller",
    });
    expect(queue.items).toHaveLength(0);
  });
});
