import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { MetalColor, PartsSelection } from '@/types/domain';
import { useCollectionsStore } from '../store';

interface Props {
  open: boolean;
  selection: PartsSelection;
  metalColor: MetalColor;
  onClose: () => void;
  onSaved?: () => void;
}

export function SaveDialog({ open, selection, metalColor, onClose, onSaved }: Props) {
  const create = useCollectionsStore((s) => s.create);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setComment('');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const anySelected = Object.values(selection).some(Boolean);

  async function handleSave() {
    if (!name.trim()) {
      setError('名前を入力してください');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await create({
        name: name.trim(),
        parts: selection,
        metalColor,
        comment: comment.trim(),
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-base font-semibold">コレクションに保存</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {!anySelected && (
            <div className="text-xs text-amber-600 dark:text-amber-400">
              パーツが1つも選択されていません
            </div>
          )}

          <label className="block space-y-1">
            <span className="text-sm text-neutral-700 dark:text-neutral-300">名前</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="お気に入り桜"
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-neutral-700 dark:text-neutral-300">コメント</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="春に使いたい組み合わせ"
              rows={3}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </label>

          {error && (
            <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
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
