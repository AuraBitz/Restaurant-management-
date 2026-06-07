import { useCallback, useEffect, useRef, useState } from 'react';
import { getRecentCallWaiterByRestaurant } from '../services/api/call-waiter.api';
import type { RestaurantCallWaiterRow } from '../types/call-waiter';

export const RING_CALL_POLL_MS = 3000;

export function useRestaurantRingPoll(restaurantId: string | number | undefined) {
  const [calls, setCalls] = useState<RestaurantCallWaiterRow[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(() => new Set());
  const seenIdsRef = useRef<Set<number>>(new Set());

  const dismissCall = useCallback((id: number) => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!restaurantId) return undefined;

    let cancelled = false;

    const fetchCalls = async () => {
      if (document.visibilityState !== 'visible') return;

      try {
        const rows = await getRecentCallWaiterByRestaurant(restaurantId);
        if (cancelled) return;
        setCalls(rows);
      } catch {
        // keep last snapshot
      }
    };

    fetchCalls();
    const timer = window.setInterval(fetchCalls, RING_CALL_POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchCalls();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [restaurantId]);

  const activeCalls = calls.filter((call) => !dismissedIds.has(call.id));

  const newCalls = activeCalls.filter((call) => !seenIdsRef.current.has(call.id));
  useEffect(() => {
    activeCalls.forEach((call) => seenIdsRef.current.add(call.id));
  }, [activeCalls]);

  return { activeCalls, newCalls, dismissCall };
}
