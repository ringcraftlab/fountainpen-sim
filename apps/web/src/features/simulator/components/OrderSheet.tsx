import { useRef, useState } from 'react';
import { X, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { MetalColor, Part, PartsSelection, PartType } from '@/types/domain';
import { METAL_COLORS, PART_TYPE_LABELS } from '@/types/domain';

interface Props {
  open: boolean;
  selection: PartsSelection;
  metalColor: MetalColor;
  byId: (id: string | undefined) => Part | undefined;
  onClose: () => void;
}

interface RowSpec {
  labelJa: string;
  labelEn: string;
  colorName: string;
  colorHex: string;
  colorKind?: string;
}

export function OrderSheet({ open, selection, metalColor, byId, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  if (!open) return null;

  const metal = METAL_COLORS.find((c) => c.id === metalColor)!;

  // 蓋栓 → 蓋 → [金属パーツ] → 大先 → 胴 → 尾栓 の順で行構築
  const rows: (RowSpec | null)[] = [];
  const addPart = (type: PartType) => {
    const part = byId(selection[type]);
    rows.push(
      part
        ? {
            labelJa: PART_TYPE_LABELS[type].ja,
            labelEn: PART_TYPE_LABELS[type].en,
            colorName: part.name,
            colorHex: part.colorHex,
            colorKind: part.colorKind,
          }
        : {
            labelJa: PART_TYPE_LABELS[type].ja,
            labelEn: PART_TYPE_LABELS[type].en,
            colorName: '未選択',
            colorHex: '#e5e7eb',
          },
    );
  };

  // cap_top, cap の後に金属パーツ、その後 grip, barrel, barrel_end
  addPart('cap_top');
  addPart('cap');
  rows.push({
    labelJa: '金属パーツ',
    labelEn: 'Metal Parts',
    colorName: metal.name,
    colorHex: metal.hex,
  });
  addPart('grip');
  addPart('barrel');
  addPart('barrel_end');

  async function handleExport() {
    if (!sheetRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(sheetRef.current, {
        pixelRatio: 2,
        backgroundColor: '#faf5ea',
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `order-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-base font-semibold">指示書</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div
            ref={sheetRef}
            className="rounded-xl p-4 space-y-2"
            style={{
              backgroundImage:
                'repeating-linear-gradient(135deg, #faf5ea 0 12px, rgba(200,180,130,0.08) 12px 13px)',
              backgroundColor: '#faf5ea',
            }}
          >
            {rows.map((r, i) => {
              if (!r) return null;
              // 薄い/透過的な色は文字を暗くしないと見えないので判定
              const isLight = isLightColor(r.colorHex);
              return (
                <div
                  key={i}
                  className="flex items-stretch rounded-full overflow-hidden border border-neutral-300/60 bg-white/40 shadow-sm"
                >
                  {/* Label */}
                  <div className="w-[45%] px-3 py-2 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-medium text-neutral-800 leading-tight">
                      {r.labelJa}
                    </span>
                    <span className="text-[10px] text-neutral-500 leading-tight">
                      {r.labelEn}
                    </span>
                  </div>
                  {/* Color chip */}
                  <div
                    className="flex-1 px-3 py-2 flex flex-col items-center justify-center text-center rounded-r-full"
                    style={{
                      background: r.colorHex,
                      color: isLight ? '#1a1a1a' : '#ffffff',
                    }}
                  >
                    <span className="text-sm font-semibold leading-tight">
                      {r.colorName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            閉じる
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting ? '書き出し中…' : 'PNG保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 16進カラーが明るいかどうか判定 (WCAG-lite) */
function isLightColor(hex: string): boolean {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return true;
  const rgb = parseInt(m[1], 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  // 相対輝度近似
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 155;
}
