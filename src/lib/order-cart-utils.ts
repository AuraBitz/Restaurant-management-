import type { MenuItemRow, RestaurantThaliRow } from '../types/menu';
import { encodeMenuOrderItemId } from './menu-order-item-id';
import { parseMenuCategories } from './menu-utils';
import type { ActiveBookingSession } from './active-booking-session';
import { resolveBookingTableId } from './live-tables-utils';
import { resolveWaiterCallContext } from './resolve-waiter-call-context';
import type { LiveTablesMatrix } from '../types/live-tables';

export interface MenuItemMeta {
  id: number;
  name: string;
  price: number;
  image?: string;
}

export interface OrderCartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  veg: boolean;
  image?: string;
}

export function buildMenuItemMap(
  thalis: RestaurantThaliRow[]
): Map<number, MenuItemMeta> {
  const map = new Map<number, MenuItemMeta>();

  for (const thali of thalis) {
    const thaliId = thali.id;
    if (thaliId == null) continue;

    for (const category of parseMenuCategories(thali.menu_items)) {
      const categoryId = category.id ?? 0;
      for (const item of category.items ?? []) {
        if (item.id == null) continue;
        const orderItemId = encodeMenuOrderItemId(
          thaliId,
          categoryId,
          item.id
        );
        map.set(orderItemId, {
          id: orderItemId,
          name: item.name,
          price: item.amount,
          image: item.image || undefined,
        });
      }
    }
  }

  return map;
}

export function cartItemsFromOrderItemIds(
  itemIds: number[],
  menuMap: Map<number, MenuItemMeta>
): OrderCartItem[] {
  const counts = new Map<number, number>();

  for (const itemId of itemIds) {
    counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
  }

  const items: OrderCartItem[] = [];

  counts.forEach((quantity, id) => {
    const meta = menuMap.get(id);
    items.push({
      id,
      name: meta?.name ?? `Item #${id}`,
      price: meta?.price ?? 0,
      quantity,
      veg: true,
      image: meta?.image,
    });
  });

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export function orderItemIdsFromCart(cartItems: OrderCartItem[]): number[] {
  const ids: number[] = [];
  for (const item of cartItems) {
    for (let i = 0; i < item.quantity; i += 1) {
      ids.push(item.id);
    }
  }
  return ids;
}

export function resolveOrderContext(
  session: ActiveBookingSession,
  matrix: LiveTablesMatrix | null
): {
  restaurantId: number;
  customerId?: number;
  tableId: number;
  floorId: number;
} | null {
  const resolveFloorMasterId = (tableMasterId: number): number | null => {
    if (!matrix?.floors?.length) return null;

    for (const floor of matrix.floors) {
      if (session.floorId && floor.id === session.floorId && floor.floorId) {
        return floor.floorId;
      }
      const matched = floor.tables.some(
        (table) => resolveBookingTableId(table) === tableMasterId
      );
      if (matched && floor.floorId) {
        return floor.floorId;
      }
    }

    return null;
  };

  if (session.tableId) {
    const floorId = resolveFloorMasterId(session.tableId);
    if (floorId) {
      return {
        restaurantId: session.restaurantId,
        customerId: session.customerId,
        tableId: session.tableId,
        floorId,
      };
    }
  }

  const waiterCtx = resolveWaiterCallContext(session, matrix);
  if (!waiterCtx) return null;

  return {
    restaurantId: session.restaurantId,
    customerId: session.customerId,
    tableId: waiterCtx.table_id,
    floorId: waiterCtx.floor_id,
  };
}

export function cartTotal(items: OrderCartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function unknownMenuItem(id: number): MenuItemMeta {
  return { id, name: `Item #${id}`, price: 0 };
}

export function mergeMenuItem(
  item: MenuItemRow,
  onAdd: (payload: {
    id: number;
    name: string;
    price: number;
    veg: boolean;
    image?: string;
  }) => void
): void {
  if (item.id == null) return;
  onAdd({
    id: item.id,
    name: item.name,
    price: item.amount,
    veg: true,
    image: item.image || undefined,
  });
}
