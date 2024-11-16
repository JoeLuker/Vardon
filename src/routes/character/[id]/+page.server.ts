import { loadCharacterData } from '$lib/server/loadCharacterData';
import type { PageServerLoad, PageServerLoadEvent } from './$types';

export const load: PageServerLoad = async ({ params }: PageServerLoadEvent) => {
    const characterId = parseInt(params.id);
    return loadCharacterData(characterId);
};