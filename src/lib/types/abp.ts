export type ABPBonusType = 
  | 'resistance'
  | 'armor'
  | 'weapon'
  | 'deflection'
  | 'mental'
  | 'physical'
  | 'toughening';

export interface ABPBonuses {
  resistance: number;
  armor: number;
  weapon: number;
  deflection: number;
  mental: number;
  physical: number;
  toughening: number;
}

export const ABP_PROGRESSION: Record<number, Partial<ABPBonuses>> = {
  1: {},
  2: {},
  3: { resistance: 1 },
  4: { armor: 1, weapon: 1 },
  5: { deflection: 1 },
  6: { mental: 2 },
  7: { physical: 2 },
  8: { armor: 2, resistance: 2, toughening: 1, weapon: 2 }
};

export function getABPBonuses(level: number): ABPBonuses {
  const bonuses: ABPBonuses = {
    resistance: 0,
    armor: 0,
    weapon: 0,
    deflection: 0,
    mental: 0,
    physical: 0,
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