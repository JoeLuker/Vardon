// /src/lib/stores/base/spells.ts
import { writable, derived } from 'svelte/store';
import type { SpellState } from '$lib/types';
import { spellService } from '$lib/services';

function createSpellsStore() {
  const initialState: SpellState = {
    spellsByLevel: {},
    knownSpells: {},
    errors: []
  };

  const { subscribe, set, update } = writable<SpellState>(initialState);

  return {
    subscribe,
    spellsByLevel: derived({ subscribe }, $state => $state.spellsByLevel),
    knownSpells: derived({ subscribe }, $state => $state.knownSpells),
    errors: derived({ subscribe }, $state => $state.errors),

    async init(characterId: number) {
      try {
        const { slots, knownSpells } = await spellService.loadSpells(characterId);
        
        // Transform the slots into the expected format
        const spellsByLevel = Object.entries(slots).reduce((acc, [level, data]) => ({
          ...acc,
          [level]: {
            total: data.total,
            remaining: data.remaining,
            bonus: data.bonus,
            spells: knownSpells[level] || []
          }
        }), {});

        set({
          spellsByLevel,
          knownSpells,
          errors: []
        });
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to load spells']
        }));
      }
    },

    async updateSpellSlot(characterId: number, level: number, remaining: number) {
      try {
        await spellService.updateSpellSlot(characterId, level, remaining);
        update(s => ({
          ...s,
          spellsByLevel: {
            ...s.spellsByLevel,
            [level]: {
              ...s.spellsByLevel[level],
              remaining
            }
          },
          errors: []
        }));
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to update spell slot']
        }));
      }
    },

    async updateKnownSpells(characterId: number, level: number, spells: string[]) {
      try {
        await spellService.updateKnownSpells(characterId, level, spells);
        update(s => ({
          ...s,
          spellsByLevel: {
            ...s.spellsByLevel,
            [level]: {
              ...s.spellsByLevel[level],
              spells
            }
          },
          knownSpells: {
            ...s.knownSpells,
            [level]: spells
          },
          errors: []
        }));
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to update known spells']
        }));
      }
    },

    clearErrors() {
      update(s => ({ ...s, errors: [] }));
    }
  };
}

export const spells = createSpellsStore();