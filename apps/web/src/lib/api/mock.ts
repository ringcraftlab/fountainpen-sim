import type {
  Collection,
  ColorSwatch,
  InventoryEntry,
  Location,
  NewCollection,
} from '@/types/domain';
import { COLOR_PALETTE } from '@/features/simulator/colors';
import type { ApiClient } from './types';
import { filterColors, filterParts, partsFromColors } from './parts';

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

export const seedLocations: Location[] = [
  { id: 'lab', name: 'Style Of Lab', active: true },
  { id: 'ankora', name: 'アンコーラ', active: true },
  { id: 'bungujoshi', name: '文具女子博', active: true },
];

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
