import { useCallback, useEffect, useRef, useState } from 'react';
import { getPublicLiveTableMatrix } from '../services/api/live-table-matrix.api';
import type { LiveTablesMatrix } from '../types/live-tables';

export const LIVE_MATRIX_POLL_MS = 3000;

export function useLiveTableMatrixPoll(restaurantId: string | undefined) {
  const [matrixData, setMatrixData] = useState<LiveTablesMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const matrixJsonRef = useRef('');

  const applyMatrix = useCallback((matrix: LiveTablesMatrix | null) => {
    const nextJson = JSON.stringify(matrix ?? null);
    const changed = nextJson !== matrixJsonRef.current;
    if (changed) {
      matrixJsonRef.current = nextJson;
      setMatrixData(matrix);
    }
    setLastSyncedAt(new Date());
    return changed;
  }, []);

  useEffect(() => {
    if (!restaurantId) return undefined;

    let cancelled = false;

    const fetchMatrix = async (isInitial = false) => {
      if (!isInitial && document.visibilityState !== 'visible') return;

      try {
        const matrix = await getPublicLiveTableMatrix(restaurantId);
        if (!cancelled) applyMatrix(matrix);
      } catch {
        // Keep last good snapshot on background poll failures.
      } finally {
        if (!cancelled && isInitial) setLoading(false);
      }
    };

    setLoading(true);
    matrixJsonRef.current = '';
    fetchMatrix(true);

    const timer = window.setInterval(() => fetchMatrix(false), LIVE_MATRIX_POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchMatrix(false);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [restaurantId, applyMatrix]);

  const refetchMatrix = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const matrix = await getPublicLiveTableMatrix(restaurantId);
      applyMatrix(matrix);
    } catch {
      // ignore
    }
  }, [restaurantId, applyMatrix]);

  return { matrixData, loading, lastSyncedAt, refetchMatrix };
}
