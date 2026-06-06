export type RestaurantStatus = 'online' | 'offline';

export interface RestaurantMasterRow {
  id: number;
  restaurant_name: string;
  restaurant_address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  restaurant_mobile?: string | null;
  status: RestaurantStatus;
  owner_name?: string | null;
  restaurant_email?: string | null;
}

export interface RestaurantListItem {
  id: number;
  name: string;
  category: string;
  cuisine: string;
  rating: number;
  reviews: number;
  distance: string;
  priceRange: string;
  image: string;
  deliveryTime: string;
  isOpen: boolean;
  phone: string;
  email: string;
  address: string;
  city: string;
  openingHours: string;
  description: string;
}
