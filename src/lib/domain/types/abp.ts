import type { DatabaseCharacterAbpBonus } from "$lib/domain/types/character";

export type ABPBonusType = 
  | 'resistance'
  | 'armor'
  | 'weapon'
  | 'deflection'
  | 'mental_prowess'
  | 'physical_prowess'
  | 'toughening';

export interface ABPBonuses {
  resistance: number;
  armor: number;
  weapon: number;
  deflection: number;
  mental_prowess: number;
  physical_prowess: number;
  toughening: number;
}

export function getABPBonuses(characterAbpBonuses: DatabaseCharacterAbpBonus[]): ABPBonuses {
  const bonuses: ABPBonuses = {
    resistance: 0,
    armor: 0,
    weapon: 0,
    deflection: 0,
    mental_prowess: 0,
    physical_prowess: 0,
    toughening: 0
  };

  characterAbpBonuses.forEach(bonus => {
    const type = bonus.bonus_type as keyof ABPBonuses;
    if (type in bonuses) {
      bonuses[type] = bonus.value;
    }
  });

  return bonuses;
} 