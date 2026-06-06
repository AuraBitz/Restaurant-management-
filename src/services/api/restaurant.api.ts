import Http from '../http';
import type { RestaurantMasterRow } from '../../types/restaurant';

interface BackendListResponse<T> {
  success?: boolean;
  data?: T[];
  meta?: { total?: number; skip?: number; limit?: number };
}

interface BackendItemResponse<T> {
  success?: boolean;
  data?: T;
}

export interface RestaurantListResult {
  rows: RestaurantMasterRow[];
  total: number;
}

export const getPublicRestaurantList = async (params?: {
  skip?: number;
  limit?: number;
  search?: string;
}): Promise<RestaurantListResult> => {
  const response = (await Http.post({
    url: '/public/restaurant-master/list',
    data: {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 100,
      search: params?.search?.trim() || undefined,
    },
    messageSettings: { hideSuccessMessage: true, hideErrorMessage: true },
  })) as BackendListResponse<RestaurantMasterRow>;

  const rows = Array.isArray(response?.data) ? response.data : [];
  const total =
    typeof response?.meta?.total === 'number' ? response.meta.total : rows.length;

  return { rows, total };
};

export const getPublicRestaurantById = async (
  id: string | number
): Promise<RestaurantMasterRow | null> => {
  const response = (await Http.get({
    url: `/public/restaurant-master/${id}`,
    messageSettings: { hideSuccessMessage: true, hideErrorMessage: true },
  })) as BackendItemResponse<RestaurantMasterRow>;

  return response?.data ?? null;
};
