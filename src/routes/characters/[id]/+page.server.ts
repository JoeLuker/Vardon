// FILE: src/routes/characters/[id]/+page.ts
import { error } from '@sveltejs/kit';
import { getCompleteCharacter } from '$lib/db/getCompleteCharacter';
import { enrichCharacterData } from '$lib/domain/characterCalculations';

export async function load({ params }) {
	try {
		const numericId = Number(params.id);
		
		if (isNaN(numericId)) {
			throw error(400, 'Invalid character ID');
		}

		// Get initial character data
		const character = await getCompleteCharacter(numericId);
		
		if (!character) {
			throw error(404, 'Character not found');
		}

		// Instead of returning the enriched character directly,
		// we'll return just the raw data and do the enrichment on the client
		return {
			id: numericId,
			rawCharacter: character  // Just the plain data, no methods
		};
	} catch (err) {
		// If it's already a SvelteKit error, rethrow it
		if (err && typeof err === 'object' && 'status' in err) throw err;
		
		// Otherwise, log it and return a generic 500
		console.error('Error loading character:', err);
		throw error(500, 'Failed to load character data');
	}
}
