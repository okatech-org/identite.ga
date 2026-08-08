/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"
import { internal } from "../_generated/api"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.ts")

async function seedCitizen(
  t: ReturnType<typeof convexTest>,
  opts: {
    userId: string
    firstName: string
    lastName: string
    nip: string
    loa: 1 | 2 | 3
    emailAlias: string
    deletedAt?: number
  },
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("userProfile", {
      userId: opts.userId,
      profileType: "citizen",
      loa: opts.loa,
      idnId: `GA-${opts.userId}`,
      pivot: {
        firstName: opts.firstName,
        lastName: opts.lastName,
        dateOfBirth: "1990-01-01",
        gender: "N",
        birthPlace: "Libreville",
        nationality: "GA",
        nip: opts.nip,
      },
      createdAt: 1,
      updatedAt: 1,
      ...(opts.deletedAt ? { deletedAt: opts.deletedAt } : {}),
    })
    await ctx.db.insert("iboiteAccount", {
      userId: opts.userId,
      type: "personal",
      label: `${opts.firstName} ${opts.lastName}`,
      emailAlias: opts.emailAlias,
      street: "",
      city: "",
      postalCode: "",
      country: "GA",
      qrCode: `QR-${opts.userId}`,
      counters: {
        unreadLetters: 0,
        pendingLetters: 0,
        availablePackages: 0,
        unreadMessages: 0,
      },
      createdAt: 1,
      updatedAt: 1,
    })
  })
}

describe("resolveDirectory", () => {
  test("résout la carte minimale par subject, NIP et alias", async () => {
    const t = convexTest(schema, modules)
    await seedCitizen(t, {
      userId: "user-jean",
      firstName: "Jean",
      lastName: "Moussavou",
      nip: "19900101000001",
      loa: 2,
      emailAlias: "jean.moussavou@idn.ga",
    })

    for (const criterion of [
      { sub: "user-jean" },
      { nip: "19900101000001" },
      { emailAlias: " JEAN.MOUSSAVOU@IDN.GA " },
    ]) {
      const results = await t.query(
        internal.partner.citizens.resolveDirectory,
        criterion,
      )
      expect(results).toEqual([
        {
          sub: "user-jean",
          idnId: "GA-user-jean",
          firstName: "Jean",
          lastName: "Moussavou",
          nip: "19900101000001",
          emailAlias: "jean.moussavou@idn.ga",
          loa: 2,
          verified: true,
        },
      ])
    }
  })

  test("la recherche par nom n'expose que les identités vérifiées", async () => {
    const t = convexTest(schema, modules)
    await seedCitizen(t, {
      userId: "verified",
      firstName: "Ada",
      lastName: "Obame",
      nip: "19900101000002",
      loa: 3,
      emailAlias: "ada.obame@idn.ga",
    })
    await seedCitizen(t, {
      userId: "unverified",
      firstName: "Ada",
      lastName: "Obame",
      nip: "19900101000003",
      loa: 1,
      emailAlias: "ada2.obame@idn.ga",
    })

    const results = await t.query(internal.partner.citizens.resolveDirectory, {
      name: "obame ada",
    })

    expect(results.map((result) => result.sub)).toEqual(["verified"])
  })

  test("n'expose jamais un profil supprimé", async () => {
    const t = convexTest(schema, modules)
    await seedCitizen(t, {
      userId: "deleted",
      firstName: "Jean",
      lastName: "Efface",
      nip: "19900101000004",
      loa: 2,
      emailAlias: "jean.efface@idn.ga",
      deletedAt: 2,
    })

    expect(
      await t.query(internal.partner.citizens.resolveDirectory, {
        sub: "deleted",
      }),
    ).toEqual([])
  })

  test("refuse un appel interne ambigu", async () => {
    const t = convexTest(schema, modules)

    await expect(
      t.query(internal.partner.citizens.resolveDirectory, {
        sub: "user-1",
        nip: "19900101000001",
      }),
    ).rejects.toThrow(/Un seul critère/)
  })
})
