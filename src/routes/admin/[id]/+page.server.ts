// FILE: /src/routes/admin/[id]/+page.server.ts

import type { PageServerLoad } from './$types';
import { getFullCharacterData } from '$lib/db/character';

export const load: PageServerLoad = async ({ params }) => {
	const characterId = parseInt(params.id);
	if (isNaN(characterId)) {
		throw new Error('Invalid character ID');
	}

	// 1) Actually fetch the data
	const character = await getFullCharacterData(characterId);

	// 2) Return it as an object
	return {
		character
	};
};
