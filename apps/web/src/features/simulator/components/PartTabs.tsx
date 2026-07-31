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
      <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1 overflow-x-auto">
        <div className="flex min-w-full gap-1">
          {PART_TYPES.map((type) => {
            const active = type === activeTab;
            const filled = !!selection[type];
            return (
              <button
                key={type}
                type="button"
                onClick={() => onChangeTab(type)}
                className={cn(
                  'flex-1 px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap font-medium',
                  active
                    ? 'bg-white dark:bg-neutral-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-neutral-700',
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
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {options.map((part) => {
            const active = part.id === selectedId;
            const opacity =
              part.colorKind === 'clear' ? 0.55 : part.colorKind === 'milky' ? 0.7 : 1;
            return (
              <button
                key={part.id}
                type="button"
                onClick={() => onSelectPart(activeTab, active ? undefined : part.id)}
                className={cn(
                  'rounded-lg border p-2 flex flex-col items-center gap-1.5 transition-colors',
                  active
                    ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400',
                )}
              >
                <div
                  className="w-10 h-10 rounded-full border border-neutral-300 dark:border-neutral-600 shadow-sm"
                  style={{ background: part.colorHex, opacity }}
                  aria-hidden="true"
                />
                <span className="text-[11px] leading-tight text-center truncate w-full">
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
