import type { RestaurantListItem, RestaurantMasterRow } from '../types/restaurant';

const RESTAURANT_ICONS = ['🍽️', '🍝', '🍛', '🥘', '🍜', '🍱', '🌮', '🍔', '🍣', '🥗'];

function pickIcon(id: number): string {
  return RESTAURANT_ICONS[id % RESTAURANT_ICONS.length];
}

function formatAddress(row: RestaurantMasterRow): string {
  return [row.restaurant_address, row.city, row.state, row.country]
    .filter((part) => part && String(part).trim())
    .join(', ');
}

export function mapRestaurantRow(row: RestaurantMasterRow): RestaurantListItem {
  const city = row.city?.trim() || 'Your city';
  const address = formatAddress(row) || 'Address not available';

  return {
    id: row.id,
    name: row.restaurant_name,
    category: city.toLowerCase().replace(/\s+/g, '-'),
    cuisine: city,
    rating: 4.5,
    reviews: 0,
    distance: row.city ? `In ${row.city}` : 'Nearby',
    priceRange: '₹',
    image: pickIcon(row.id),
    deliveryTime: '30-40 min',
    isOpen: row.status === 'online',
    phone: row.restaurant_mobile || '—',
    email: row.restaurant_email || '—',
    address,
    city,
    openingHours: 'Open daily',
    description: `${row.restaurant_name} — book your table and enjoy dining with us.`,
  };
}
