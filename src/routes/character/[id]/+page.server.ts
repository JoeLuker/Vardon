import { getFullCharacterData } from '$lib/db/character';
import type { PageServerLoad, PageServerLoadEvent } from './$types';

export const load: PageServerLoad = async ({ params }: PageServerLoadEvent) => {
    const characterId = parseInt(params.id);
    return getFullCharacterData(characterId);
};