import Http from '../http';

export interface PublicBookingCreatePayload {
  restaurant_id: number;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  persons_count: number;
  table_id?: number | null;
  booking_status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export interface RestaurantBookingRow {
  id: number;
  restaurant_id: number;
  customer_name?: string | null;
  customer_phone?: string | null;
  booking_date?: string | null;
  booking_time?: string | null;
  booking_status: string;
  persons_count: number;
  table_id?: number | null;
  table_number?: string | null;
  restaurant_name?: string | null;
}

interface BackendItemResponse<T> {
  success?: boolean;
  data?: T | null;
  message?: string;
}

export const createPublicBooking = async (
  payload: PublicBookingCreatePayload
): Promise<RestaurantBookingRow> => {
  const response = (await Http.post({
    url: '/public/restaurant-booking-master',
    data: {
      booking_status: 'confirmed',
      ...payload,
    },
    messageSettings: { hideSuccessMessage: true },
  })) as BackendItemResponse<RestaurantBookingRow>;

  if (!response?.data?.id) {
    throw new Error(response?.message || 'Booking failed');
  }

  return response.data;
};
