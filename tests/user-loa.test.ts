import { describe, expect, test } from "bun:test"

import { getCurrentUserLoa } from "../apps/web/lib/oauth-flow"

describe("getCurrentUserLoa", () => {
  test("lit le niveau dans le profil retourné par getCurrentUser", () => {
    expect(getCurrentUserLoa({ profile: { loa: 2 } })).toBe(2)
    expect(getCurrentUserLoa({ profile: { loa: 3 } })).toBe(3)
  })

  test("revient au niveau 1 sans profil ou avec une valeur invalide", () => {
    expect(getCurrentUserLoa(null)).toBe(1)
    expect(getCurrentUserLoa({ profile: null })).toBe(1)
    expect(getCurrentUserLoa({ profile: { loa: 99 } })).toBe(1)
  })
})
