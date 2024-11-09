// /src/lib/stores/base/attributes.ts
import { writable, derived } from 'svelte/store';
import type { AttributeState, Attributes } from '$lib/types';
import { attributeService } from '$lib/services';

function createAttributesStore() {
  const defaultAttributes: Attributes = {
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
  };

  const initialState: AttributeState = {
    base: defaultAttributes,
    current: defaultAttributes,
    errors: []
  };

  const { subscribe, set, update } = writable<AttributeState>(initialState);

  return {
    subscribe,
    base: derived({ subscribe }, $state => $state.base),
    current: derived({ subscribe }, $state => $state.current),
    
    getDefaultAttributes: () => defaultAttributes,

    async init(characterId: number) {
      try {
        const attrs = await attributeService.getAttributes(characterId);
        set({
          base: attrs.base,
          current: attrs.current,
          errors: []
        });
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to load attributes']
        }));
      }
    },

    async update(characterId: number, attrs: Partial<Attributes>, isTemporary = false) {
      try {
        await attributeService.updateAttributes(characterId, attrs, isTemporary);
        update(state => ({
          ...state,
          [isTemporary ? 'current' : 'base']: {
            ...state[isTemporary ? 'current' : 'base'],
            ...attrs
          },
          errors: []
        }));
      } catch (error) {
        update(s => ({
          ...s,
          errors: [...s.errors, error instanceof Error ? error.message : 'Failed to update attributes']
        }));
        throw error;
      }
    },

    clearErrors() {
      update(s => ({ ...s, errors: [] }));
    }
  };
}

export const attributes = createAttributesStore();