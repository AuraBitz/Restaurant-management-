import React, { useEffect, useRef, useState } from 'react';
import { FiLock } from 'react-icons/fi';
import type { LiveCanvasChair, LiveCanvasTable, LiveFloorState } from '../../types/live-tables';
import {
  FLOOR_DESIGNS,
  floorCanvasSize,
  isTableBookable,
  TABLE_STATUS_UI,
  tableDimensions,
  tableSeatCount,
} from '../../lib/live-tables-utils';

interface LiveFloorCanvasProps {
  floor: LiveFloorState;
  selectedTableIds: string[];
  onTableSelect: (table: LiveCanvasTable) => void;
  readOnly?: boolean;
  /** User's booked table(s) — shows "YOU ARE HERE" badge in read-only mode */
  hereTableIds?: string[];
  /** width = fill width; contain = fit entire floor in box without scroll */
  fitMode?: 'width' | 'contain';
  /** Hide admin-disabled tables from the floor plan */
  hideDisabledTables?: boolean;
  className?: string;
}

function TableNode({
  table,
  selected,
  onSelect,
  readOnly = false,
  isHere = false,
}: {
  table: LiveCanvasTable;
  selected: boolean;
  onSelect: () => void;
  readOnly?: boolean;
  isHere?: boolean;
}) {
  const bookable = !readOnly && isTableBookable(table);
  const displayStatus = !readOnly && selected ? 'selected' : table.status;
  const meta = TABLE_STATUS_UI[displayStatus] ?? TABLE_STATUS_UI.free;
  const { width, height } = tableDimensions(table);
  const chairs = table.chairSlots ?? [];
  const seatCount = tableSeatCount(table);
  const isMerged = (table.mergeSegments ?? 1) > 1;
  const partCount = table.mergedParts?.length ?? (isMerged ? 2 : 1);

  return (
    <div
      className={`absolute select-none ${bookable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
      style={{ left: table.x, top: table.y, width, height }}
      onClick={(e) => {
        e.stopPropagation();
        if (bookable) onSelect();
      }}
    >
      {chairs.map((chair) => (
        <div
          key={chair.id}
          className="pointer-events-none absolute rounded-md bg-gradient-to-b from-[#5a3d2a] to-[#2d1c12] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_6px_rgba(0,0,0,0.4)]"
          style={{
            left: chair.relX,
            top: chair.relY,
            width: chair.w,
            height: chair.h,
          }}
        />
      ))}

      {isHere ? (
        <div className="pointer-events-none absolute -top-8 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-2.5 py-0.5 text-[9px] font-bold tracking-wide text-white shadow-lg ring-2 ring-blue-300 md:-top-9 md:px-3 md:py-1 md:text-[10px]">
          YOU ARE HERE
        </div>
      ) : null}

      <div
        className={`relative flex h-full w-full flex-col items-center justify-between overflow-hidden border bg-gradient-to-br px-2 py-2 text-white backdrop-blur-sm ${meta.table} ${meta.glow} ${
          isMerged ? 'rounded-3xl' : 'rounded-2xl'
        } ${!bookable ? 'opacity-95 saturate-110' : ''} ${isHere ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent' : ''}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22)_0%,transparent_45%,rgba(0,0,0,0.12)_100%)]" />

        {isMerged && partCount > 1
          ? Array.from({ length: partCount - 1 }, (_, i) => (
              <div
                key={i}
                className="pointer-events-none absolute top-3 bottom-3 w-0.5 bg-white/30"
                style={{ left: `${((i + 1) / partCount) * 100}%` }}
              />
            ))
          : null}

        {!bookable ? (
          <div className="absolute right-1.5 top-1.5 z-20 rounded-full bg-black/35 p-1">
            <FiLock className="text-white/90" size={12} />
          </div>
        ) : null}

        <span className="relative z-10 max-w-[95%] truncate text-sm font-bold tracking-wide drop-shadow-md md:text-base">
          {table.label}
        </span>

        <div className="relative z-10 flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-[10px] text-white/95 md:text-[11px]">
          <span className="font-semibold">
            {seatCount}
            {seatCount !== table.capacity ? (
              <span className="text-white/60">/{table.capacity}</span>
            ) : null}
          </span>
          {isMerged ? (
            <span className="ml-1 rounded bg-white/25 px-1.5 text-[8px] font-bold">
              MERGED
            </span>
          ) : null}
        </div>

        <div className="relative z-10 flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${meta.dot}`} />
          <span className="text-[9px] font-bold tracking-widest md:text-[10px]">
            {meta.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function LooseChair({ chair }: { chair: LiveCanvasChair }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: chair.x, top: chair.y }}
    >
      <div className="h-4 w-7 rounded-md bg-gradient-to-b from-[#5a3d2a] to-[#2d1c12] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_6px_rgba(0,0,0,0.4)]" />
    </div>
  );
}

function FloorCanvasInner({
  floor,
  width,
  height,
  scale,
  design,
  selectedTableIds,
  hereTableIds,
  readOnly,
  onTableSelect,
  visibleTables,
}: {
  floor: LiveFloorState;
  width: number;
  height: number;
  scale: number;
  design: (typeof FLOOR_DESIGNS)['wood'];
  selectedTableIds: string[];
  hereTableIds: string[];
  readOnly: boolean;
  onTableSelect: (table: LiveCanvasTable) => void;
  visibleTables: LiveCanvasTable[];
}) {
  return (
    <div
      className="relative origin-top-left"
      style={{
        width,
        height,
        transform: `scale(${scale})`,
        background: design.background,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, ${design.accent} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          opacity: 0.5,
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.28)_100%)]" />

      {visibleTables.map((table) => (
        <TableNode
          key={table.id}
          table={table}
          selected={selectedTableIds.includes(table.id)}
          onSelect={() => onTableSelect(table)}
          readOnly={readOnly}
          isHere={hereTableIds.includes(table.id)}
        />
      ))}

      {floor.chairs.map((chair) => (
        <LooseChair key={chair.id} chair={chair} />
      ))}

      {visibleTables.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-4 text-center text-white/90 backdrop-blur-md">
            No tables on this floor yet
          </div>
        </div>
      ) : null}
    </div>
  );
}

const LiveFloorCanvas: React.FC<LiveFloorCanvasProps> = ({
  floor,
  selectedTableIds,
  onTableSelect,
  readOnly = false,
  hereTableIds = [],
  fitMode = 'width',
  hideDisabledTables = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const design = FLOOR_DESIGNS[floor.floorDesign ?? 'wood'];
  const visibleTables = hideDisabledTables
    ? floor.tables.filter((table) => !table.isDisabled)
    : floor.tables;
  const { width, height } = floorCanvasSize({ ...floor, tables: visibleTables });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateScale = () => {
      const containerWidth = node.clientWidth;
      const containerHeight = node.clientHeight;
      if (containerWidth <= 0) return;

      if (fitMode === 'contain' && containerHeight > 0) {
        setScale(Math.min(containerWidth / width, containerHeight / height));
        return;
      }

      setScale(containerWidth / width);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [width, height, fitMode]);

  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);

  const inner = (
    <FloorCanvasInner
      floor={floor}
      width={width}
      height={height}
      scale={scale}
      design={design}
      selectedTableIds={selectedTableIds}
      hereTableIds={hereTableIds}
      readOnly={readOnly}
      onTableSelect={onTableSelect}
      visibleTables={visibleTables}
    />
  );

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden rounded-2xl border-4 border-[#3E2723] shadow-[0_20px_60px_rgba(62,39,35,0.25)] ${
        fitMode === 'contain' ? 'flex h-full min-h-0 items-center justify-center bg-[#2a1a14]/40 p-2 md:p-3' : ''
      } ${className}`}
    >
      {fitMode === 'contain' ? (
        <div
          className="overflow-hidden rounded-xl shadow-inner"
          style={{ width: scaledWidth, height: scaledHeight }}
        >
          {inner}
        </div>
      ) : (
        <div className="overflow-hidden" style={{ width: '100%', height: scaledHeight }}>
          {inner}
        </div>
      )}
    </div>
  );
};

export default LiveFloorCanvas;
