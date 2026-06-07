import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { saveActiveBookingSession } from '../../lib/active-booking-session';
import { findCanvasTableForMasterId } from '../../lib/live-tables-utils';
import { getPublicBookingById } from '../../services/api/booking.api';
import { getPublicLiveTableMatrix } from '../../services/api/live-table-matrix.api';

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function formatBookingDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

const ScanLanding: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  const scanParams = useMemo(
    () => ({
      restaurantId: parsePositiveInt(searchParams.get('restaurant_id')),
      customerId: parsePositiveInt(searchParams.get('customer_id')),
      tableId: parsePositiveInt(searchParams.get('table_id')),
      bookingId: parsePositiveInt(searchParams.get('booking_id')),
    }),
    [searchParams]
  );

  useEffect(() => {
    const { restaurantId, customerId, tableId, bookingId } = scanParams;

    if (!restaurantId || !customerId || !tableId || !bookingId) {
      setError('Invalid QR code. Missing restaurant, customer, table, or booking details.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const [booking, matrix] = await Promise.all([
          getPublicBookingById(bookingId),
          getPublicLiveTableMatrix(String(restaurantId)),
        ]);

        if (cancelled) return;

        if (!booking) {
          setError('Booking not found. Please ask staff for a new QR code.');
          return;
        }

        if (
          Number(booking.restaurant_id) !== restaurantId ||
          Number(booking.customer_id) !== customerId ||
          Number(booking.table_id) !== tableId
        ) {
          setError('QR code details do not match the booking record.');
          return;
        }

        const floors = matrix?.floors ?? [];
        const canvasMatch = findCanvasTableForMasterId(floors, tableId);

        if (!canvasMatch) {
          setError('Table is not available on the live floor plan.');
          return;
        }

        saveActiveBookingSession({
          restaurantId,
          bookingIds: [booking.id],
          canvasTableIds: [canvasMatch.canvasTableId],
          tableLabels: [canvasMatch.label],
          customerName: booking.customer_name?.trim() || 'Guest',
          customerPhone: booking.customer_phone?.trim() || '',
          bookingDate: formatBookingDate(booking.booking_date),
          bookingTime: booking.booking_time?.trim() || '',
          personsCount: booking.persons_count || 1,
          floorId: canvasMatch.floorId,
          customerId,
          tableId,
        });

        toast.success('Welcome! Opening your table...', { autoClose: 2000 });
        navigate('/current-restaurant', { replace: true });
      } catch {
        if (!cancelled) {
          setError('Could not open your table session. Please try again.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, scanParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-orange-100 bg-white/90 p-8 text-center shadow-xl backdrop-blur-md">
        {error ? (
          <>
            <div className="text-4xl">⚠️</div>
            <h1 className="mt-4 text-xl font-bold text-gray-900">Scan Failed</h1>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </>
        ) : (
          <>
            <div className="mx-auto size-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">Opening your table</h1>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we connect you to the restaurant...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ScanLanding;
