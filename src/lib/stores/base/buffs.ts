// /src/lib/stores/base/buffs.ts
import { writable } from 'svelte/store';
import type { BuffState, BuffName } from '$lib/types';
import { buffService } from '$lib/services';

function createBuffStore() {
  const initialState: BuffState = {
    deadly_aim: false,
    two_weapon_fighting: false,
    rapid_shot: false,
    cognatogen: false,
    dex_mutagen: false,
    errors: []
  };

  const { subscribe, set, update } = writable<BuffState>(initialState);

  return {
    subscribe,
    
    async init(characterId: number) {
      try {
        const buffs = await buffService.loadBuffs(characterId);
        set({ ...buffs, errors: [] });
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to load buffs']
        }));
      }
    },

    async toggle(buff: BuffName) {
      update(state => ({
        ...state,
        [buff]: !state[buff],
        errors: []
      }));
    },

    clearErrors() {
      update(s => ({ ...s, errors: [] }));
    }
  };
}

export const buffs = createBuffStore();