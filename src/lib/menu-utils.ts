import type { MenuCategoryRow, MenuItemRow, RestaurantThaliRow } from '../types/menu';

export function normalizeAvailableStatus(
  value?: string | null
): 'available' | 'not_available' {
  return value === 'not_available' ? 'not_available' : 'available';
}

export function isMenuItemAvailable(
  item: MenuItemRow,
  category?: MenuCategoryRow
): boolean {
  if (normalizeAvailableStatus(category?.available_status) === 'not_available') {
    return false;
  }
  return normalizeAvailableStatus(item.available_status) === 'available';
}

export function withCategoryAvailability(category: MenuCategoryRow): MenuCategoryRow {
  const categoryUnavailable =
    normalizeAvailableStatus(category.available_status) === 'not_available';

  return {
    ...category,
    items: (category.items ?? []).map((item) => ({
      ...item,
      available_status: categoryUnavailable
        ? 'not_available'
        : normalizeAvailableStatus(item.available_status),
    })),
  };
}

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
