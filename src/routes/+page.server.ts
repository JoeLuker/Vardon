import { loadCharacterData } from '$lib/server/loadCharacterData';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    return loadCharacterData();
};