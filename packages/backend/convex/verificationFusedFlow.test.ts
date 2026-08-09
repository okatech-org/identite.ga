/// <reference types="vite/client" />
import { register as registerAggregate } from "@convex-dev/aggregate/test";
import { register as registerRateLimiter } from "@convex-dev/rate-limiter/test";
import { ConvexError } from "convex/values";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

/**
 * Parcours FUSIONNÉ Niveau 2 / Niveau 3 de bout en bout.
 *
 * Ce que ces tests protègent, c'est une doctrine, pas une mécanique : le
 * Niveau 3 est demandable directement depuis le LoA 1, MAIS un `acr` eidas3
 * n'est jamais accordé sans preuve documentaire instruite. Les deux moitiés
 * comptent — retirer la première rend le Niveau 3 direct impossible, retirer
 * la seconde délivre un niveau élevé sans avoir vu la moindre pièce.
 */

const modules = import.meta.glob("/convex/**/*.ts");

vi.mock("./lib/auth", async () => {
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
  // L'ouverture d'une piste documentaire passe par le rate limiter, comme
  // `kyc.initialize` : sans ce composant, le parcours fusionné ne démarre pas.
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

/** Simule la collecte des pièces : le citoyen dépose recto + selfie. */
async function submitDocuments(
  t: ReturnType<typeof convexTest>,
  kycRequestId: Id<"kycRequest">,
) {
  await t.run(async (ctx) => {
    const front = await ctx.storage.store(new Blob(["recto"]));
    const selfie = await ctx.storage.store(new Blob(["selfie"]));
    await ctx.db.patch(kycRequestId, {
      documentImages: { front },
      selfieImage: selfie,
      status: "submitted",
      submittedAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
}

beforeEach(() => {
  process.env.LIVEKIT_URL = "wss://video.identite.ga";
  process.env.LIVEKIT_API_KEY = "test-api-key";
  process.env.LIVEKIT_API_SECRET = "test-api-secret-at-least-32-characters";
  process.env.LIVEKIT_AUTOSUSPEND_ENABLED = "false";
});

describe("demande directe du Niveau 3 depuis le LoA 1", () => {
  test("ouvre la vérification ET sa piste documentaire du même geste", async () => {
    const t = makeTestClient();
    await seedProfile(t, "citizen_fused", 1);
    const citizen = t.withIdentity({ subject: "citizen_fused" });

    const result = await citizen.mutation(api.verification.request, {
      targetLoa: 3,
      documentType: "cni_gabon",
    });

    expect(result.verificationId).toBeDefined();
    expect(result.kycRequestId).toBeDefined();

    const verification = await t.run(async (ctx) =>
      ctx.db.get(result.verificationId as Id<"level3Verification">),
    );
    // Le rattachement est ce qui rend la preuve documentaire opposable au
    // moment de la décision : sans lui, `approve` ne saurait pas quoi vérifier.
    expect(verification?.kycRequestId).toBe(result.kycRequestId);
    expect(verification?.entryLoa).toBe(1);
  });

  test("refuse la demande sans type de pièce", async () => {
    const t = makeTestClient();
    await seedProfile(t, "citizen_nodoc", 1);
    const citizen = t.withIdentity({ subject: "citizen_nodoc" });

    await expect(
      citizen.mutation(api.verification.request, { targetLoa: 3 }),
    ).rejects.toThrow(ConvexError);
  });

  test("est idempotente : deux appels ne créent qu'une demande", async () => {
    const t = makeTestClient();
    await seedProfile(t, "citizen_twice", 1);
    const citizen = t.withIdentity({ subject: "citizen_twice" });

    const first = await citizen.mutation(api.verification.request, {
      targetLoa: 3,
      documentType: "cni_gabon",
    });
    const second = await citizen.mutation(api.verification.request, {
      targetLoa: 3,
      documentType: "passport",
    });

    expect(second.verificationId).toBe(first.verificationId);
    expect(second.kycRequestId).toBe(first.kycRequestId);
    const all = await t.run(async (ctx) =>
      ctx.db.query("level3Verification").collect(),
    );
    expect(all).toHaveLength(1);
  });

  test("depuis le LoA 2, n'ouvre aucune seconde piste documentaire", async () => {
    // La preuve est déjà acquise : redemander des pièces ferait refaire au
    // citoyen une démarche qu'il a déjà passée.
    const t = makeTestClient();
    await seedProfile(t, "citizen_l2_direct", 2);
    const citizen = t.withIdentity({ subject: "citizen_l2_direct" });

    const result = await citizen.mutation(api.verification.request, {
      targetLoa: 3,
    });

    expect(result.verificationId).toBeDefined();
    expect(result.kycRequestId).toBeUndefined();
    const kycs = await t.run(async (ctx) =>
      ctx.db.query("kycRequest").collect(),
    );
    expect(kycs).toHaveLength(0);
  });

  test("le Niveau 2 reste demandable seul", async () => {
    const t = makeTestClient();
    await seedProfile(t, "citizen_l2_only", 1);
    const citizen = t.withIdentity({ subject: "citizen_l2_only" });

    const result = await citizen.mutation(api.verification.request, {
      targetLoa: 2,
      documentType: "cni_gabon",
    });

    expect(result.kycRequestId).toBeDefined();
    expect(result.verificationId).toBeUndefined();
  });
});

describe("planification du créneau en parcours fusionné", () => {
  async function prepare() {
    const t = makeTestClient();
    await seedProfile(t, "citizen_book", 1);
    await seedProfile(t, "controller_book", 2);
    const citizen = t.withIdentity({ subject: "citizen_book" });
    const controller = t.withIdentity({ subject: "controller_book" });

    const { verificationId, kycRequestId } = await citizen.mutation(
      api.verification.request,
      { targetLoa: 3, documentType: "cni_gabon" },
    );
    const startsAt = Date.now() + 48 * 60 * 60 * 1000;
    await controller.mutation(api.level3.scheduling.createAvailability, {
      startsAt,
      endsAt: startsAt + 60 * 60 * 1000,
      durationMinutes: 30,
    });
    return {
      t,
      citizen,
      controller,
      verificationId: verificationId!,
      kycRequestId,
    };
  }

  test("les créneaux restent fermés tant que les pièces ne sont pas soumises", async () => {
    // Réserver avant soumission produirait un entretien que le contrôleur ne
    // peut pas instruire : il n'aurait aucune pièce à l'écran.
    const { t, citizen, verificationId } = await prepare();

    expect(
      await citizen.query(api.level3.scheduling.listAvailable, {}),
    ).toHaveLength(0);
    const state = await citizen.query(api.verification.getMine, {});
    expect(state.level3?.canBookAppointment).toBe(false);

    const anySlot = await t.run(async (ctx) =>
      ctx.db.query("level3AppointmentSlot").first(),
    );
    await expect(
      citizen.mutation(api.level3.scheduling.book, {
        verificationId,
        slotId: anySlot!._id,
      }),
    ).rejects.toThrow(ConvexError);
  });

  test("les créneaux s'ouvrent dès les pièces soumises", async () => {
    const { t, citizen, verificationId, kycRequestId } = await prepare();
    await submitDocuments(t, kycRequestId!);

    const slots = await citizen.query(api.level3.scheduling.listAvailable, {});
    expect(slots.length).toBeGreaterThan(0);

    const state = await citizen.query(api.verification.getMine, {});
    expect(state.level3?.canBookAppointment).toBe(true);
    expect(state.documentTrack?.attachedToLevel3).toBe(true);

    await citizen.mutation(api.level3.scheduling.book, {
      verificationId,
      slotId: slots[0]._id,
    });
    const verification = await t.run(async (ctx) => ctx.db.get(verificationId));
    expect(verification?.status).toBe("claimed");
    expect(verification?.scheduledAt).toBe(slots[0].startsAt);
  });
});

describe("décision en parcours fusionné", () => {
  async function runToInterview(kycStatus: "submitted" | "rejected") {
    const t = makeTestClient();
    await seedProfile(t, "citizen_decide", 1);
    await seedProfile(t, "controller_decide", 2);
    const citizen = t.withIdentity({ subject: "citizen_decide" });
    const controller = t.withIdentity({ subject: "controller_decide" });

    const { verificationId, kycRequestId } = await citizen.mutation(
      api.verification.request,
      { targetLoa: 3, documentType: "cni_gabon" },
    );
    await submitDocuments(t, kycRequestId!);
    if (kycStatus === "rejected") {
      await t.run(async (ctx) => {
        await ctx.db.patch(kycRequestId!, {
          status: "rejected",
          rejectionReason: "Pièce illisible",
          updatedAt: Date.now(),
        });
      });
    }
    await controller.mutation(api.level3.claim, {
      verificationId: verificationId!,
    });
    await controller.mutation(api.level3.beginInterview, {
      verificationId: verificationId!,
    });
    return {
      t,
      controller,
      verificationId: verificationId!,
      kycRequestId: kycRequestId!,
    };
  }

  test("l'approbation accorde le Niveau 2 et le Niveau 3 du même geste", async () => {
    const { t, controller, verificationId, kycRequestId } =
      await runToInterview("submitted");

    await controller.mutation(api.level3.approve, { verificationId });

    const profile = await t.run(async (ctx) =>
      ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", "citizen_decide"))
        .unique(),
    );
    const kyc = await t.run(async (ctx) => ctx.db.get(kycRequestId));
    const reviews = await t.run(async (ctx) =>
      ctx.db
        .query("kycReview")
        .withIndex("by_kycRequest", (q) => q.eq("kycRequestId", kycRequestId))
        .collect(),
    );

    expect(profile?.loa).toBe(3);
    // La piste documentaire est CLÔTURÉE par la même décision : sans cela, le
    // citoyen resterait avec un dossier KYC ouvert indéfiniment, et l'audit
    // ne porterait aucune trace de qui a constaté ses pièces.
    expect(kyc?.status).toBe("approved");
    expect(kyc?.reviewerId).toBe("controller_decide");
    expect(reviews).toHaveLength(1);
  });

  test("des pièces déjà refusées bloquent l'approbation", async () => {
    // Un rejet humain ne se contourne pas par l'entretien — même discipline
    // que la garde de `kyc.submit` contre l'écrasement silencieux.
    const { controller, verificationId } = await runToInterview("rejected");

    await expect(
      controller.mutation(api.level3.approve, { verificationId }),
    ).rejects.toThrow(ConvexError);
  });

  test("une vérification sans piste documentaire ne peut pas être approuvée", async () => {
    // Cas d'une demande créée avant la fusion des parcours : le LoA 1 ne doit
    // pas pouvoir décrocher un eidas3 par la seule ancienneté de sa demande.
    const t = makeTestClient();
    await seedProfile(t, "citizen_orphan", 1);
    await seedProfile(t, "controller_orphan", 2);
    const controller = t.withIdentity({ subject: "controller_orphan" });

    const verificationId = await t.run(async (ctx) => {
      const now = Date.now();
      const id = await ctx.db.insert("level3Verification", {
        userId: "citizen_orphan",
        status: "waiting_controller",
        roomName: "idn-l3-legacy",
        requestedAt: now,
        updatedAt: now,
      });
      return id;
    });
    await controller.mutation(api.level3.claim, { verificationId });
    await controller.mutation(api.level3.beginInterview, { verificationId });

    await expect(
      controller.mutation(api.level3.approve, { verificationId }),
    ).rejects.toThrow(ConvexError);
  });
});
