import Http from '../http';
import type { LiveTableMatrixRow, LiveTablesMatrix } from '../../types/live-tables';

interface BackendItemResponse<T> {
  success?: boolean;
  data?: T | null;
}

export const getPublicLiveTableMatrix = async (
  restaurantId: string | number
): Promise<LiveTablesMatrix | null> => {
  const response = (await Http.get({
    url: `/public/restaurant-live-table-matrix-master/by-restaurant/${restaurantId}`,
    messageSettings: { hideSuccessMessage: true, hideErrorMessage: true },
  })) as BackendItemResponse<LiveTableMatrixRow>;

  return response?.data?.matrix ?? null;
};
