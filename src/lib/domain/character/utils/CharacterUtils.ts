import type { CompleteCharacter } from '$lib/db/gameRules.api';

/**
 * Calculate total character level from all classes
 */
export function calculateTotalCharacterLevel(character: CompleteCharacter): number {
  return (character.game_character_class || []).reduce(
    (total, charClass) => total + (charClass.level || 0),
    0
  );
}

// Other character utility functions can be added here 