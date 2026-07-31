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

/**
 * 3ビューを並べる。全ペン同じ幅、キャップポストが最も長い (100%)、他は 6/7 = 約85.7%。
 * コンテナの高さに応じて全体スケール。
 */
export function PenPreview({ selection, metalColor, byId }: PenPreviewProps) {
  const metalHex = METAL_COLORS.find((c) => c.id === metalColor)?.hex ?? '#d4b04c';

  const assembled: PartType[] = ['grip', 'cap_top', 'cap', 'barrel', 'barrel_end'];
  const capOnly: PartType[] = ['cap_top', 'cap'];
  const bodyOnly: PartType[] = ['grip', 'barrel', 'barrel_end'];

  // 他ビュー(aspect 1/6) の高さを、posted(1/7 = 100%高)と同じ幅にする → 6/7 高さ
  const otherHeight = 'calc(100% * 6 / 7)';

  return (
    <div className="h-full flex justify-center items-start gap-[6%] pt-[6%]">
      {/* 組立 */}
      <div className="aspect-[1/6]" style={{ height: otherHeight }}>
        <PenStack
          types={assembled}
          selection={selection}
          byId={byId}
          metalHex={metalHex}
          className="!aspect-auto h-full w-full"
        />
      </div>

      {/* 蓋オフ (蓋+胴 の2物体) */}
      <div className="flex items-start gap-1" style={{ height: otherHeight }}>
        <div className="aspect-[1/6] h-full">
          <PenStack
            types={capOnly}
            selection={selection}
            byId={byId}
            metalHex={metalHex}
            className="!aspect-auto h-full w-full"
          />
        </div>
        <div className="aspect-[1/6] h-full">
          <PenStack
            types={bodyOnly}
            selection={selection}
            byId={byId}
            metalHex={metalHex}
            className="!aspect-auto h-full w-full"
          />
        </div>
      </div>

      {/* キャップポスト (蓋を180°回転胴の上に重ねる、40%オーバーラップ) */}
      <div
        className="relative h-full"
        style={{ aspectRatio: '100 / 700' }}
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
    </div>
  );
}
