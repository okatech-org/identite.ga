import type { DiscoveryDocument, StorageAdapter } from "./types.js"

const CACHE_TTL_MS = 60 * 60 * 1000 // 1h

interface CacheEntry {
  doc: DiscoveryDocument
  fetchedAt: number
}

const memoryCache = new Map<string, CacheEntry>()

export const buildDiscoveryUrl = (issuer: string, override?: string): string => {
  if (override) return override
  return `${issuer.replace(/\/+$/, "")}/.well-known/openid-configuration`
}

export const fetchDiscovery = async (
  issuer: string,
  options: { discoveryUrl?: string; storage?: StorageAdapter; cacheKey?: string } = {},
): Promise<DiscoveryDocument> => {
  const url = buildDiscoveryUrl(issuer, options.discoveryUrl)
  const cacheKey = options.cacheKey ?? url

  const cached = memoryCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.doc
  }

  if (options.storage) {
    try {
      const raw = await options.storage.get(cacheKey)
      if (raw) {
        const entry = JSON.parse(raw) as CacheEntry
        if (Date.now() - entry.fetchedAt < CACHE_TTL_MS) {
          memoryCache.set(cacheKey, entry)
          return entry.doc
        }
      }
    } catch {
      // cache corrompu — ignorer et refetch
    }
  }

  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) {
    throw new Error(
      `[@idn/core] Discovery failed (${res.status}) ${url} — vérifier l'issuer`,
    )
  }
  const doc = (await res.json()) as DiscoveryDocument
  const entry: CacheEntry = { doc, fetchedAt: Date.now() }
  memoryCache.set(cacheKey, entry)
  if (options.storage) {
    try {
      await options.storage.set(cacheKey, JSON.stringify(entry))
    } catch {
      // storage saturé — non-bloquant
    }
  }
  return doc
}

/** Invalide le cache (utile en test). */
export const clearDiscoveryCache = (cacheKey?: string): void => {
  if (cacheKey) memoryCache.delete(cacheKey)
  else memoryCache.clear()
}
