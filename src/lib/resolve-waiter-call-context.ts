import type { ActiveBookingSession } from './active-booking-session';
import { resolveBookingTableId } from './live-tables-utils';
import type { LiveCanvasTable, LiveTablesMatrix } from '../types/live-tables';

export interface WaiterCallContext {
  restaurant_id: number;
  floor_id: number;
  table_id: number;
  tableLabel: string;
}

function findCanvasTable(
  matrix: LiveTablesMatrix | null,
  canvasTableId: string
): { table: LiveCanvasTable; floorId: number | null } | null {
  if (!matrix?.floors?.length) return null;

  for (const floor of matrix.floors) {
    const table = floor.tables.find((t) => t.id === canvasTableId);
    if (table) {
      return { table, floorId: floor.floorId ?? null };
    }
  }

  return null;
}

export function resolveWaiterCallContext(
  session: ActiveBookingSession,
  matrix: LiveTablesMatrix | null
): WaiterCallContext | null {
  if (!session?.restaurantId || !session.canvasTableIds?.length) return null;

  for (const canvasId of session.canvasTableIds) {
    const found = findCanvasTable(matrix, canvasId);
    if (!found) continue;

    const tableId = resolveBookingTableId(found.table);
    if (!tableId || !found.floorId) continue;

    return {
      restaurant_id: session.restaurantId,
      floor_id: found.floorId,
      table_id: tableId,
      tableLabel: found.table.label,
    };
  }

  return null;
}
