export interface ActiveBookingSession {
  restaurantId: number;
  bookingIds: number[];
  canvasTableIds: string[];
  tableLabels: string[];
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  personsCount: number;
  floorId?: string;
  customerId?: number;
  tableId?: number;
  activeOrderId?: number;
}

const STORAGE_KEY = 'tablemate_active_booking';

export function saveActiveBookingSession(session: ActiveBookingSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getActiveBookingSession(): ActiveBookingSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveBookingSession;
    if (!parsed?.restaurantId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function patchActiveBookingSession(
  patch: Partial<ActiveBookingSession>
): ActiveBookingSession | null {
  const current = getActiveBookingSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveActiveBookingSession(next);
  return next;
}

export function clearActiveBookingSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
