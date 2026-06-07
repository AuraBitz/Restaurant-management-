export type LiveTableStatus = 'free' | 'busy' | 'reserved' | 'selected';
export type FloorDesignId = 'wood' | 'marble' | 'tile' | 'slate';

export interface TableChairSlot {
  id: string;
  relX: number;
  relY: number;
  w: number;
  h: number;
}

export interface MergedTablePart {
  label: string;
  capacity: number;
  sourceTableId?: number;
}

export interface LiveCanvasTable {
  id: string;
  sourceTableId?: number;
  label: string;
  capacity: number;
  status: LiveTableStatus;
  x: number;
  y: number;
  mergeSegments?: number;
  mergedLabels?: string[];
  mergedParts?: MergedTablePart[];
  mergeSpanW?: number;
  mergeSpanH?: number;
  sizeW?: number;
  sizeH?: number;
  chairSlots?: TableChairSlot[];
  isDisabled?: boolean;
}

export interface LiveCanvasChair {
  id: string;
  x: number;
  y: number;
}

export interface LiveFloorState {
  id: string;
  floorId: number | null;
  label: string;
  floorNo: number;
  floorDesign?: FloorDesignId;
  tables: LiveCanvasTable[];
  chairs: LiveCanvasChair[];
}

export interface LiveTablesMatrix {
  version?: number;
  floors: LiveFloorState[];
  activeFloorId: string;
}

export interface LiveTableMatrixRow {
  id: number;
  restaurant_id: number;
  matrix: LiveTablesMatrix;
}
