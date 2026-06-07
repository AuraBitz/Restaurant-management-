export type MenuAvailableStatus = 'available' | 'not_available';

export interface MenuItemRow {
  id?: number;
  name: string;
  amount: number;
  image?: string | null;
  available_status?: MenuAvailableStatus;
}

export interface MenuCategoryRow {
  id?: number;
  title: string;
  items: MenuItemRow[];
  available_status?: MenuAvailableStatus;
}

export interface RestaurantThaliRow {
  id: number;
  restaurant_id: number;
  restaurant_thali_name: string;
  thali_image?: string | null;
  menu_items: MenuCategoryRow[];
  created_at?: string;
  restaurant_name?: string | null;
}
