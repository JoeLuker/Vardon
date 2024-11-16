import type { PageServerLoad } from './$types';
import { loadCharacterData } from '$lib/server/loadCharacterData';
import type { Character } from '$lib/types/character';

export const load = (async ({ params }) => {
    const characterId = parseInt(params.id);
    if (isNaN(characterId)) {
        throw new Error('Invalid character ID');
    }
    
    const { character } = await loadCharacterData(characterId);
    
    return {
        character
    } satisfies { character: Character };
}) satisfies PageServerLoad;