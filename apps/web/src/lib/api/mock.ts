import type {
  Collection,
  InventoryEntry,
  Location,
  NewCollection,
  Part,
} from '@/types/domain';
import type { ApiClient, PartsFilter } from './types';

const delay = (ms = 100) => new Promise((r) => setTimeout(r, ms));

const locations: Location[] = [
  { id: 'lab', name: 'Style Of Lab', active: true },
  { id: 'ankora', name: 'あんコーラ', active: true },
  { id: 'bungujoshi', name: '文具女子博', active: true },
];

const parts: Part[] = [
  // cap_top
  { id: 'ct-black', type: 'cap_top', name: 'オオカミ',   image: '/images/parts/cap_top-black.svg', currentAvailable: true, locations: ['lab', 'ankora'],    tags: ['黒'] },
  { id: 'ct-gold',  type: 'cap_top', name: 'ゴールド',   image: '/images/parts/cap_top-gold.svg',  currentAvailable: true, locations: ['bungujoshi'],       tags: ['金'] },

  // cap
  { id: 'c-pink',  type: 'cap', name: 'さくらもち',   image: '/images/parts/cap-pink.svg',  currentAvailable: true,  locations: ['lab', 'bungujoshi'], tags: ['桃'] },
  { id: 'c-green', type: 'cap', name: 'ひすい',       image: '/images/parts/cap-green.svg', currentAvailable: true,  locations: ['ankora'],            tags: ['緑'] },
  { id: 'c-blue',  type: 'cap', name: 'あさぎ',       image: '/images/parts/cap-blue.svg',  currentAvailable: false, locations: [],                    tags: ['青'] },

  // metal
  { id: 'm-gold',   type: 'metal', name: 'ゴールド', image: '/images/parts/metal-gold.svg',   currentAvailable: true, locations: ['lab', 'ankora', 'bungujoshi'], tags: ['金'] },
  { id: 'm-silver', type: 'metal', name: 'シルバー', image: '/images/parts/metal-silver.svg', currentAvailable: true, locations: ['lab'],                          tags: ['銀'] },

  // grip
  { id: 'g-gold',   type: 'grip', name: 'サンカヨウ 金', image: '/images/parts/grip-gold.svg',   currentAvailable: true, locations: ['lab', 'bungujoshi'], tags: ['金'] },
  { id: 'g-silver', type: 'grip', name: 'サンカヨウ 銀', image: '/images/parts/grip-silver.svg', currentAvailable: true, locations: ['ankora'],            tags: ['銀'] },

  // barrel
  { id: 'b-green', type: 'barrel', name: 'ひすい',    image: '/images/parts/barrel-green.svg', currentAvailable: true, locations: ['lab', 'ankora'],     tags: ['緑'] },
  { id: 'b-pink',  type: 'barrel', name: 'さくらもち', image: '/images/parts/barrel-pink.svg',  currentAvailable: true, locations: ['bungujoshi'],        tags: ['桃'] },
  { id: 'b-blue',  type: 'barrel', name: 'あさぎ',    image: '/images/parts/barrel-blue.svg',  currentAvailable: true, locations: ['lab'],               tags: ['青'] },

  // barrel_end
  { id: 'be-black', type: 'barrel_end', name: 'オオカミ', image: '/images/parts/barrel_end-black.svg', currentAvailable: true, locations: ['lab', 'ankora', 'bungujoshi'], tags: ['黒'] },
  { id: 'be-gold',  type: 'barrel_end', name: 'ゴールド', image: '/images/parts/barrel_end-gold.svg',  currentAvailable: true, locations: ['bungujoshi'],                   tags: ['金'] },
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
