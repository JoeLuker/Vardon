import type { KNOWN_BUFFS } from "./character";

export type KnownBuffType = typeof KNOWN_BUFFS[number];

export interface BuffEffect {
    attribute?: string;
    modifier?: number;
    naturalArmor?: number;
    attackRoll?: number;
    damageRoll?: number;
    extraAttack?: boolean;
    mainHandPenalty?: number;
    offHandPenalty?: number;
    description?: string;
}

export interface Buff {
    name: string;
    label: string;
    effects: BuffEffect[];
    conflicts?: string[];
    description?: string;
} 