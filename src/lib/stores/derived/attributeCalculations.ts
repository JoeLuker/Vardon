// /src/lib/stores/derived/attributeCalculations.ts
import { derived } from 'svelte/store';
import type { Attributes } from '$lib/types';
import { attributes } from '../base/attributes';
import { buffs } from '../base/buffs';

export const baseAttributes = derived(attributes, $state => $state.base);
export const currentAttributes = derived(attributes, $state => $state.current);

export const effectiveAttributes = derived(
  [currentAttributes, buffs],
  ([$current, $buffs]): Attributes => {
    if (!$current) return attributes.getDefaultAttributes();
    
    return {
      str: $current.str + ($buffs.cognatogen ? -2 : 0),
      dex: $current.dex + ($buffs.dex_mutagen ? 4 : 0),
      con: $current.con,
      int: $current.int + ($buffs.cognatogen ? 4 : 0),
      wis: $current.wis + ($buffs.dex_mutagen ? -2 : 0),
      cha: $current.cha
    };
  }
);

const getModifier = (score: number): number => Math.floor((score - 10) / 2);

export const baseModifiers = derived(baseAttributes, ($base): Record<keyof Attributes, number> => ({
  str: getModifier($base.str),
  dex: getModifier($base.dex),
  con: getModifier($base.con),
  int: getModifier($base.int),
  wis: getModifier($base.wis),
  cha: getModifier($base.cha)
}));

export const currentModifiers = derived(effectiveAttributes, ($effective): Record<keyof Attributes, number> => ({
  str: getModifier($effective.str),
  dex: getModifier($effective.dex),
  con: getModifier($effective.con),
  int: getModifier($effective.int),
  wis: getModifier($effective.wis),
  cha: getModifier($effective.cha)
}));

// Add utility functions for combat and skill calculations
export const getAttributeModifier = (attr: keyof Attributes, useBase: boolean = false): number => {
  const modifiers = useBase ? baseModifiers : currentModifiers;
  return get(modifiers)[attr] || 0;
};

// Add the get function from svelte/store if not already imported
import { get } from 'svelte/store';