import type {
  Collection,
  ColorStatus,
  ColorSwatch,
  InventoryEntry,
  Location,
  NewCollection,
} from '@/types/domain';
import { COLOR_PALETTE } from '@/features/simulator/colors';
import type { ApiClient, ColorUpsertInput } from './types';
import { filterColors, filterParts, partsFromColors } from './parts';

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const seedLocations: Location[] = [
  { id: 'lab', name: 'Style Of Lab', active: true },
  { id: 'ankora', name: 'アンコーラ', active: true },
  { id: 'bungujoshi', name: '文具女子博', active: true },
];

/** 種色 (seed) の色リストを返すヘルパ。他クライアントも共有する。 */
export function seedColors(): ColorSwatch[] {
  return COLOR_PALETTE.map((c) => ({ ...c }));
}

export function createMockApiClient(): ApiClient {
  const colors = seedColors();
  const collections: Collection[] = [];
  const inventory = new Map<string, InventoryEntry>();

  return {
    colors: {
      async list(filter) {
        await delay();
        return filterColors(colors, filter);
      },
      async upsert(input: ColorUpsertInput) {
        await delay();
        const idx = colors.findIndex((c) => c.id === input.id);
        const merged: ColorSwatch = {
          id: input.id,
          name: input.name,
          hex: input.hex,
          category: input.category,
          status: input.status,
          sortOrder: input.sortOrder ?? (colors.length + 1) * 10,
          locations: input.locations ?? ['lab', 'ankora', 'bungujoshi'],
          note: input.note,
        };
        if (idx >= 0) colors[idx] = merged;
        else colors.push(merged);
        return merged;
      },
      async updateStatus(id: string, status: ColorStatus) {
        await delay();
        const c = colors.find((x) => x.id === id);
        if (!c) throw new Error('not_found');
        c.status = status;
      },
    },
    parts: {
      async list(filter) {
        await delay();
        return filterParts(partsFromColors(colors), filter);
      },
    },
    collections: {
      async list() {
        await delay();
        return [...collections];
      },
      async create(input: NewCollection) {
        await delay();
        const created: Collection = {
          ...input,
          id: `col-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        collections.unshift(created);
        return created;
      },
      async remove(id) {
        await delay();
        const idx = collections.findIndex((c) => c.id === id);
        if (idx >= 0) collections.splice(idx, 1);
      },
    },
    inventory: {
      async list() {
        await delay();
        return Array.from(inventory.values());
      },
      async upsert(entry) {
        await delay();
        inventory.set(entry.partId, entry);
      },
    },
    locations: {
      async list() {
        await delay();
        return [...seedLocations];
      },
    },
  };
}
