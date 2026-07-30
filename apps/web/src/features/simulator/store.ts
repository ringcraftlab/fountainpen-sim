import { create } from 'zustand';
import type { Part, PartType, PartsSelection } from '@/types/domain';
import { PART_TYPES } from '@/types/domain';

export type LocationFilter = string | 'all';

interface SimulatorState {
  locationId: LocationFilter;
  selection: PartsSelection;
  setLocation: (id: LocationFilter) => void;
  setPart: (type: PartType, partId: string | undefined) => void;
  randomize: (availableParts: Part[]) => void;
  reset: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set) => ({
  locationId: 'all',
  selection: {},
  setLocation: (id) => set({ locationId: id }),
  setPart: (type, partId) =>
    set((s) => {
      const next = { ...s.selection };
      if (partId) next[type] = partId;
      else delete next[type];
      return { selection: next };
    }),
  randomize: (availableParts) =>
    set(() => {
      const selection: PartsSelection = {};
      for (const type of PART_TYPES) {
        const options = availableParts.filter((p) => p.type === type);
        if (options.length > 0) {
          selection[type] = options[Math.floor(Math.random() * options.length)].id;
        }
      }
      return { selection };
    }),
  reset: () => set({ selection: {} }),
}));
