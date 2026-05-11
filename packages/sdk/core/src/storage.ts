import type { StorageAdapter, StorageKind } from "./types.js"

const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined"

class WebStorageAdapter implements StorageAdapter {
  constructor(private readonly store: Storage) {}
  get(key: string) {
    return this.store.getItem(key)
  }
  set(key: string, value: string) {
    this.store.setItem(key, value)
  }
  remove(key: string) {
    this.store.removeItem(key)
  }
}

class MemoryAdapter implements StorageAdapter {
  private readonly data = new Map<string, string>()
  get(key: string) {
    return this.data.get(key) ?? null
  }
  set(key: string, value: string) {
    this.data.set(key, value)
  }
  remove(key: string) {
    this.data.delete(key)
  }
}

export const resolveStorage = (kind?: StorageKind): StorageAdapter => {
  if (kind && typeof kind === "object") return kind
  if (kind === "memory") return new MemoryAdapter()
  if (!isBrowser()) return new MemoryAdapter()
  if (kind === "sessionStorage") return new WebStorageAdapter(window.sessionStorage)
  return new WebStorageAdapter(window.localStorage)
}

/** Clés de stockage namespacées par clientId pour éviter les collisions. */
export const storageKeys = (clientId: string) => ({
  session: `idn:${clientId}:session`,
  pkce: `idn:${clientId}:pkce`,
  state: `idn:${clientId}:state`,
  nonce: `idn:${clientId}:nonce`,
  discovery: `idn:${clientId}:discovery`,
  jwks: `idn:${clientId}:jwks`,
})
