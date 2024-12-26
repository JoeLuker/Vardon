// src/lib/state/calculatedStats.svelte.ts
import { getCharacter } from '$lib/state/character.svelte';
import { calculateCharacterStats } from '$lib/domain/calculations/characterCalculations';

export function getCalculatedStats(id: number) {
    // Directly re-run calculations each time
    const character = getCharacter(id);
    return calculateCharacterStats(character);
}
