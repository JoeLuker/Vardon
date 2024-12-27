import type { PageServerLoad } from './$types';
import { getFullCharacterData } from '$lib/db/character';
import type { Character } from '$lib/domain/types/character';

export const load = (async ({ params }) => {
	const characterId = parseInt(params.id);
	if (isNaN(characterId)) {
		throw new Error('Invalid character ID');
	}

	const character = await getFullCharacterData(characterId);

	return {
		character
	} satisfies { character: Character };
}) satisfies PageServerLoad;
