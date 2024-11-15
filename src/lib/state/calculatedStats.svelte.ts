import { character } from './character.svelte';
import { calculateCharacterStats } from '$lib/utils/characterCalculations';
import type { ABPBonuses } from '$lib/types/abp';

const defaultBonuses: ABPBonuses = {
    resistance: 0,
    armor: 0,
    weapon: 0,
    deflection: 0,
    mental_prowess: 0,
    physical_prowess: 0,
    toughening: 0
};

const stats = $derived(calculateCharacterStats(character, defaultBonuses));

export function getCalculatedStats() {
    return stats;
}