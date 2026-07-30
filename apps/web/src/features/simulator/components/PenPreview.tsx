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
  // ミルキー系・クリア系は半透明
  if (part.colorKind === 'milky' || part.colorKind === 'clear') return 0.3;
  return 1;
}
function partColor(part: Part | undefined) {
  return part?.colorHex ?? PLACEHOLDER_HEX;
}
function metalFor(part: Part | undefined, metalHex: string) {
  return part ? metalHex : PLACEHOLDER_METAL;
}

/** 縦長 1:6 の万年筆スタック（PartShape を canonical 位置に重ねる） */
function PenStack({
  types,
  selection,
  byId,
  metalHex,
  className,
  style,
}: {
  types: PartType[];
  selection: PartsSelection;
  byId: (id: string | undefined) => Part | undefined;
  metalHex: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn('relative h-full aspect-[1/6]', className)}
      style={style}
    >
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

  // 組立: 大先を先に描画 → 蓋を上に重ねる（蓋が透明なら大先が透けて見える）
  const assembled: PartType[] = ['grip', 'cap_top', 'cap', 'barrel', 'barrel_end'];
  const capOnly: PartType[] = ['cap_top', 'cap'];
  const bodyOnly: PartType[] = ['grip', 'barrel', 'barrel_end'];

  return (
    <div className="flex justify-center items-end gap-6 h-[440px]">
      {/* View 1: 組立 */}
      <div className="flex flex-col items-center gap-2 h-full">
        <PenStack types={assembled} selection={selection} byId={byId} metalHex={metalHex} />
        <span className="text-xs text-neutral-500">組立</span>
      </div>

      {/* View 2: 蓋オフ */}
      <div className="flex flex-col items-center gap-2 h-full">
        <div className="flex items-end gap-2 h-full">
          <PenStack types={capOnly} selection={selection} byId={byId} metalHex={metalHex} />
          <PenStack types={bodyOnly} selection={selection} byId={byId} metalHex={metalHex} />
        </div>
        <span className="text-xs text-neutral-500">蓋オフ</span>
      </div>

      {/* View 3: キャップポスト = 胴を180°回転(ニブ下)し、蓋を上に重ねる */}
      <div className="flex flex-col items-center gap-2 h-full">
        <div className="relative h-full aspect-[1/6]">
          {/* 胴(大先=蓋オフと同じ画像を180°回転) */}
          <div
            className="absolute inset-0"
            style={{ transform: 'rotate(180deg)' }}
          >
            <PenStack
              types={bodyOnly}
              selection={selection}
              byId={byId}
              metalHex={metalHex}
              className="!aspect-auto h-full w-full"
            />
          </div>
          {/* 蓋(通常向き、barrel_endの上に重なる) */}
          <div className="absolute inset-0">
            <PenStack
              types={capOnly}
              selection={selection}
              byId={byId}
              metalHex={metalHex}
              className="!aspect-auto h-full w-full"
            />
          </div>
        </div>
        <span className="text-xs text-neutral-500">キャップポスト</span>
      </div>
    </div>
  );
}
