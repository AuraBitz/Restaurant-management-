import type { MenuCategoryRow, RestaurantThaliRow } from '../types/menu';

export function parseMenuCategories(raw: unknown): MenuCategoryRow[] {
  if (Array.isArray(raw)) return raw as MenuCategoryRow[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function countThaliItems(thali: RestaurantThaliRow): number {
  return parseMenuCategories(thali.menu_items).reduce(
    (sum, cat) => sum + (cat.items?.length ?? 0),
    0
  );
}

export function thaliCoverImage(thali: RestaurantThaliRow): string | null {
  if (thali.thali_image) return thali.thali_image;
  for (const cat of parseMenuCategories(thali.menu_items)) {
    const withImage = cat.items?.find((item) => item.image);
    if (withImage?.image) return withImage.image;
  }
  return null;
}
