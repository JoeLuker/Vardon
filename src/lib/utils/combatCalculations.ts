// src/lib/utils/combatCalculations.ts
import type { KnownBuffType } from '$lib/types/character';

export interface CombatMods {
  attack: number;
  damage: number;
  extraAttacks: number;
}

export function calculateCombatMods(activeBuffs: KnownBuffType[]): CombatMods {
  return {
    attack: activeBuffs.reduce((total, buff) => 
      total + (
        buff === 'deadly_aim' ? -2 :
        buff === 'rapid_shot' ? -2 :
        buff === 'two_weapon_fighting' ? -2 : 0
      ), 0),
    damage: activeBuffs.includes('deadly_aim') ? 4 : 0,
    extraAttacks: activeBuffs.reduce((total, buff) => 
      total + (
        buff === 'rapid_shot' ? 1 :
        buff === 'two_weapon_fighting' ? 1 : 0
      ), 0)
  };
}

export function formatAttackBonus(baseBonus: number, mods: CombatMods): string {
  const total = baseBonus + mods.attack;
  const sign = total >= 0 ? '+' : '';
  let display = `${sign}${total}`;
  if (mods.extraAttacks > 0) {
    display += ` / ${sign}${total}`.repeat(mods.extraAttacks);
  }
  return display;
}

export function formatDamageBonus(mods: CombatMods): string {
  if (mods.damage === 0) return '';
  const sign = mods.damage >= 0 ? '+' : '';
  return `${sign}${mods.damage}`;
}