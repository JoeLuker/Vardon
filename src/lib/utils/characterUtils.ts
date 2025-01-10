import type { CompleteCharacter } from "$lib/db/getCompleteCharacter";

export function getAbpBonusValueByName(
    character: CompleteCharacter, 
    bonusName: string
): number {
    const id = character.references.abpBonusTypes.byName[bonusName];
    if (!id) return 0;
    const match = character.abpBonuses.find((b) => b.bonus_type_id === id);
    return match?.value ?? 0;
} 