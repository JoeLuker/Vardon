import { getCharacter } from './character.svelte';
import { calculateCharacterStats } from '$lib/utils/characterCalculations';

const characterStats = $state(new Map<number, any>());

export function getCalculatedStats(id: number) {
    if (!characterStats.has(id)) {
        const character = getCharacter(id);
        const stats = calculateCharacterStats(character);
        characterStats.set(id, stats);
    }
    return characterStats.get(id);
}