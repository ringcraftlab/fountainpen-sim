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
 * - colors: seed を読み取り専用で提供 (追加/編集は管理者のみ = gas モード)
 * - inventory: 現状ドメイン外だが interface 実装のためスタブ
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
