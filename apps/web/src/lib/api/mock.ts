import type {
  Collection,
  InventoryEntry,
  Location,
  NewCollection,
  Part,
  PartType,
} from '@/types/domain';
import { COLOR_PALETTE } from '@/features/simulator/colors';
import type { ApiClient, PartsFilter } from './types';

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

const locations: Location[] = [
  { id: 'lab', name: 'Style Of Lab', active: true },
  { id: 'ankora', name: 'アンコーラ', active: true },
  { id: 'bungujoshi', name: '文具女子博', active: true },
];

const ALL_LOC = ['lab', 'ankora', 'bungujoshi'];

const PREFIX: Record<PartType, string> = {
  cap_top: 'ct',
  cap: 'c',
  grip: 'g',
  barrel: 'b',
  barrel_end: 'be',
};

/**
 * 各パーツについて、パレット全色をベースに Part を自動生成。
 * MVP デモ用途のため全色を全パーツで有効化する。
 * 実運用では Sheets から currentAvailable / locations を上書きする。
 */
function generateParts(): Part[] {
  const partTypes: PartType[] = ['cap_top', 'cap', 'grip', 'barrel', 'barrel_end'];
  const parts: Part[] = [];
  for (const type of partTypes) {
    for (const color of COLOR_PALETTE) {
      parts.push({
        id: `${PREFIX[type]}-${color.id}`,
        type,
        name: color.name,
        colorHex: color.hex,
        colorKind: color.kind,
        currentAvailable: true,
        locations: ALL_LOC,
        tags: [color.kind],
      });
    }
  }
  return parts;
}

const parts = generateParts();
const collections: Collection[] = [];
const inventory = new Map<string, InventoryEntry>();

function filterParts(list: Part[], f?: PartsFilter): Part[] {
  return list.filter((p) => {
    if (f?.type && p.type !== f.type) return false;
    if (f?.availableOnly && !p.currentAvailable) return false;
    if (f?.locationId && !p.locations.includes(f.locationId)) return false;
    return true;
  });
}

export function createMockApiClient(): ApiClient {
  return {
    parts: {
      async list(filter) {
        await delay();
        return filterParts(parts, filter);
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
        return [...locations];
      },
    },
  };
}
