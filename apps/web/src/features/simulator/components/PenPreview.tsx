import type { MetalColor, Part, PartType, PartsSelection } from '@/types/domain';
import { METAL_COLORS, PART_TYPES } from '@/types/domain';
import { cn } from '@/lib/utils';

interface PenPreviewProps {
  selection: PartsSelection;
  metalColor: MetalColor;
  byId: (id: string | undefined) => Part | undefined;
}

const CAP_SECTION: PartType[] = ['cap_top', 'cap'];
const BODY_SECTION: PartType[] = ['grip', 'barrel', 'barrel_end'];

function MetalBand({ color }: { color: MetalColor }) {
  const hex = METAL_COLORS.find((c) => c.id === color)?.hex ?? '#d4b04c';
  return (
    <svg
      viewBox="0 0 100 600"
      preserveAspectRatio="xMidYMid meet"
      className="absolute inset-0 h-full w-full pointer-events-none"
    >
      <rect x="27" y="240" width="46" height="22" fill={hex} />
    </svg>
  );
}

function LayerStack({
  layers,
  metalColor,
  showMetal,
  className,
}: {
  layers: (Part | undefined)[];
  metalColor: MetalColor;
  showMetal: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative aspect-[1/6] w-full', className)}>
      {PART_TYPES.map((type) => {
        const part = layers.find((p) => p?.type === type);
        if (!part) return null;
        return (
          <img
            key={type}
            src={part.image}
            alt={part.name}
            className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
            draggable={false}
          />
        );
      })}
      {showMetal && <MetalBand color={metalColor} />}
    </div>
  );
}

export function PenPreview({ selection, metalColor, byId }: PenPreviewProps) {
  const all = PART_TYPES.map((t) => byId(selection[t]));
  const capOnly = CAP_SECTION.map((t) => byId(selection[t]));
  const bodyOnly = BODY_SECTION.map((t) => byId(selection[t]));

  return (
    <div className="grid grid-cols-3 gap-4 items-end">
      <div className="flex flex-col items-center gap-2">
        <LayerStack layers={all} metalColor={metalColor} showMetal />
        <span className="text-xs text-neutral-500">組立</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LayerStack layers={capOnly} metalColor={metalColor} showMetal={false} />
        <span className="text-xs text-neutral-500">蓋</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LayerStack layers={bodyOnly} metalColor={metalColor} showMetal={false} />
        <span className="text-xs text-neutral-500">胴</span>
      </div>
    </div>
  );
}
