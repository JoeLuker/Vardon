// /src/lib/stores/derived/spellCalculations.ts
import { derived } from 'svelte/store';
import type { SpellSlot } from '$lib/types';
import { spells } from '../base/spells';
import { currentModifiers } from './attributeCalculations';

export const calculateSpellsPerDay = (level: number, intMod: number): number => {
  const baseSlots: Record<number, number> = {
    1: 4,
    2: 2
  };
  return (baseSlots[level] || 0) + (intMod > 0 ? intMod : 0);
};

export const spellCalculations = derived(
  [spells, currentModifiers],
  ([$spells, $modifiers]) => {
    if (!$spells?.spellsByLevel || !$modifiers) {
      return {
        spellsPerDay: {},
        bonusSpells: {},
        spellDCs: {}
      };
    }
    
    return {
      spellsPerDay: Object.entries($spells.spellsByLevel).reduce((acc, [level, data]) => ({
        ...acc,
        [level]: calculateSpellsPerDay(parseInt(level), $modifiers.int)
      }), {} as Record<string, number>),
      
      bonusSpells: Object.entries($spells.spellsByLevel).reduce((acc, [level]) => ({
        ...acc,
        [level]: $modifiers.int > 0 ? Math.floor($modifiers.int / 2) : 0
      }), {} as Record<string, number>),
      
      spellDCs: Object.entries($spells.spellsByLevel).reduce((acc, [level]) => ({
        ...acc,
        [level]: 10 + parseInt(level) + $modifiers.int
      }), {} as Record<string, number>)
    };
  }
);

export const totalSlots = derived(spells, ($spells) => {
  return Object.entries($spells.spellsByLevel).reduce((acc, [level, data]) => ({
    ...acc,
    [level]: {
      total: data.total,
      remaining: data.remaining,
      bonus: data.bonus || 0,
      dc: 10 + parseInt(level) + (data.bonus || 0)
    }
  }), {} as Record<string, SpellSlot>);
});

export const spellDCs = derived([spells, currentModifiers], ([$spells, $modifiers]) => {
  return Object.entries($spells.spellsByLevel).reduce((acc, [level, _]) => ({
    ...acc,
    [level]: 10 + parseInt(level) + ($modifiers?.int || 0)
  }), {} as Record<string, number>);
});

export const getSpellDC = (level: number, intModifier: number): number => {
  return 10 + level + intModifier;
};

export const getBonusSpells = (intModifier: number, spellLevel: number): number => {
  if (intModifier <= 0) return 0;
  return Math.max(0, Math.floor((intModifier - spellLevel) / 4));
};