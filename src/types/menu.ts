export interface MenuItemRow {
  id?: number;
  name: string;
  amount: number;
  image?: string | null;
}

export interface MenuCategoryRow {
  id?: number;
  title: string;
  items: MenuItemRow[];
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
