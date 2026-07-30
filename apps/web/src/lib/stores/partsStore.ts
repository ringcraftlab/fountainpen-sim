import { create } from 'zustand';
import type { Part, PartType } from '@/types/domain';
import { api } from '@/lib/api/client';

interface PartsState {
  parts: Part[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  byType: (type: PartType) => Part[];
  byId: (id: string | undefined) => Part | undefined;
}

export const usePartsStore = create<PartsState>((set, get) => ({
  parts: [],
  loaded: false,
  loading: false,
  error: null,
  async fetch() {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const parts = await api.parts.list();
      set({ parts, loaded: true, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), loading: false });
    }
  },
  byType(type) {
    return get().parts.filter((p) => p.type === type);
  },
  byId(id) {
    if (!id) return undefined;
    return get().parts.find((p) => p.id === id);
  },
}));
