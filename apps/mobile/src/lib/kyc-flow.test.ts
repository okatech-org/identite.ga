import { describe, expect, it } from "vitest"
import { kycEntryRoute, kycPostSubmitRoute } from "./kyc-flow"

describe("routage KYC mobile", () => {
  it("reprend une demande active sur son suivi", () => {
    expect(
      kycEntryRoute({
        targetLoa: 2,
        currentLoa: 1,
        activeStatus: "complement_required",
      }),
    ).toBe("review")
    expect(
      kycEntryRoute({ targetLoa: 3, currentLoa: 1, activeStatus: "submitted" }),
    ).toBe("review")
  })

  it("envoie le Niveau 2 vérifié vers la planification Niveau 3", () => {
    expect(kycEntryRoute({ targetLoa: 3, currentLoa: 2 })).toBe("level3")
    expect(kycEntryRoute({ targetLoa: 2, currentLoa: 1 })).toBe("documents")
  })

  it("conserve le suivi après un complément", () => {
    expect(kycPostSubmitRoute(3, false)).toBe("level3")
    expect(kycPostSubmitRoute(3, true)).toBe("review")
  })
})
