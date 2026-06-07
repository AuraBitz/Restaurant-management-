import Http from '../http';
import type {
  CreateCallWaiterPayload,
  RestaurantCallWaiterRow,
} from '../../types/call-waiter';

interface BackendItemResponse<T> {
  success?: boolean;
  data?: T | null;
  message?: string;
}

export const createPublicCallWaiter = async (
  payload: CreateCallWaiterPayload
): Promise<RestaurantCallWaiterRow> => {
  const response = (await Http.post({
    url: '/public/restaurant-call-waiter',
    data: payload,
    messageSettings: { hideSuccessMessage: true, hideErrorMessage: true },
  })) as BackendItemResponse<RestaurantCallWaiterRow>;

  if (!response?.data?.id) {
    throw new Error(response?.message || 'Failed to call waiter');
  }

  return response.data;
};

export const getRecentCallWaiterByRestaurant = async (
  restaurantId: string | number,
  minutes = 30
): Promise<RestaurantCallWaiterRow[]> => {
  const response = (await Http.get({
    url: `/public/restaurant-call-waiter/by-restaurant/${restaurantId}?minutes=${minutes}`,
    messageSettings: { hideSuccessMessage: true, hideErrorMessage: true },
  })) as BackendItemResponse<RestaurantCallWaiterRow[]>;

  return Array.isArray(response?.data) ? response.data : [];
};
