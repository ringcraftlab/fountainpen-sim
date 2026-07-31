import { create } from 'zustand';
import type { Collection, NewCollection } from '@/types/domain';
import { api } from '@/lib/api/client';

interface CollectionsState {
  items: Collection[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  create: (input: NewCollection) => Promise<Collection>;
  remove: (id: string) => Promise<void>;
}

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,
  error: null,
  async fetch() {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const items = await api.collections.list();
      set({ items, loaded: true, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), loading: false });
    }
  },
  async create(input) {
    const created = await api.collections.create(input);
    set((s) => ({ items: [created, ...s.items], loaded: true }));
    return created;
  },
  async remove(id) {
    await api.collections.remove(id);
    set((s) => ({ items: s.items.filter((c) => c.id !== id) }));
  },
}));
