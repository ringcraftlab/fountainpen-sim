import { Check, Circle, Minus } from 'lucide-react';
import type { PartsSelection } from '@/types/domain';
import { PART_TYPE_LABELS } from '@/types/domain';
import { cn } from '@/lib/utils';
import { INVENTORY_TYPES, useIsOwned } from '@/features/inventory/store';

interface Props {
  selection: PartsSelection;
}

export function OwnershipStatus({ selection }: Props) {
  const isOwned = useIsOwned();

  return (
    <div className="flex justify-center gap-2 text-xs">
      {INVENTORY_TYPES.map((type) => {
        const partId = selection[type];
        const selected = !!partId;
        const owned = isOwned(partId);
        const state: 'owned' | 'not_owned' | 'empty' = !selected
          ? 'empty'
          : owned
            ? 'owned'
            : 'not_owned';

        return (
          <div
            key={type}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1',
              state === 'owned' &&
                'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300',
              state === 'not_owned' &&
                'bg-neutral-50 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-500',
              state === 'empty' &&
                'bg-transparent border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400',
            )}
          >
            {state === 'owned' && <Check className="w-3 h-3" strokeWidth={3} />}
            {state === 'not_owned' && <Circle className="w-3 h-3" />}
            {state === 'empty' && <Minus className="w-3 h-3" />}
            <span className="font-medium">{PART_TYPE_LABELS[type].ja}</span>
            <span className="opacity-70">
              {state === 'owned' && '所有'}
              {state === 'not_owned' && '未所有'}
              {state === 'empty' && '未選択'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
