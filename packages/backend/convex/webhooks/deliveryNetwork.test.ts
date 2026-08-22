/// <reference types="vite/client" />
// @vitest-environment node
import { EventEmitter } from "node:events"
import { afterEach, describe, expect, test, vi } from "vitest"

const network = vi.hoisted(() => ({
  lookup: vi.fn(),
  request: vi.fn(),
}))

vi.mock("node:dns/promises", () => ({ lookup: network.lookup }))
vi.mock("node:https", () => ({ request: network.request }))

import { postPinned } from "./delivery"

class FakeRequest extends EventEmitter {
  body = ""
  destroyedWith: Error | null = null

  end(body: string) {
    this.body = body
  }

  destroy(error: Error) {
    this.destroyedWith = error
    this.emit("error", error)
  }
}

function respondWith(status: number, headers: Record<string, string> = {}) {
  network.request.mockImplementation(
    (
      _options: unknown,
      onResponse: (response: EventEmitter & {
        statusCode: number
        headers: Record<string, string>
      }) => void,
    ) => {
      const request = new FakeRequest()
      queueMicrotask(() => {
        const response = Object.assign(new EventEmitter(), {
          statusCode: status,
          headers,
        })
        onResponse(response)
        response.emit("end")
      })
      return request
    },
  )
}

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe("transport réseau des webhooks", () => {
  test("refait la résolution DNS avant chaque appel et bloque un rebinding privé", async () => {
    network.lookup
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }])
    respondWith(204)

    await expect(
      postPinned("https://consumer.example/webhook", {}, "{}"),
    ).resolves.toMatchObject({ status: 204 })
    await expect(
      postPinned("https://consumer.example/webhook", {}, "{}"),
    ).rejects.toThrow("SSRF_ADDRESS_FORBIDDEN")
    expect(network.lookup).toHaveBeenCalledTimes(2)
    expect(network.request).toHaveBeenCalledTimes(1)
  })

  test("rend une redirection au moteur sans effectuer un second appel", async () => {
    network.lookup.mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
    ])
    respondWith(302, { location: "https://other.example/webhook" })

    await expect(
      postPinned("https://consumer.example/webhook", {}, "{}"),
    ).resolves.toMatchObject({ status: 302 })
    expect(network.request).toHaveBeenCalledTimes(1)
  })

  test("détruit l'appel après dix secondes sans réponse", async () => {
    vi.useFakeTimers()
    network.lookup.mockResolvedValue([
      { address: "93.184.216.34", family: 4 },
    ])
    const request = new FakeRequest()
    network.request.mockReturnValue(request)

    const pending = postPinned(
      "https://consumer.example/webhook",
      {},
      "{}",
    )
    const timedOut = expect(pending).rejects.toThrow("TIMEOUT")
    await Promise.resolve()
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(10_001)

    await timedOut
    expect(request.destroyedWith?.message).toBe("TIMEOUT")
  })
})
