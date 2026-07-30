import { METAL_COLORS, type MetalColor } from '@/types/domain';
import { cn } from '@/lib/utils';

interface Props {
  value: MetalColor;
  onChange: (color: MetalColor) => void;
}

export function MetalColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">金属パーツ</span>
      <div className="flex gap-1">
        {METAL_COLORS.map((c) => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium border transition-colors',
                active
                  ? 'border-neutral-900 dark:border-neutral-100'
                  : 'border-neutral-300 dark:border-neutral-700 opacity-60 hover:opacity-100',
              )}
              style={{
                background: c.hex,
                color: c.id === 'gold' ? '#3a2a00' : '#1a1a20',
              }}
            >
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
