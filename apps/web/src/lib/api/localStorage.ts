import type {
  Collection,
  ColorStatus,
  ColorSwatch,
  InventoryEntry,
  Location,
  NewCollection,
} from '@/types/domain';
import type { ApiClient, ColorUpsertInput } from './types';
import { filterColors, filterParts, partsFromColors } from './parts';

/**
 * LocalStorage ベースの ApiClient。
 * - collections: LocalStorage に配列で保存
 * - colors: seed + ユーザーが追加/更新した色 (LocalStorage に差分保存)
 *          - upsert / updateStatus は LocalStorage 側に上書きレコードを積む
 * - inventory: 現状ドメインから外れているが interface 実装のためスタブ
 *
 * 公開デモ用: ブラウザ単位にデータが保存され、他ユーザーに影響しない。
 */

const KEY_COLLECTIONS = 'fountain-pen-buffet.collections';
const KEY_COLOR_OVERRIDES = 'fountain-pen-buffet.color_overrides';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return (parsed as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 容量オーバー等の失敗は握りつぶす (次回リトライで復旧余地)
  }
}

interface LocalConfig {
  colors: ColorSwatch[];
  locations: Location[];
}

/** seed + LocalStorage 上書き分をマージした色一覧を返す */
function readMergedColors(seed: ColorSwatch[]): ColorSwatch[] {
  const overrides = readJson<ColorSwatch[]>(KEY_COLOR_OVERRIDES, []);
  const overrideMap = new Map(overrides.map((c) => [c.id, c]));
  const merged: ColorSwatch[] = [];
  const seenIds = new Set<string>();
  for (const c of seed) {
    seenIds.add(c.id);
    merged.push(overrideMap.get(c.id) ?? c);
  }
  // seed にない完全新規色
  for (const c of overrides) {
    if (!seenIds.has(c.id)) merged.push(c);
  }
  return merged;
}

function saveColorOverride(update: ColorSwatch): void {
  const overrides = readJson<ColorSwatch[]>(KEY_COLOR_OVERRIDES, []);
  const idx = overrides.findIndex((c) => c.id === update.id);
  if (idx >= 0) overrides[idx] = update;
  else overrides.push(update);
  writeJson(KEY_COLOR_OVERRIDES, overrides);
}

export function createLocalStorageApiClient({
  colors: seed,
  locations,
}: LocalConfig): ApiClient {
  const inventory = new Map<string, InventoryEntry>();

  return {
    colors: {
      async list(filter) {
        return filterColors(readMergedColors(seed), filter);
      },
      async upsert(input: ColorUpsertInput) {
        const existing = readMergedColors(seed).find((c) => c.id === input.id);
        const merged: ColorSwatch = {
          id: input.id,
          name: input.name,
          hex: input.hex,
          category: input.category,
          status: input.status,
          sortOrder: input.sortOrder ?? existing?.sortOrder ?? (readMergedColors(seed).length + 1) * 10,
          locations: input.locations ?? existing?.locations ?? ['lab', 'ankora', 'bungujoshi'],
          note: input.note ?? existing?.note,
        };
        saveColorOverride(merged);
        return merged;
      },
      async updateStatus(id: string, status: ColorStatus) {
        const current = readMergedColors(seed).find((c) => c.id === id);
        if (!current) throw new Error('not_found');
        saveColorOverride({ ...current, status });
      },
    },
    parts: {
      async list(filter) {
        return filterParts(partsFromColors(readMergedColors(seed)), filter);
      },
    },
    collections: {
      async list() {
        return readJson<Collection[]>(KEY_COLLECTIONS, []);
      },
      async create(input: NewCollection) {
        const created: Collection = {
          ...input,
          id: `col-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        const items = readJson<Collection[]>(KEY_COLLECTIONS, []);
        items.unshift(created);
        writeJson(KEY_COLLECTIONS, items);
        return created;
      },
      async remove(id: string) {
        const items = readJson<Collection[]>(KEY_COLLECTIONS, []).filter((c) => c.id !== id);
        writeJson(KEY_COLLECTIONS, items);
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
