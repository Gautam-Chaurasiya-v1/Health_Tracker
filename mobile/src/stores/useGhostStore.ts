import { create } from 'zustand';
import { GhostSnapshot } from '../../../shared/types/entities';

interface GhostStore {
  cache: Record<string, GhostSnapshot>;
  updateCache: (exerciseId: string, snap: GhostSnapshot) => void;
  getSnapshot: (exerciseId: string) => GhostSnapshot | null;
  clearCache: () => void;
}

export const useGhostStore = create<GhostStore>((set, get) => ({
  cache: {},
  updateCache: (exerciseId: string, snap: GhostSnapshot) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [exerciseId]: snap,
      },
    }));
  },
  getSnapshot: (exerciseId: string) => {
    return get().cache[exerciseId] || null;
  },
  clearCache: () => {
    set({ cache: {} });
  },
}));
