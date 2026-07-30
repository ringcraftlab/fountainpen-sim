import type {
  Collection,
  InventoryEntry,
  Location,
  NewCollection,
  Part,
} from '@/types/domain';
import type { ApiClient, PartsFilter } from './types';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

const locations: Location[] = [
  { id: 'lab', name: 'Style Of Lab', active: true },
  { id: 'ankora', name: 'あんコーラ', active: true },
  { id: 'bungujoshi', name: '文具女子博', active: true },
];

const parts: Part[] = [
  { id: 'cap-001', type: 'cap', name: '深緑蓋', image: '/images/parts/cap-001.png', currentAvailable: true, locations: ['lab', 'ankora'], tags: ['緑'] },
  { id: 'cap-002', type: 'cap', name: '桜蓋',   image: '/images/parts/cap-002.png', currentAvailable: true, locations: ['bungujoshi'], tags: ['桃'] },
  { id: 'cap-003', type: 'cap', name: '藍蓋',   image: '/images/parts/cap-003.png', currentAvailable: true, locations: ['lab'], tags: ['青'] },

  { id: 'body-001', type: 'body', name: '透明胴', image: '/images/parts/body-001.png', currentAvailable: true, locations: ['lab', 'ankora', 'bungujoshi'], tags: ['透明'] },
  { id: 'body-002', type: 'body', name: '朱塗胴', image: '/images/parts/body-002.png', currentAvailable: true, locations: ['ankora'], tags: ['赤'] },
  { id: 'body-003', type: 'body', name: '銀胴',   image: '/images/parts/body-003.png', currentAvailable: true, locations: ['lab', 'bungujoshi'], tags: ['銀'] },

  { id: 'nib-001', type: 'nib', name: '金大先F', image: '/images/parts/nib-001.png', currentAvailable: true, locations: ['lab'], tags: ['金', 'F'] },
  { id: 'nib-002', type: 'nib', name: '銀大先M', image: '/images/parts/nib-002.png', currentAvailable: true, locations: ['ankora', 'bungujoshi'], tags: ['銀', 'M'] },
  { id: 'nib-003', type: 'nib', name: '黒大先B', image: '/images/parts/nib-003.png', currentAvailable: false, locations: [], tags: ['黒', 'B'] },
];

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
