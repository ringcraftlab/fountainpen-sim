import type {
  Collection,
  ColorSwatch,
  InventoryEntry,
  Location,
  NewCollection,
} from '@/types/domain';
import type { ApiClient } from './types';
import { filterColors, filterParts, partsFromColors } from './parts';

/**
 * LocalStorage ベースの ApiClient。
 * - collections: LocalStorage に配列で保存
 * - colors / parts: seed を単一のソースとして共有 (パーツは colors から派生)
 * - inventory: 現状ドメインから外れているが interface 実装のためスタブ
 *
 * 公開デモ用: ブラウザ単位にコレクションが保存され、他ユーザーに影響しない。
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
    // 容量オーバー等の失敗は握りつぶす (次回リトライで復旧余地)
  }
}

interface LocalConfig {
  colors: ColorSwatch[];
  locations: Location[];
}

export function createLocalStorageApiClient({
  colors,
  locations,
}: LocalConfig): ApiClient {
  const inventory = new Map<string, InventoryEntry>();

  return {
    colors: {
      async list(filter) {
        return filterColors(colors, filter);
      },
    },
    parts: {
      async list(filter) {
        return filterParts(partsFromColors(colors), filter);
      },
    },
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
    inventory: {
      async list() {
        return Array.from(inventory.values());
      },
      async upsert(entry) {
        inventory.set(entry.partId, entry);
      },
    },
    locations: {
      async list() {
        return [...locations];
      },
    },
  };
}
