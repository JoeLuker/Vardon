// /src/lib/stores/base/combat.ts
import { derived, writable } from 'svelte/store';
import type { CombatState, CombatStats } from '$lib/types';
import { combatService } from '$lib/services';

function createCombatStore() {
  const initialState: CombatState = {
    stats: {
      currentHP: 45,
      bombsLeft: 8,
      baseAttackBonus: 3
    },
    errors: []
  };

  const { subscribe, set, update } = writable<CombatState>(initialState);

  return {
    subscribe: derived({ subscribe }, $state => $state.stats).subscribe,
    stats: derived({ subscribe }, $state => $state.stats),
    errors: derived({ subscribe }, $state => $state.errors),
    currentHP: derived({ subscribe }, $state => $state.stats.currentHP),

    async init(characterId: number) {
      try {
        const stats = await combatService.loadCombatStats(characterId);
        update(s => ({ ...s, stats, errors: [] }));
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to load combat stats']
        }));
      }
    },

    async updateBombs(characterId: number, remaining: number) {
      try {
        await combatService.updateBombs(characterId, remaining);
        update(s => ({
          ...s,
          stats: { ...s.stats, bombsLeft: remaining },
          errors: []
        }));
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to update bombs']
        }));
      }
    },

    async updateHP(characterId: number, value: number) {
      try {
        await combatService.updateHP(characterId, value);
        update(s => ({
          ...s,
          stats: { ...s.stats, currentHP: value },
          errors: []
        }));
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to update HP']
        }));
      }
    },

    async reset(characterId: number) {
      try {
        await combatService.reset(characterId);
        update(s => ({ ...s, stats: initialState.stats, errors: [] }));
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to reset combat stats']
        }));
      }
    },

    clearErrors() {
      update(s => ({ ...s, errors: [] }));
    }
  };
}

export const combat = createCombatStore();