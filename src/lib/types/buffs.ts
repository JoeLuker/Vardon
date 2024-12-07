import type { KNOWN_BUFFS } from "./character";

export type KnownBuffType = typeof KNOWN_BUFFS[number];

export interface AttributeEffect {
    attribute: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
    modifier: number;
    description: string;
}

export interface ArmorEffect {
    naturalArmor: number;
    description: string;
}

export interface AttackEffect {
    attackRoll?: number;
    damageRoll?: number;
    mainHandPenalty?: number;
    offHandPenalty?: number;
    extraAttack?: boolean;
    description: string;
}

export type BuffEffect = AttributeEffect | ArmorEffect | AttackEffect;

export interface Buff {
    name: string;
    label: string;
    effects: BuffEffect[];
    conflicts?: string[];
    description: string;
}

export function isAttributeEffect(effect: BuffEffect): effect is AttributeEffect {
    return 'attribute' in effect && 'modifier' in effect;
}

export function isArmorEffect(effect: BuffEffect): effect is ArmorEffect {
    return 'naturalArmor' in effect;
}

export function isAttackEffect(effect: BuffEffect): effect is AttackEffect {
    return 'attackRoll' in effect || 'damageRoll' in effect || 
           'mainHandPenalty' in effect || 'offHandPenalty' in effect || 
           'extraAttack' in effect;
}