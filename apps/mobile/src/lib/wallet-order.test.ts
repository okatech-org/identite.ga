import { describe, expect, it } from "vitest"
import { moveItem } from "./wallet-order"

describe("ordre des cartes mises en avant", () => {
  it("déplace une carte vers la position voisine", () => {
    expect(moveItem(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"])
    expect(moveItem(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"])
  })

  it("ignore un déplacement hors limites", () => {
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"])
  })
})
