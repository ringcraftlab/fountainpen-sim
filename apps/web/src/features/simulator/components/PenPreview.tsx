import type { Part, PartType, PartsSelection } from '@/types/domain';
import { PART_TYPES } from '@/types/domain';
import { cn } from '@/lib/utils';

interface PenPreviewProps {
  selection: PartsSelection;
  byId: (id: string | undefined) => Part | undefined;
}

const CAP_SECTION: PartType[] = ['cap_top', 'cap', 'metal'];
const BODY_SECTION: PartType[] = ['grip', 'barrel', 'barrel_end'];

function LayerStack({
  layers,
  className,
}: {
  layers: (Part | undefined)[];
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
    </div>
  );
}

export function PenPreview({ selection, byId }: PenPreviewProps) {
  const all = PART_TYPES.map((t) => byId(selection[t]));
  const capOnly = CAP_SECTION.map((t) => byId(selection[t]));
  const bodyOnly = BODY_SECTION.map((t) => byId(selection[t]));

  return (
    <div className="grid grid-cols-3 gap-4 items-end">
      <div className="flex flex-col items-center gap-2">
        <LayerStack layers={all} />
        <span className="text-xs text-neutral-500">組立</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LayerStack layers={capOnly} />
        <span className="text-xs text-neutral-500">蓋</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LayerStack layers={bodyOnly} />
        <span className="text-xs text-neutral-500">胴</span>
      </div>
    </div>
  );
}
