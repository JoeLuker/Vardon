// src/routes/admin/+page.server.ts
import { loadCharacterData } from '$lib/server/loadCharacterData';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    if (!params.id) {
        throw new Error('Character ID is required');
    }
    const characterId = parseInt(params.id);
    return loadCharacterData(characterId);
};