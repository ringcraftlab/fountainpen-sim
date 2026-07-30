import type { Location } from '@/types/domain';
import { cn } from '@/lib/utils';
import type { LocationFilter as LocationFilterValue } from '../store';

interface Props {
  value: LocationFilterValue;
  locations: Location[];
  onChange: (value: LocationFilterValue) => void;
}

export function LocationFilter({ value, locations, onChange }: Props) {
  const items: { id: LocationFilterValue; name: string }[] = [
    { id: 'all', name: 'すべて' },
    ...locations.filter((l) => l.active).map((l) => ({ id: l.id, name: l.name })),
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              active
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800',
            )}
          >
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
