import { create } from 'zustand';
import type { MetalColor, Part, PartType, PartsSelection } from '@/types/domain';
import { PART_TYPES } from '@/types/domain';

export type LocationFilter = string | 'all';

interface SimulatorState {
  locationId: LocationFilter;
  metalColor: MetalColor;
  selection: PartsSelection;
  activeTab: PartType;
  setLocation: (id: LocationFilter) => void;
  setMetalColor: (color: MetalColor) => void;
  setPart: (type: PartType, partId: string | undefined) => void;
  setActiveTab: (type: PartType) => void;
  randomize: (availableParts: Part[]) => void;
  reset: () => void;
}

export const useSimulatorStore = create<SimulatorState>((set) => ({
  locationId: 'all',
  metalColor: 'gold',
  selection: {},
  activeTab: 'cap_top',
  setLocation: (id) => set({ locationId: id }),
  setMetalColor: (color) => set({ metalColor: color }),
  setPart: (type, partId) =>
    set((s) => {
      const next = { ...s.selection };
      if (partId) next[type] = partId;
      else delete next[type];
      return { selection: next };
    }),
  setActiveTab: (type) => set({ activeTab: type }),
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
