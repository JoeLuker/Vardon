export interface ABPBonuses {
    resistance: number;
    armor: number;
    weapon: number;
    deflection: number;
    mental_prowess: number;
    physical_prowess: number;
    toughening: number;
}

const defaultBonuses: ABPBonuses = {
    resistance: 0,
    armor: 0,
    weapon: 0,
    deflection: 0,
    mental_prowess: 0,
    physical_prowess: 0,
    toughening: 0
};

export function getABPBonuses(level: number): ABPBonuses {
    const bonuses: ABPBonuses = { ...defaultBonuses };

    // Implement ABP scaling based on level
    if (level >= 2) bonuses.weapon = 1;
    if (level >= 3) bonuses.armor = 1;
    if (level >= 4) bonuses.resistance = 1;
    if (level >= 5) bonuses.deflection = 1;
    if (level >= 6) {
        bonuses.weapon = 2;
        bonuses.armor = 2;
    }
    if (level >= 7) {
        bonuses.mental_prowess = 2;
        bonuses.physical_prowess = 2;
    }
    if (level >= 8) bonuses.resistance = 2;
    if (level >= 9) bonuses.deflection = 2;
    if (level >= 10) {
        bonuses.weapon = 3;
        bonuses.armor = 3;
    }
    if (level >= 11) bonuses.toughening = 2;
    if (level >= 12) {
        bonuses.mental_prowess = 4;
        bonuses.physical_prowess = 4;
    }
    if (level >= 13) bonuses.resistance = 3;
    if (level >= 14) {
        bonuses.weapon = 4;
        bonuses.armor = 4;
    }
    if (level >= 15) bonuses.deflection = 3;
    if (level >= 16) {
        bonuses.mental_prowess = 6;
        bonuses.physical_prowess = 6;
    }
    if (level >= 17) {
        bonuses.weapon = 5;
        bonuses.armor = 5;
    }
    if (level >= 18) {
        bonuses.resistance = 4;
        bonuses.toughening = 4;
    }
    if (level >= 19) bonuses.deflection = 4;
    if (level >= 20) {
        bonuses.weapon = 6;
        bonuses.armor = 6;
        bonuses.mental_prowess = 8;
        bonuses.physical_prowess = 8;
    }

    return bonuses;
} 