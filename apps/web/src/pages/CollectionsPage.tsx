import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import type { Collection } from '@/types/domain';
import { useCollectionsStore } from '@/features/collections/store';
import { usePartsStore } from '@/lib/stores/partsStore';
import { PenPreview } from '@/features/simulator/components/PenPreview';

export function CollectionsPage() {
  const { items, loaded, loading, error, fetch, remove } = useCollectionsStore();
  const { loaded: partsLoaded, fetch: fetchParts, byId } = usePartsStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loaded) void fetch();
    if (!partsLoaded) void fetchParts();
  }, [loaded, partsLoaded, fetch, fetchParts]);

  async function handleDelete(id: string) {
    if (!window.confirm('このコレクションを削除しますか？')) return;
    setDeletingId(id);
    try {
      await remove(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">コレクション</h2>
        <span className="text-xs text-neutral-500">{items.length} 件</span>
      </header>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {loading && items.length === 0 ? (
        <div className="text-sm text-neutral-400 py-8 text-center">読み込み中…</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center text-sm text-neutral-500">
          まだコレクションがありません。
          <br />
          <Link to="/simulator" className="text-indigo-600 dark:text-indigo-400 underline">
            シミュレーター
          </Link>{' '}
          で組み合わせて保存してください。
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((c) => (
            <CollectionCard
              key={c.id}
              collection={c}
              byId={byId}
              deleting={deletingId === c.id}
              onDelete={() => handleDelete(c.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function CollectionCard({
  collection,
  byId,
  deleting,
  onDelete,
}: {
  collection: Collection;
  byId: (id: string | undefined) => ReturnType<ReturnType<typeof usePartsStore.getState>['byId']>;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <li className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="bg-[#f5efdf] dark:bg-neutral-800 p-3 flex justify-center">
        <div className="h-[240px]">
          <PenPreview
            selection={collection.parts}
            metalColor={collection.metalColor}
            byId={byId}
          />
        </div>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{collection.name}</div>
            <div className="text-[10px] text-neutral-500">
              {new Date(collection.createdAt).toLocaleDateString('ja-JP')}
            </div>
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="text-neutral-400 hover:text-red-600 disabled:opacity-50"
            aria-label="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        {collection.comment && (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
            {collection.comment}
          </p>
        )}
      </div>
    </li>
  );
}
