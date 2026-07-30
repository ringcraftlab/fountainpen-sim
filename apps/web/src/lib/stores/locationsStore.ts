import { create } from 'zustand';
import type { Location } from '@/types/domain';
import { api } from '@/lib/api/client';

interface LocationsState {
  locations: Location[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
}

export const useLocationsStore = create<LocationsState>((set, get) => ({
  locations: [],
  loaded: false,
  loading: false,
  error: null,
  async fetch() {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const locations = await api.locations.list();
      set({ locations, loaded: true, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), loading: false });
    }
  },
}));
