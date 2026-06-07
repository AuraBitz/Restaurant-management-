import React, { useEffect, useRef } from 'react';
import { callPopupMessage, isLatestActionRing } from '../../lib/call-waiter-messages';
import { useRestaurantRingPoll } from '../../hooks/use-restaurant-ring-poll';
import type { RestaurantCallWaiterRow } from '../../types/call-waiter';

interface RestaurantRingCallerProps {
  restaurantId: string | number;
}

function playRingTone() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    window.setTimeout(() => void ctx.close(), 500);
  } catch {
    // ignore audio errors
  }
}

function RingPopupCard({
  call,
  onDismiss,
}: {
  call: RestaurantCallWaiterRow;
  onDismiss: (id: number) => void;
}) {
  const isRing = isLatestActionRing(call);

  return (
    <div
      role="alert"
      className={`pointer-events-auto w-full max-w-sm rounded-2xl border-2 shadow-2xl animate-slide-down ${
        isRing
          ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-100'
          : 'border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${
            isRing ? 'bg-orange-500 text-white animate-pulse' : 'bg-blue-600 text-white'
          }`}
        >
          {isRing ? '🔔' : '💬'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            {isRing ? 'Table Ring' : 'Guest Message'}
          </p>
          <p className="mt-1 text-base font-bold leading-snug text-gray-900">
            {callPopupMessage(call)}
          </p>
          {(call.ring_count ?? 0) > 1 && isRing ? (
            <p className="mt-1 text-xs font-semibold text-orange-700">
              Ring count: {call.ring_count}
            </p>
          ) : null}
          {call.floor_no != null ? (
            <p className="mt-1 text-xs text-gray-600">Floor {call.floor_no}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(call.id)}
          className="rounded-lg px-2 py-1 text-sm font-semibold text-gray-500 hover:bg-black/5 hover:text-gray-800"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
      <div className="border-t border-black/5 px-4 py-2">
        <button
          type="button"
          onClick={() => onDismiss(call.id)}
          className={`w-full rounded-xl py-2 text-sm font-bold text-white ${
            isRing ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

const RestaurantRingCaller: React.FC<RestaurantRingCallerProps> = ({ restaurantId }) => {
  const { activeCalls, dismissCall } = useRestaurantRingPoll(restaurantId);
  const lastRingIdRef = useRef<number | null>(null);

  useEffect(() => {
    const ringCall = activeCalls.find((c) => c.is_ring);
    if (!ringCall || ringCall.id === lastRingIdRef.current) return;
    lastRingIdRef.current = ringCall.id;
    playRingTone();
  }, [activeCalls]);

  if (activeCalls.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[10002] flex w-[min(100vw-2rem,22rem)] flex-col gap-3">
      {activeCalls.slice(0, 5).map((call) => (
        <RingPopupCard key={call.id} call={call} onDismiss={dismissCall} />
      ))}
    </div>
  );
};

export default RestaurantRingCaller;
