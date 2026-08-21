import { afterEach, describe, expect, test, vi } from "vitest"

import { idn, type IDNProfile } from "./index.js"

const discoveryUrl = "https://identite.ga/.well-known/openid-configuration"
const userInfoUrl = "https://site.identite.ga/api/auth/oauth2/userinfo"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("idn getUserInfo", () => {
  test("appelle toujours /userinfo et conserve tous les claims IDN", async () => {
    const profile: IDNProfile = {
      sub: "idn-user-1",
      email: "itoutouberny@idn.ga",
      email_verified: true,
      name: "Berny François Itoutou",
      given_name: "Berny François",
      family_name: "Itoutou",
      birthdate: "1998-02-02",
      birth_place: "Libreville",
      gender: "M",
      nationality: "GA",
      profile_type: "citizen",
      acr: "eidas2",
      loa: 2,
      nip: "18002719901310",
      env: "production",
    }
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ userinfo_endpoint: userInfoUrl }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(profile), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const config = idn({
      clientId: "client-id",
      clientSecret: "client-secret",
      discoveryUrl,
    }) as {
      getUserInfo: (tokens: {
        accessToken: string
        idToken?: string
      }) => Promise<Record<string, unknown>>
    }

    await expect(
      config.getUserInfo({
        accessToken: "access-token",
        // La présence de l'ID token ne doit jamais court-circuiter userinfo.
        idToken: "header.payload.signature",
      }),
    ).resolves.toMatchObject({
      ...profile,
      id: "idn-user-1",
      emailVerified: true,
    })
    expect(fetchMock).toHaveBeenNthCalledWith(1, discoveryUrl, {
      headers: { Accept: "application/json" },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, userInfoUrl, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer access-token",
      },
    })
  })

  test("réutilise l'URL userinfo résolue sans refaire le discovery", async () => {
    const profile = {
      sub: "idn-user-1",
      email: "citoyen@idn.ga",
      email_verified: true,
    }
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ userinfo_endpoint: userInfoUrl }), {
          status: 200,
        }),
      )
      .mockImplementation(async () => new Response(JSON.stringify(profile), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const config = idn({
      clientId: "client-id",
      clientSecret: "client-secret",
      discoveryUrl,
    }) as {
      getUserInfo: (tokens: { accessToken: string }) => Promise<unknown>
    }

    await config.getUserInfo({ accessToken: "first-token" })
    await config.getUserInfo({ accessToken: "second-token" })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock).toHaveBeenLastCalledWith(userInfoUrl, {
      headers: {
        Accept: "application/json",
        Authorization: "Bearer second-token",
      },
    })
  })

  test("refuse un profil userinfo sans sub ou email", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ userinfo_endpoint: userInfoUrl }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ email: "citoyen@idn.ga" }), {
          status: 200,
        }),
      )
    vi.stubGlobal("fetch", fetchMock)

    const config = idn({
      clientId: "client-id",
      clientSecret: "client-secret",
      discoveryUrl,
    }) as {
      getUserInfo: (tokens: { accessToken: string }) => Promise<unknown>
    }

    await expect(config.getUserInfo({ accessToken: "access-token" })).rejects.toThrow(
      "profil userinfo incomplet",
    )
  })
})
