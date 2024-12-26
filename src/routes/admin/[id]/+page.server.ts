// src/routes/admin/+page.server.ts
import { getFullCharacterData } from '$lib/db/character';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    if (!params.id) {
        throw new Error('Character ID is required');
    }
    const characterId = parseInt(params.id);
    return getFullCharacterData(characterId);
};