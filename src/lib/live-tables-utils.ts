import type {
  FloorDesignId,
  LiveCanvasTable,
  LiveFloorState,
} from '../types/live-tables';

export const FLOOR_DESIGNS: Record<
  FloorDesignId,
  { label: string; background: string; accent: string }
> = {
  wood: {
    label: 'Wood Planks',
    background:
      'repeating-linear-gradient(90deg, #6b4a38 0px, #6b4a38 44px, #543628 44px, #543628 46px)',
    accent: 'rgba(255,255,255,0.08)',
  },
  marble: {
    label: 'Marble',
    background:
      'linear-gradient(135deg, #e8e4df 0%, #d4cfc8 35%, #f5f2ee 50%, #c9c4bc 100%)',
    accent: 'rgba(0,0,0,0.04)',
  },
  tile: {
    label: 'Ceramic Tile',
    background:
      'repeating-linear-gradient(0deg, transparent, transparent 47px, #b8b0a4 47px, #b8b0a4 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, #b8b0a4 47px, #b8b0a4 48px), #d9d2c8',
    accent: 'rgba(0,0,0,0.03)',
  },
  slate: {
    label: 'Dark Slate',
    background:
      'repeating-linear-gradient(90deg, #2a2d32 0px, #2a2d32 40px, #1f2226 40px, #1f2226 42px)',
    accent: 'rgba(255,255,255,0.06)',
  },
};

function defaultTableDimensions(table: LiveCanvasTable) {
  const segments = table.mergeSegments ?? 1;
  const unit =
    table.capacity >= 16
      ? 112
      : table.capacity >= 12
        ? 104
        : table.capacity >= 8
          ? 96
          : table.capacity >= 6
            ? 88
            : 80;
  const width = Math.round(unit + Math.max(0, table.capacity - 4) * 3);
  const height = unit;
  return { width, height, unit, segments };
}

export function tableDimensions(table: LiveCanvasTable) {
  const segments = table.mergeSegments ?? 1;
  const customW = table.sizeW ?? table.mergeSpanW;
  const customH = table.sizeH ?? table.mergeSpanH;

  if (customW && customH) {
    const unit = Math.round(Math.min(customW, customH) * 0.85);
    return { width: customW, height: customH, unit, segments };
  }

  return defaultTableDimensions(table);
}

export function tableSeatCount(table: LiveCanvasTable): number {
  return table.chairSlots?.length ?? table.capacity;
}

export function isTableBookable(table: LiveCanvasTable): boolean {
  return table.status === 'free';
}

export function resolveBookingTableId(table: LiveCanvasTable): number | null {
  if (table.sourceTableId && table.sourceTableId > 0) return table.sourceTableId;
  const fromPart = table.mergedParts?.find(
    (part) => part.sourceTableId && part.sourceTableId > 0
  );
  return fromPart?.sourceTableId ?? null;
}

export const FLOOR_CANVAS_MIN_WIDTH = 900;
export const FLOOR_CANVAS_MIN_HEIGHT = 680;
const FLOOR_CANVAS_PADDING = 80;

function tableFootprint(table: LiveCanvasTable) {
  const { width, height } = tableDimensions(table);
  return { x: table.x, y: table.y, width, height };
}

/** Canvas size grows with table layout (minimum 900 × 680). */
export function computeFloorCanvasSize(
  floor?: LiveFloorState | null
): { width: number; height: number } {
  let width = FLOOR_CANVAS_MIN_WIDTH;
  let height = FLOOR_CANVAS_MIN_HEIGHT;
  if (!floor) return { width, height };

  for (const table of floor.tables) {
    const footprint = tableFootprint(table);
    width = Math.max(width, footprint.x + footprint.width + FLOOR_CANVAS_PADDING);
    height = Math.max(height, footprint.y + footprint.height + FLOOR_CANVAS_PADDING);
  }

  for (const chair of floor.chairs) {
    width = Math.max(width, chair.x + 48 + FLOOR_CANVAS_PADDING);
    height = Math.max(height, chair.y + 48 + FLOOR_CANVAS_PADDING);
  }

  return { width: Math.ceil(width), height: Math.ceil(height) };
}

export function floorCanvasSize(floor?: LiveFloorState) {
  return computeFloorCanvasSize(floor);
}

export const TABLE_STATUS_UI = {
  free: {
    label: 'AVAILABLE',
    dot: 'bg-emerald-400',
    table: 'from-emerald-400 via-emerald-600 to-emerald-800 border-emerald-200/30',
    glow: 'shadow-[0_8px_32px_rgba(16,185,129,0.35)]',
  },
  busy: {
    label: 'BOOKED',
    dot: 'bg-red-400',
    table: 'from-red-500 via-red-700 to-red-900 border-red-300/40',
    glow: 'shadow-[0_8px_32px_rgba(220,38,38,0.5)]',
  },
  reserved: {
    label: 'RESERVED',
    dot: 'bg-amber-400',
    table: 'from-amber-400 via-amber-600 to-amber-800 border-amber-200/30',
    glow: 'shadow-[0_8px_32px_rgba(245,158,11,0.35)]',
  },
  selected: {
    label: 'SELECTED',
    dot: 'bg-orange-300',
    table: 'from-orange-400 via-orange-600 to-orange-800 border-orange-200/50',
    glow: 'shadow-[0_0_28px_rgba(251,146,60,0.55)] ring-2 ring-orange-300/70',
  },
} as const;
