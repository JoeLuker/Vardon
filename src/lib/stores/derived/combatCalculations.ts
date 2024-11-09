import { derived } from 'svelte/store';
import { buffs } from '../base/buffs';
import { attributes } from '../base/attributes';
import { combat } from '../base/combat';

export const combatCalculations = {
  attackBonuses: derived([buffs, attributes, combat], ([$buffs, $attrs, $combat]) => {
    const penalties = {
      deadly_aim: $buffs.deadly_aim ? -2 : 0,
      two_weapon_fighting: $buffs.two_weapon_fighting ? -2 : 0,
      rapid_shot: $buffs.rapid_shot ? -2 : 0
    };

    const totalPenalty = Object.values(penalties).reduce((sum, val) => sum + val, 0);
    const dexMod = Math.floor(($attrs.current.dex - 10) / 2);

    return {
      melee: $combat.baseAttackBonus + totalPenalty,
      ranged: $combat.baseAttackBonus + dexMod + totalPenalty
    };
  }),

  defenseStats: derived([attributes, combat], ([$attrs, $combat]) => {
    const conMod = Math.floor(($attrs.current.con - 10) / 2);
    const wisMod = Math.floor(($attrs.current.wis - 10) / 2);
    const dexMod = Math.floor(($attrs.current.dex - 10) / 2);

    return {
      fortitude: conMod,
      reflex: dexMod,
      will: wisMod,
      cmd: 10 + $combat.baseAttackBonus + dexMod
    };
  })
}; 