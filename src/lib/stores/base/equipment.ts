// /src/lib/stores/base/equipment.ts
import { derived, writable } from 'svelte/store';
import type { EquipmentState, Consumables } from '$lib/types';
import { equipmentService } from '$lib/services';

function createEquipmentStore() {
  const initialState: EquipmentState = {
    consumables: {
      alchemistFire: 0,
      acid: 0,
      tanglefoot: 0
    },
    errors: []
  };

  const { subscribe, update } = writable<EquipmentState>(initialState);

  return {
    subscribe,
    consumables: derived({ subscribe }, $state => $state.consumables),
    errors: derived({ subscribe }, $state => $state.errors),

    async init(characterId: number) {
      try {
        const consumables = await equipmentService.loadConsumables(characterId);
        update(s => ({ ...s, consumables, errors: [] }));
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to load consumables']
        }));
      }
    },

    async updateConsumable(characterId: number, type: keyof Consumables, amount: number) {
      try {
        await equipmentService.updateConsumable(characterId, type, amount);
        update(s => ({
          ...s,
          consumables: { ...s.consumables, [type]: amount },
          errors: []
        }));
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to update consumable']
        }));
      }
    },

    async reset(characterId: number) {
      try {
        await equipmentService.reset(characterId);
        update(s => ({
          ...s,
          consumables: {
            alchemistFire: 3,
            acid: 3,
            tanglefoot: 3
          },
          errors: []
        }));
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to reset consumables']
        }));
      }
    },

    clearErrors() {
      update(s => ({ ...s, errors: [] }));
    }
  };
}

export const equipment = createEquipmentStore();