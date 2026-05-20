"use client"

import * as React from "react"
import { useConvexAuth, useMutation, useQuery } from "convex/react"

import { api } from "@repo/backend/convex/_generated/api"

import {
  activateVault as activateVaultCrypto,
  decryptMetadata as decryptMetadataCrypto,
  unlockVault as unlockVaultCrypto,
  type ActivationOutput,
} from "@/lib/vault-crypto"
import {
  REMEMBER_TTL_MS,
  forgetMvk,
  rememberMvk,
  tryRestoreMvk,
} from "@/lib/vault-device"

/**
 * Provider iDocument — détient la MVK en mémoire après déverrouillage.
 * La MVK est volatile : un refresh de la page reverrouille automatiquement
 * le coffre-fort (comportement attendu pour un vault E2E).
 */

export type VaultStatus =
  | { phase: "loading" }
  | { phase: "unauth" }
  | { phase: "inactive" }
  | { phase: "locked"; hasRecovery: boolean; passwordHint?: string }
  | { phase: "unlocked"; mvk: Uint8Array; hasRecovery: boolean }

type VaultContextValue = {
  status: VaultStatus
  /** Active le vault — génère MVK, wrap par PBKDF2(password), persiste l'envelope. */
  activate: (password: string, hint?: string) => Promise<void>
  /**
   * Déverrouille — recharge la MVK en mémoire.
   * Si `remember` est vrai, persiste la MVK sur cet appareil (TTL ~7j)
   * via une device-key non-extractable (cf. `lib/vault-device.ts`).
   */
  unlock: (password: string, remember?: boolean) => Promise<void>
  /** Verrouille — efface la MVK en mémoire et purge la persistance device. */
  lock: () => void
}

const VaultContext = React.createContext<VaultContextValue | null>(null)

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const keyStatus = useQuery(
    api.vault.keys.status,
    isAuthenticated ? {} : "skip",
  )
  const envelope = useQuery(
    api.vault.keys.getEnvelope,
    isAuthenticated ? {} : "skip",
  )
  const activateMutation = useMutation(api.vault.keys.activate)

  const [mvk, setMvk] = React.useState<Uint8Array | null>(null)
  const [restoreAttempted, setRestoreAttempted] = React.useState(false)

  // Reset MVK + persistance quand l'utilisateur se déconnecte.
  React.useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      setMvk(null)
      forgetMvk()
      setRestoreAttempted(false)
    }
  }, [isAuthenticated, isLoading])

  // Tentative de restauration auto via device-key. Lancée une seule fois
  // par session, dès que l'envelope serveur est connue.
  React.useEffect(() => {
    if (restoreAttempted) return
    if (isLoading || !isAuthenticated || keyStatus === undefined) return
    if (!keyStatus.activated || envelope === undefined) {
      // Pas de vault à restaurer — on marque tenté pour ne pas bloquer en "loading".
      if (!keyStatus.activated || envelope === null) setRestoreAttempted(true)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const restored = await tryRestoreMvk(envelope)
        if (!cancelled && restored) setMvk(restored)
      } finally {
        if (!cancelled) setRestoreAttempted(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [restoreAttempted, isLoading, isAuthenticated, keyStatus, envelope])

  const status: VaultStatus = React.useMemo(() => {
    if (isLoading) return { phase: "loading" }
    if (!isAuthenticated) return { phase: "unauth" }
    if (keyStatus === undefined) return { phase: "loading" }
    if (!keyStatus.activated) return { phase: "inactive" }
    // Pendant la tentative de restore on reste "loading" pour éviter
    // un flash de l'écran de déverrouillage.
    if (!restoreAttempted) return { phase: "loading" }
    if (mvk) return { phase: "unlocked", mvk, hasRecovery: keyStatus.hasRecovery }
    return {
      phase: "locked",
      hasRecovery: keyStatus.hasRecovery,
      passwordHint: keyStatus.passwordHint,
    }
  }, [isLoading, isAuthenticated, keyStatus, restoreAttempted, mvk])

  const activate = React.useCallback(
    async (password: string, hint?: string) => {
      const out: ActivationOutput = await activateVaultCrypto(password)
      await activateMutation({
        algorithm: out.algorithm,
        kdf: out.kdf,
        kdfIterations: out.kdfIterations,
        passwordSalt: out.passwordSalt,
        wrappedMvk: out.wrappedMvk,
        passwordHint: hint?.trim() || undefined,
      })
      setMvk(out.mvkRaw)
    },
    [activateMutation],
  )

  const unlock = React.useCallback(
    async (password: string, remember?: boolean) => {
      if (!envelope) throw new Error("Envelope vault indisponible.")
      const m = await unlockVaultCrypto(password, envelope)
      setMvk(m)
      if (remember) {
        // Persistance best-effort : un échec ici (IndexedDB indispo, quota,
        // mode privé) ne doit pas casser le déverrouillage.
        rememberMvk(m, envelope, REMEMBER_TTL_MS).catch((err) => {
          console.warn("[vault] persistance device échouée:", err)
        })
      }
    },
    [envelope],
  )

  const lock = React.useCallback(() => {
    setMvk(null)
    forgetMvk()
  }, [])

  const value = React.useMemo<VaultContextValue>(
    () => ({ status, activate, unlock, lock }),
    [status, activate, unlock, lock],
  )

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

export function useVault(): VaultContextValue {
  const ctx = React.useContext(VaultContext)
  if (!ctx) throw new Error("useVault doit être appelé dans un VaultProvider.")
  return ctx
}

/**
 * Helper hook pour déchiffrer les métadonnées d'une liste d'items.
 * Le résultat est mémoïsé tant que la MVK et la liste ne changent pas.
 */
export function useDecryptedItems<
  T extends {
    _id: string
    wrappedDek: string
    metaIv: string
    encryptedMetadata: string
  },
>(
  items: T[] | undefined,
): Array<T & { metadata: Record<string, unknown> | null }> | undefined {
  const { status } = useVault()
  const [decoded, setDecoded] = React.useState<
    Record<string, Record<string, unknown>>
  >({})

  React.useEffect(() => {
    if (status.phase !== "unlocked" || !items) return
    let cancelled = false
    void (async () => {
      const next: Record<string, Record<string, unknown>> = {}
      for (const it of items) {
        if (decoded[it._id]) {
          next[it._id] = decoded[it._id]!
          continue
        }
        try {
          next[it._id] = await decryptMetadataCrypto(
            status.mvk,
            it.wrappedDek,
            it.metaIv,
            it.encryptedMetadata,
          )
        } catch {
          // ignore — affichera "—" comme nom
        }
      }
      if (!cancelled) setDecoded(next)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, status.phase])

  if (!items) return undefined
  return items.map((it) => ({ ...it, metadata: decoded[it._id] ?? null }))
}
