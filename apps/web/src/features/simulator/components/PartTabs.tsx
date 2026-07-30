import type { Part, PartType } from '@/types/domain';
import { PART_TYPES, PART_TYPE_LABELS } from '@/types/domain';
import { cn } from '@/lib/utils';

interface Props {
  activeTab: PartType;
  optionsByType: Record<PartType, Part[]>;
  selection: Partial<Record<PartType, string>>;
  onChangeTab: (type: PartType) => void;
  onSelectPart: (type: PartType, partId: string | undefined) => void;
}

export function PartTabs({
  activeTab,
  optionsByType,
  selection,
  onChangeTab,
  onSelectPart,
}: Props) {
  const options = optionsByType[activeTab] ?? [];
  const selectedId = selection[activeTab];
  return (
    <div className="space-y-3">
      <div className="border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto">
        <div className="flex min-w-full">
          {PART_TYPES.map((type) => {
            const active = type === activeTab;
            const filled = !!selection[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => onChangeTab(type)}
                className={cn(
                  'flex-1 px-2 py-2 text-sm border-b-2 transition-colors whitespace-nowrap',
                  active
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200',
                )}
              >
                {PART_TYPE_LABELS[type].ja}
                {filled && <span className="ml-1 text-[10px] text-indigo-500">●</span>}
              </button>
            );
          })}
        </div>
      </div>

      {options.length === 0 ? (
        <div className="text-xs text-neutral-400 py-6 text-center">
          販売中のパーツがありません
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {options.map((part) => {
            const active = part.id === selectedId;
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => onSelectPart(activeTab, active ? undefined : part.id)}
                className={cn(
                  'rounded-lg border p-1.5 flex flex-col items-center gap-1 transition-colors',
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
