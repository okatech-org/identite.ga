import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/lib/api';
import {
  activateVault as activateVaultCrypto,
  decryptMetadata as decryptMetadataCrypto,
  unlockVault as unlockVaultCrypto,
  type ActivationOutput,
} from '@/lib/vault-crypto';

type VaultStatus =
  | { phase: 'loading' }
  | { phase: 'unauth' }
  | { phase: 'inactive' }
  | { phase: 'locked'; hasRecovery: boolean; passwordHint?: string }
  | { phase: 'unlocked'; mvk: Uint8Array; hasRecovery: boolean };

type VaultContextValue = {
  status: VaultStatus;
  /** Active le vault avec un nouveau mot de passe. */
  activate: (password: string, hint?: string) => Promise<void>;
  /** Déverrouille le vault (recharge MVK en mémoire). */
  unlock: (password: string) => Promise<void>;
  /** Verrouille — efface la MVK en mémoire. */
  lock: () => void;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const keyStatus = useQuery(api.vault.keys.status, isAuthenticated ? {} : 'skip');
  const envelope = useQuery(api.vault.keys.getEnvelope, isAuthenticated ? {} : 'skip');
  const activateMutation = useMutation(api.vault.keys.activate);

  const [mvk, setMvk] = useState<Uint8Array | null>(null);

  // Reset MVK quand l'utilisateur se déconnecte.
  useEffect(() => {
    if (!isAuthenticated) setMvk(null);
  }, [isAuthenticated]);

  const status: VaultStatus = useMemo(() => {
    if (isLoading) return { phase: 'loading' };
    if (!isAuthenticated) return { phase: 'unauth' };
    if (keyStatus === undefined) return { phase: 'loading' };
    if (!keyStatus.activated) return { phase: 'inactive' };
    if (mvk) return { phase: 'unlocked', mvk, hasRecovery: keyStatus.hasRecovery };
    return { phase: 'locked', hasRecovery: keyStatus.hasRecovery, passwordHint: keyStatus.passwordHint };
  }, [isLoading, isAuthenticated, keyStatus, mvk]);

  const activate = useCallback(
    async (password: string, hint?: string) => {
      const out: ActivationOutput = await activateVaultCrypto(password);
      await activateMutation({
        algorithm: out.algorithm,
        kdf: out.kdf,
        kdfIterations: out.kdfIterations,
        passwordSalt: out.passwordSalt,
        wrappedMvk: out.wrappedMvk,
        passwordHint: hint?.trim() || undefined,
      });
      setMvk(out.mvkRaw);
    },
    [activateMutation],
  );

  const unlock = useCallback(
    async (password: string) => {
      if (!envelope) throw new Error('Envelope vault indisponible.');
      const m = await unlockVaultCrypto(password, envelope);
      setMvk(m);
    },
    [envelope],
  );

  const lock = useCallback(() => setMvk(null), []);

  return (
    <VaultContext.Provider value={{ status, activate, unlock, lock }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault doit être appelé dans un VaultProvider.');
  return ctx;
}

/**
 * Helper hook pour décrypter les métadonnées d'une liste d'items.
 * Le résultat est mémoïsé tant que la MVK et la liste ne changent pas.
 */
export function useDecryptedItems<
  T extends {
    _id: string;
    wrappedDek: string;
    metaIv: string;
    encryptedMetadata: string;
  },
>(items: T[] | undefined): Array<T & { metadata: Record<string, unknown> | null }> | undefined {
  const { status } = useVault();
  const [decoded, setDecoded] = useState<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    if (status.phase !== 'unlocked' || !items) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, Record<string, unknown>> = {};
      for (const it of items) {
        if (decoded[it._id]) {
          next[it._id] = decoded[it._id];
          continue;
        }
        try {
          next[it._id] = await decryptMetadataCrypto(
            status.mvk,
            it.wrappedDek,
            it.metaIv,
            it.encryptedMetadata,
          );
        } catch {
          // ignore — affichera "—" comme nom
        }
      }
      if (!cancelled) setDecoded(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, status.phase]);

  if (!items) return undefined;
  return items.map((it) => ({ ...it, metadata: decoded[it._id] ?? null }));
}
