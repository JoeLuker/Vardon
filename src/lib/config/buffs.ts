import type { KnownBuffType } from '$lib/types/character';
import type { Buff, BuffEffect } from '$lib/types/buffs';

export const MUTAGEN_TYPES = ['dex_mutagen', 'str_mutagen', 'con_mutagen'] as const;
export const COGNATOGEN_TYPES = ['int_cognatogen', 'wis_cognatogen', 'cha_cognatogen'] as const;

export const BUFF_CONFIG: Buff[] = [
    {
        name: 'int_cognatogen',
        label: 'Intelligence Cognatogen',
        effects: [
            { attribute: 'int', modifier: 4, description: 'Intelligence +4' },
            { attribute: 'str', modifier: -2, description: 'Strength -2' },
            { naturalArmor: 2, description: 'Natural Armor +2' }
        ],
        conflicts: [...MUTAGEN_TYPES, ...COGNATOGEN_TYPES.filter(c => c !== 'int_cognatogen')],
        description: 'Enhances mental acuity at the cost of physical strength'
    },
    {
        name: 'wis_cognatogen',
        label: 'Wisdom Cognatogen',
        effects: [
            { attribute: 'wis', modifier: 4, description: 'Wisdom +4' },
            { attribute: 'dex', modifier: -2, description: 'Dexterity -2' },
            { naturalArmor: 2, description: 'Natural Armor +2' }
        ],
        conflicts: [...MUTAGEN_TYPES, ...COGNATOGEN_TYPES.filter(c => c !== 'wis_cognatogen')],
        description: 'Enhances perception at the cost of agility'
    },
    {
        name: 'cha_cognatogen',
        label: 'Charisma Cognatogen',
        effects: [
            { attribute: 'cha', modifier: 4, description: 'Charisma +4' },
            { attribute: 'con', modifier: -2, description: 'Constitution -2' },
            { naturalArmor: 2, description: 'Natural Armor +2' }
        ],
        conflicts: [...MUTAGEN_TYPES, ...COGNATOGEN_TYPES.filter(c => c !== 'cha_cognatogen')],
        description: 'Enhances force of personality at the cost of health'
    },
    {
        name: 'dex_mutagen',
        label: 'Dexterity Mutagen',
        effects: [
            { attribute: 'dex', modifier: 4, description: 'Dexterity +4' },
            { attribute: 'wis', modifier: -2, description: 'Wisdom -2' },
            { naturalArmor: 2, description: 'Natural Armor +2' }
        ],
        conflicts: [...COGNATOGEN_TYPES, ...MUTAGEN_TYPES.filter(m => m !== 'dex_mutagen')],
        description: 'Enhances agility at the cost of perception'
    },
    {
        name: 'str_mutagen',
        label: 'Strength Mutagen',
        effects: [
            { attribute: 'str', modifier: 4, description: 'Strength +4' },
            { attribute: 'int', modifier: -2, description: 'Intelligence -2' },
            { naturalArmor: 2, description: 'Natural Armor +2' }
        ],
        conflicts: [...COGNATOGEN_TYPES, ...MUTAGEN_TYPES.filter(m => m !== 'str_mutagen')],
        description: 'Enhances physical power at the cost of mental acuity'
    },
    {
        name: 'con_mutagen',
        label: 'Constitution Mutagen',
        effects: [
            { attribute: 'con', modifier: 4, description: 'Constitution +4' },
            { attribute: 'cha', modifier: -2, description: 'Charisma -2' },
            { naturalArmor: 2, description: 'Natural Armor +2' }
        ],
        conflicts: [...COGNATOGEN_TYPES, ...MUTAGEN_TYPES.filter(m => m !== 'con_mutagen')],
        description: 'Enhances health at the cost of force of personality'
    },
    {
        name: 'deadly_aim',
        label: 'Deadly Aim',
        effects: [
            { attackRoll: -2, description: 'Attack Roll -2' },
            { damageRoll: 4, description: 'Damage +4' }
        ],
        description: 'Trade attack accuracy for increased damage with ranged weapons'
    },
    {
        name: 'rapid_shot',
        label: 'Rapid Shot',
        effects: [
            { attackRoll: -2, description: 'Attack Roll -2' },
            { extraAttack: true, description: 'Extra attack at highest BAB' }
        ],
        description: 'Make an additional ranged attack at your highest base attack bonus'
    },
    {
        name: 'two_weapon_fighting',
        label: 'Two-Weapon Fighting',
        effects: [
            { mainHandPenalty: -2, description: 'Main hand attack penalty -2' },
            { offHandPenalty: -2, description: 'Off hand attack penalty -2' },
            { extraAttack: true, description: 'Extra attack with off-hand weapon' }
        ],
        description: 'Fight with a weapon in each hand'
    }
];

// Helper function to get buff by name
export function getBuff(name: KnownBuffType): Buff | undefined {
    return BUFF_CONFIG.find(buff => buff.name === name);
}

// Helper function to check if buffs conflict
export function doBuffsConflict(buff1: KnownBuffType, buff2: KnownBuffType): boolean {
    const buffConfig1 = getBuff(buff1);
    return buffConfig1?.conflicts?.includes(buff2) ?? false;
}

// Helper function to get all effects of a specific type
export function getBuffEffects<T extends keyof BuffEffect>(
    activeBuffs: KnownBuffType[],
    effectType: T
): Array<NonNullable<BuffEffect[T]>> {
    return activeBuffs
        .map(buffName => getBuff(buffName))
        .filter((buff): buff is Buff => buff !== undefined)
        .flatMap(buff => buff.effects)
        .map(effect => effect[effectType])
        .filter((value): value is NonNullable<BuffEffect[T]> => value !== undefined);
}