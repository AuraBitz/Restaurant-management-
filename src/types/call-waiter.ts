export interface RestaurantCallWaiterRow {
  id: number;
  restaurant_id: number;
  floor_id: number;
  table_id: number;
  is_ring: boolean;
  ring_count: number;
  calling_text?: Record<string, string> | string | null;
  created_at: string;
  updated_at?: string;
  restaurant_name?: string | null;
  floor_no?: number | null;
  table_number?: string | null;
}

export interface CreateCallWaiterPayload {
  restaurant_id: number;
  floor_id: number;
  table_id: number;
  is_ring: boolean;
  calling_text?: string | null;
}
