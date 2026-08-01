import { create } from 'zustand';
import type { ColorStatus, ColorSwatch } from '@/types/domain';
import { api } from '@/lib/api/client';
import type { ColorUpsertInput } from '@/lib/api/types';

interface PaletteState {
  colors: ColorSwatch[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  upsert: (input: ColorUpsertInput) => Promise<void>;
  updateStatus: (id: string, status: ColorStatus) => Promise<void>;
}

export const usePaletteStore = create<PaletteState>((set, get) => ({
  colors: [],
  loaded: false,
  loading: false,
  error: null,
  async fetch() {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const colors = await api.colors.list({ includeDiscontinued: true });
      set({ colors, loaded: true, loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e), loading: false });
    }
  },
  async upsert(input) {
    const saved = await api.colors.upsert(input);
    set((s) => {
      const idx = s.colors.findIndex((c) => c.id === saved.id);
      const next = [...s.colors];
      if (idx >= 0) next[idx] = saved;
      else next.push(saved);
      next.sort((a, b) => a.sortOrder - b.sortOrder);
      return { colors: next };
    });
  },
  async updateStatus(id, status) {
    await api.colors.updateStatus(id, status);
    set((s) => ({
      colors: s.colors.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
  },
}));
