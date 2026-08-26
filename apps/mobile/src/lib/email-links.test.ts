import { describe, expect, it } from "vitest"
import { splitEmailTextLinks } from "./email-links"

describe("splitEmailTextLinks", () => {
  it("rend cliquables les URL absolues et les domaines www", () => {
    const parts = splitEmailTextLinks(
      "Site www.okafrancois.dev et <https://github.com/okafrancois>*",
    )

    expect(parts.filter((part) => part.url)).toEqual([
      { text: "www.okafrancois.dev", url: "https://www.okafrancois.dev" },
      {
        text: "https://github.com/okafrancois",
        url: "https://github.com/okafrancois",
      },
    ])
    expect(parts.map((part) => part.text).join("")).toBe(
      "Site www.okafrancois.dev et <https://github.com/okafrancois>*",
    )
  })

  it("ne transforme pas du texte ordinaire", () => {
    expect(splitEmailTextLinks("Bonjour Berny")).toEqual([
      { text: "Bonjour Berny" },
    ])
  })
})
