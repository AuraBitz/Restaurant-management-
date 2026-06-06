import Http from '../http';
import type { RestaurantThaliRow } from '../../types/menu';

interface BackendListResponse<T> {
  success?: boolean;
  data?: T[];
}

export const getPublicRestaurantMenus = async (
  restaurantId: string | number
): Promise<RestaurantThaliRow[]> => {
  const response = (await Http.get({
    url: `/public/restaurant-menu-master/by-restaurant/${restaurantId}`,
    messageSettings: { hideSuccessMessage: true, hideErrorMessage: true },
  })) as BackendListResponse<RestaurantThaliRow>;

  return response?.data ?? [];
};
