import type { Collection, InventoryEntry, NewCollection } from '@/types/domain';
import type { ApiClient } from './types';
import { createGasApiClient } from './gas';

/**
 * ハイブリッド ApiClient (最終形):
 *
 *   - colors / locations / parts → GAS 経由で Sheets から取得 (マスタは Sheets)
 *   - collections → LocalStorage (未ログインなので端末内)
 *   - inventory → LocalStorage (使っていないが interface 用にスタブ)
 *
 * 将来ログイン機能を追加したら collections を user DB に切り替える。
 */

const KEY_COLLECTIONS = 'fountain-pen-buffet.collections';

function readCollections(): Collection[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY_COLLECTIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Collection[]) : [];
  } catch {
    return [];
  }
}

function writeCollections(items: Collection[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY_COLLECTIONS, JSON.stringify(items));
  } catch {
    // 容量オーバー等の失敗は握りつぶす
  }
}

export function createHybridApiClient(gasEndpoint: string): ApiClient {
  const gas = createGasApiClient({ endpoint: gasEndpoint });
  const inventory = new Map<string, InventoryEntry>();

  return {
    // マスタ = Sheets
    colors: gas.colors,
    locations: gas.locations,
    parts: gas.parts,

    // 個人データ = 端末 (未ログイン想定)
    collections: {
      async list() {
        return readCollections();
      },
      async create(input: NewCollection) {
        const created: Collection = {
          ...input,
          id: `col-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        const items = readCollections();
        items.unshift(created);
        writeCollections(items);
        return created;
      },
      async remove(id: string) {
        const items = readCollections().filter((c) => c.id !== id);
        writeCollections(items);
      },
    },

    // 未使用スタブ
    inventory: {
      async list() {
        return Array.from(inventory.values());
      },
      async upsert(entry) {
        inventory.set(entry.partId, entry);
      },
    },
  };
}
