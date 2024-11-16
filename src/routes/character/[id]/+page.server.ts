import { loadCharacterData } from '$lib/server/loadCharacterData';
import type { PageServerLoad } from '../../characters/[id]/$types';

export const load: PageServerLoad = async () => {
    return loadCharacterData();
};