import type { Part, PartType } from '@/types/domain';
import { PART_TYPE_LABELS } from '@/types/domain';
import { cn } from '@/lib/utils';

interface Props {
  type: PartType;
  options: Part[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
}

export function PartSelector({ type, options, selectedId, onSelect }: Props) {
  const label = PART_TYPE_LABELS[type];
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{label.ja}</span>
          <span className="text-[10px] text-neutral-400">{label.en}</span>
        </div>
        {selectedId && (
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className="text-[10px] text-neutral-400 hover:text-neutral-600"
          >
            クリア
          </button>
        )}
      </div>
      {options.length === 0 ? (
        <div className="text-xs text-neutral-400 py-3">販売中のパーツがありません</div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {options.map((part) => {
            const active = part.id === selectedId;
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => onSelect(part.id)}
                className={cn(
                  'shrink-0 w-14 rounded-lg border p-1 flex flex-col items-center gap-1 transition-colors',
                  active
                    ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400',
                )}
              >
                <img
                  src={part.image}
                  alt={part.name}
                  className="w-full aspect-[1/6] object-contain"
                  draggable={false}
                />
                <span className="text-[10px] leading-tight text-center truncate w-full">
                  {part.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
