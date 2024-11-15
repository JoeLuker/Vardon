import { character } from './character.svelte';
import { calculateCharacterStats } from '$lib/utils/characterCalculations';

const stats = $derived(calculateCharacterStats(character));

export function getCalculatedStats() {
    return stats;
}