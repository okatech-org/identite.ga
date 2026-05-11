import type { IDNEvent, IDNEventListener, IDNEventPayload } from "./types.js"

export class EventBus {
  private readonly listeners = new Map<IDNEvent, Set<IDNEventListener<IDNEvent>>>()

  on<E extends IDNEvent>(event: E, cb: IDNEventListener<E>): () => void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(cb as IDNEventListener<IDNEvent>)
    return () => this.off(event, cb)
  }

  off<E extends IDNEvent>(event: E, cb: IDNEventListener<E>): void {
    this.listeners.get(event)?.delete(cb as IDNEventListener<IDNEvent>)
  }

  emit<E extends IDNEvent>(event: E, payload: IDNEventPayload[E]): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const cb of set) {
      try {
        ;(cb as IDNEventListener<E>)(payload)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[@idn/core] listener threw", err)
      }
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}
