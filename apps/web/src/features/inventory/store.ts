import { useMemo } from 'react';
import type { PartType } from '@/types/domain';
import { useCollectionsStore } from '@/features/collections/store';

/** 手持ち管理対象のパーツ種別（蓋栓・尾栓は除外） */
export const INVENTORY_TYPES: PartType[] = ['cap', 'barrel', 'grip'];

/**
 * 所有パーツ ID セットを、kind='owned' のコレクションから導出する。
 * 手動所有登録は廃止し、コレクションから自動判定。
 */
export function useOwnedPartIds(): Set<string> {
  const items = useCollectionsStore((s) => s.items);
  return useMemo(() => {
    const set = new Set<string>();
    for (const c of items) {
      if (c.kind !== 'owned') continue;
      for (const type of INVENTORY_TYPES) {
        const id = c.parts[type];
        if (id) set.add(id);
      }
    }
    return set;
  }, [items]);
}

/** partId が所有パーツかどうか */
export function useIsOwned(): (partId: string | undefined) => boolean {
  const owned = useOwnedPartIds();
  return (partId) => (partId ? owned.has(partId) : false);
}
