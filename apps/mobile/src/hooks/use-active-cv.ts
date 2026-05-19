import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConvexAuth, useQuery } from 'convex/react';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';

const LS_KEY = 'idn:icv:active-cv-id';

/**
 * Sélection du CV actif persistée dans AsyncStorage.
 * Fallback : default → premier CV.
 *
 * Exposé : { cvs, activeCvId, activeCv, setActiveCvId, isLoading }
 */
export function useActiveCv() {
  const { isAuthenticated } = useConvexAuth();
  const cvs = useQuery(api.cv.cvs.listMine, isAuthenticated ? {} : 'skip');
  const [storedId, setStoredId] = useState<Id<'citizenCv'> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(LS_KEY).then((raw) => {
      if (cancelled) return;
      if (raw) setStoredId(raw as Id<'citizenCv'>);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeCvId = useMemo<Id<'citizenCv'> | null>(() => {
    if (!cvs || cvs.length === 0) return null;
    if (storedId && cvs.some((c) => c._id === storedId)) return storedId;
    const def = cvs.find((c) => c.isDefault);
    return def?._id ?? cvs[0]!._id;
  }, [cvs, storedId]);

  const activeCv = useMemo(
    () => cvs?.find((c) => c._id === activeCvId) ?? null,
    [cvs, activeCvId],
  );

  const setActiveCvId = useCallback((id: Id<'citizenCv'>) => {
    AsyncStorage.setItem(LS_KEY, id as unknown as string).catch(() => {
      // silently ignore — la session retombera sur le default au prochain mount
    });
    setStoredId(id);
  }, []);

  return {
    cvs,
    activeCvId,
    activeCv,
    setActiveCvId,
    isLoading: !hydrated || cvs === undefined,
  };
}
