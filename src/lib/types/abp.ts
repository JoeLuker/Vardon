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

export const ABP_PROGRESSION: Record<number, Partial<ABPBonuses>> = {
  1: {},
  2: {},
  3: { resistance: 1 },
  4: { armor: 1, weapon: 1 },
  5: { deflection: 1 },
  6: { mental_prowess: 2 },
  7: { physical_prowess: 2 },
  8: { armor: 2, resistance: 2, toughening: 1, weapon: 2 }
};

export function getABPBonuses(level: number): ABPBonuses {
  const bonuses: ABPBonuses = {
    resistance: 0,
    armor: 0,
    weapon: 0,
    deflection: 0,
    mental_prowess: 0,
    physical_prowess: 0,
    toughening: 0
  };

  for (let i = 1; i <= level; i++) {
    const levelBonuses = ABP_PROGRESSION[i] || {};
    Object.entries(levelBonuses).forEach(([key, value]) => {
      bonuses[key as ABPBonusType] = value;
    });
  }

  return bonuses;
} 