import Http from '../http';

export type RestaurantOrderStatus = 'pending' | 'on_dine' | 'completed';

export interface RestaurantOrderMasterRow {
  id: number;
  order_number: number;
  customer_id?: number | null;
  floor_id?: number | null;
  table_id?: number | null;
  restaurant_id: number;
  order_items_id?: number[];
  status: RestaurantOrderStatus | string;
  created_at?: string;
}

export interface EnsureActiveOrderPayload {
  restaurant_id: number;
  customer_id?: number | null;
  booking_id?: number | null;
  floor_id: number;
  table_id: number;
  order_items_id?: number[];
  status?: RestaurantOrderStatus;
}

interface BackendItemResponse<T> {
  success?: boolean;
  data?: T | null;
  message?: string;
  statusCode?: number;
  code?: string;
}

function isNotFoundError(error: unknown): boolean {
  const err = error as {
    response?: { status?: number; data?: { code?: string } };
  };
  return (
    err?.response?.status === 404 ||
    err?.response?.data?.code === 'NOT_FOUND'
  );
}

export { isNotFoundError };

export const getPublicActiveOrder = async (params: {
  restaurant_id: number;
  table_id: number;
  customer_id?: number | null;
}): Promise<RestaurantOrderMasterRow | null> => {
  try {
    const search = new URLSearchParams({
      restaurant_id: String(params.restaurant_id),
      table_id: String(params.table_id),
    });
    if (params.customer_id != null) {
      search.set('customer_id', String(params.customer_id));
    }

    const response = (await Http.get({
      url: `/public/restaurant-order-master/active?${search.toString()}`,
      messageSettings: { hideSuccessMessage: true, hideErrorMessage: true },
    })) as BackendItemResponse<RestaurantOrderMasterRow | null>;

    return response?.data ?? null;
  } catch {
    return null;
  }
};

export const ensurePublicActiveOrder = async (
  payload: EnsureActiveOrderPayload
): Promise<RestaurantOrderMasterRow> => {
  const response = (await Http.post({
    url: '/public/restaurant-order-master/ensure-active',
    data: {
      status: 'pending',
      order_items_id: [],
      ...payload,
    },
    messageSettings: { hideSuccessMessage: true, hideErrorMessage: true },
  })) as BackendItemResponse<RestaurantOrderMasterRow>;

  if (!response?.data?.id) {
    throw new Error(response?.message || 'Could not start order');
  }

  return response.data;
};

export const getPublicOrderById = async (
  orderId: number
): Promise<RestaurantOrderMasterRow | null> => {
  try {
    const response = (await Http.get({
      url: `/public/restaurant-order-master/${orderId}`,
      messageSettings: { hideSuccessMessage: true, hideErrorMessage: true },
    })) as BackendItemResponse<RestaurantOrderMasterRow>;

    return response?.data ?? null;
  } catch {
    return null;
  }
};

export const updatePublicOrder = async (
  orderId: number,
  payload: {
    order_items_id?: number[];
    append_order_item_id?: number;
    status?: RestaurantOrderStatus;
  }
): Promise<RestaurantOrderMasterRow> => {
  const response = (await Http.patch({
    url: `/public/restaurant-order-master/${orderId}`,
    data: payload,
    messageSettings: { hideSuccessMessage: true, hideErrorMessage: true },
  })) as BackendItemResponse<RestaurantOrderMasterRow>;

  if (!response?.data?.id) {
    throw new Error(response?.message || 'Could not update order');
  }

  return response.data;
};
