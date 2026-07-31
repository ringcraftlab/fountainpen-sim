import type { MetalColor, Part, PartType, PartsSelection } from '@/types/domain';
import { METAL_COLORS } from '@/types/domain';
import { cn } from '@/lib/utils';
import { PartShape } from './PartShape';

interface PenPreviewProps {
  selection: PartsSelection;
  metalColor: MetalColor;
  byId: (id: string | undefined) => Part | undefined;
}

const PLACEHOLDER_HEX = '#e5e7eb';
const PLACEHOLDER_METAL = '#d5d5da';
const PEN_WIDTH = 59;

function partOpacity(part: Part | undefined) {
  if (!part) return 0.35;
  if (part.colorKind === 'clear') return 0.55;
  if (part.colorKind === 'milky') return 0.7;
  return 1;
}
function partColor(part: Part | undefined) {
  return part?.colorHex ?? PLACEHOLDER_HEX;
}
function metalFor(part: Part | undefined, metalHex: string) {
  return part ? metalHex : PLACEHOLDER_METAL;
}

function PenStack({
  types,
  selection,
  byId,
  metalHex,
  className,
}: {
  types: PartType[];
  selection: PartsSelection;
  byId: (id: string | undefined) => Part | undefined;
  metalHex: string;
  className?: string;
}) {
  return (
    <div className={cn('relative h-full aspect-[1/6]', className)}>
      {types.map((type) => {
        const part = byId(selection[type]);
        return (
          <div key={type} className="absolute inset-0">
            <PartShape
              type={type}
              colorHex={partColor(part)}
              metalHex={metalFor(part, metalHex)}
              opacity={partOpacity(part)}
            />
          </div>
        );
      })}
    </div>
  );
}

export function PenPreview({ selection, metalColor, byId }: PenPreviewProps) {
  const metalHex = METAL_COLORS.find((c) => c.id === metalColor)?.hex ?? '#d4b04c';

  const assembled: PartType[] = ['grip', 'cap_top', 'cap', 'barrel', 'barrel_end'];
  const capOnly: PartType[] = ['cap_top', 'cap'];
  const bodyOnly: PartType[] = ['grip', 'barrel', 'barrel_end'];

  const assembledPen = (
    <div style={{ width: PEN_WIDTH }} className="aspect-[1/6]">
      <PenStack
        types={assembled}
        selection={selection}
        byId={byId}
        metalHex={metalHex}
        className="!aspect-auto h-full w-full"
      />
    </div>
  );

  const capOffPen = (
    <div className="flex items-start gap-2">
      <div style={{ width: PEN_WIDTH }} className="aspect-[1/6]">
        <PenStack
          types={capOnly}
          selection={selection}
          byId={byId}
          metalHex={metalHex}
          className="!aspect-auto h-full w-full"
        />
      </div>
      <div style={{ width: PEN_WIDTH }} className="aspect-[1/6]">
        <PenStack
          types={bodyOnly}
          selection={selection}
          byId={byId}
          metalHex={metalHex}
          className="!aspect-auto h-full w-full"
        />
      </div>
    </div>
  );

  const postedPen = (
    <div
      className="relative"
      style={{ width: PEN_WIDTH, aspectRatio: '100 / 700' }}
    >
      <div
        className="absolute left-0 right-0"
        style={{ bottom: 0, aspectRatio: '1 / 6', transform: 'rotate(180deg)' }}
      >
        <PenStack
          types={bodyOnly}
          selection={selection}
          byId={byId}
          metalHex={metalHex}
          className="!aspect-auto h-full w-full"
        />
      </div>
      <div
        className="absolute left-0 right-0"
        style={{ top: 0, aspectRatio: '1 / 6' }}
      >
        <PenStack
          types={capOnly}
          selection={selection}
          byId={byId}
          metalHex={metalHex}
          className="!aspect-auto h-full w-full"
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex justify-center items-start gap-6 pt-8">
      <div className="flex justify-center">{assembledPen}</div>
      <div className="flex justify-center">{capOffPen}</div>
      <div className="flex justify-center">{postedPen}</div>
    </div>
  );
}
