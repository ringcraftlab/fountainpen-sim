import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import type { ColorKind, ColorSwatch } from '@/types/domain';
import { cn } from '@/lib/utils';
import { isAdminMode } from '@/lib/api/provider';
import { usePaletteStore } from '@/features/palette/store';
import { useLocationsStore } from '@/lib/stores/locationsStore';

/**
 * 色パレット管理ページ (管理者専用: gas プロバイダ時のみ表示)。
 * - 既存色一覧 (廃盤含む)
 * - 廃盤トグル
 * - 新規色追加ダイアログ
 */
export function PalettePage() {
  // 管理者モード以外はシミュレーターへリダイレクト
  if (!isAdminMode()) return <Navigate to="/simulator" replace />;

  return <PaletteContent />;
}

function PaletteContent() {
  const { colors, loaded, loading, error, fetch, updateStatus } = usePaletteStore();
  const {
    loaded: locsLoaded,
    fetch: fetchLocs,
    locations,
  } = useLocationsStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'discontinued'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ColorSwatch | null>(null);

  useEffect(() => {
    if (!loaded) void fetch();
    if (!locsLoaded) void fetchLocs();
  }, [loaded, locsLoaded, fetch, fetchLocs]);

  const filtered = useMemo(() => {
    if (filter === 'active') return colors.filter((c) => c.status === 'ACTIVE');
    if (filter === 'discontinued') return colors.filter((c) => c.status === 'DISCONTINUED');
    return colors;
  }, [colors, filter]);

  const activeCount = colors.filter((c) => c.status === 'ACTIVE').length;
  const discountinued = colors.length - activeCount;

  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">パレット管理</h2>
        <span className="text-xs text-neutral-500">
          販売中 {activeCount} · 廃盤 {discountinued}
        </span>
      </header>

      <p className="text-xs text-neutral-500">
        色の追加・廃盤切替を行います。既存コレクションには影響しません。
      </p>

      <div className="flex items-center gap-2">
        {(['all', 'active', 'discontinued'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              filter === f
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800',
            )}
          >
            {f === 'all' ? 'すべて' : f === 'active' ? '販売中' : '廃盤'}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white px-3 py-2 text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          色を追加
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {loading && colors.length === 0 ? (
        <div className="text-sm text-neutral-400 py-8 text-center">読み込み中…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-neutral-400 py-8 text-center">該当する色がありません</div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map((c) => (
            <ColorCard
              key={c.id}
              color={c}
              onToggleStatus={() =>
                updateStatus(c.id, c.status === 'ACTIVE' ? 'DISCONTINUED' : 'ACTIVE')
              }
              onEdit={() => setEditing(c)}
            />
          ))}
        </ul>
      )}

      {(addOpen || editing) && (
        <ColorForm
          initial={editing}
          locationOptions={locations.map((l) => ({ id: l.id, name: l.name }))}
          onClose={() => {
            setAddOpen(false);
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

function ColorCard({
  color,
  onToggleStatus,
  onEdit,
}: {
  color: ColorSwatch;
  onToggleStatus: () => void;
  onEdit: () => void;
}) {
  const discontinued = color.status === 'DISCONTINUED';
  return (
    <li
      className={cn(
        'rounded-lg border p-3 flex items-center gap-3',
        discontinued
          ? 'border-neutral-200 dark:border-neutral-800 opacity-60'
          : 'border-neutral-300 dark:border-neutral-700',
      )}
    >
      <div
        className="w-10 h-10 rounded-full border border-neutral-300 shrink-0"
        style={{ background: color.hex }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onEdit}
          className="block text-left text-sm font-medium truncate hover:underline"
        >
          {color.name}
        </button>
        <div className="text-[10px] text-neutral-500">
          {color.id} · {color.category}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleStatus}
        className={cn(
          'text-[11px] px-2 py-1 rounded-md border',
          discontinued
            ? 'border-neutral-300 text-neutral-500 hover:bg-neutral-100'
            : 'border-indigo-500 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40',
        )}
        title={discontinued ? '販売中に戻す' : '廃盤にする'}
      >
        {discontinued ? '販売中に戻す' : '廃盤にする'}
      </button>
    </li>
  );
}

function ColorForm({
  initial,
  locationOptions,
  onClose,
}: {
  initial: ColorSwatch | null;
  locationOptions: { id: string; name: string }[];
  onClose: () => void;
}) {
  const upsert = usePaletteStore((s) => s.upsert);
  const [id, setId] = useState(initial?.id ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [hex, setHex] = useState(initial?.hex ?? '#c0c0c0');
  const [category, setCategory] = useState<ColorKind>(initial?.category ?? 'solid');
  const [locations, setLocations] = useState<string[]>(
    initial?.locations ?? locationOptions.map((l) => l.id),
  );
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 0);
  const [note, setNote] = useState(initial?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isEdit = !!initial;

  function toggleLocation(locId: string) {
    setLocations((prev) =>
      prev.includes(locId) ? prev.filter((x) => x !== locId) : [...prev, locId],
    );
  }

  async function submit() {
    setErr(null);
    if (!id.trim() || !name.trim() || !hex.trim()) {
      setErr('id / name / hex は必須です');
      return;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(hex.trim())) {
      setErr('hex は #RRGGBB 形式で入力してください');
      return;
    }
    setSaving(true);
    try {
      await upsert({
        id: id.trim(),
        name: name.trim(),
        hex: hex.trim(),
        category,
        status: initial?.status ?? 'ACTIVE',
        sortOrder: Number(sortOrder) || 0,
        locations,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
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
          <h3 className="text-base font-semibold">
            {isEdit ? '色を編集' : '色を追加'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <label className="block space-y-1">
            <span className="text-xs text-neutral-500">ID (半角英数字, _)</span>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="例: sepia"
              disabled={isEdit}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm disabled:opacity-50"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-neutral-500">名前</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: セピア"
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <label className="block space-y-1">
              <span className="text-xs text-neutral-500">色 (#RRGGBB)</span>
              <input
                type="text"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                placeholder="#5a3a20"
                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm font-mono"
              />
            </label>
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#c0c0c0'}
              onChange={(e) => setHex(e.target.value)}
              className="w-11 h-11 rounded-md border border-neutral-300 dark:border-neutral-700"
            />
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-neutral-500">カテゴリ</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ColorKind)}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm"
            >
              <option value="solid">solid (不透明)</option>
              <option value="milky">milky (乳白)</option>
              <option value="clear">clear (透明)</option>
            </select>
          </label>
          <div className="block space-y-1">
            <span className="text-xs text-neutral-500">販売店舗</span>
            <div className="flex flex-wrap gap-2">
              {locationOptions.map((l) => (
                <label key={l.id} className="inline-flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={locations.includes(l.id)}
                    onChange={() => toggleLocation(l.id)}
                  />
                  {l.name}
                </label>
              ))}
            </div>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-neutral-500">表示順 (数値、小さい順)</span>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-neutral-500">備考 (任意)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="イベント名など"
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm"
            />
          </label>
          {err && <div className="text-xs text-red-600 dark:text-red-400">{err}</div>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-md bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
