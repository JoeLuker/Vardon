// FILE: src/routes/characters/[id]/+page.ts
import { error } from '@sveltejs/kit';
import { GameRulesAPI } from '$lib/db';
import { supabase } from '$lib/db/supabaseClient';

const gameRules = new GameRulesAPI(supabase);

export async function load({ params }) {
	try {
		const numericId = Number(params.id);
		
		if (isNaN(numericId)) {
			throw error(400, 'Invalid character ID');
		}

		// Get complete character data using the GameRulesAPI
		const character = await gameRules.getCompleteCharacterData(numericId);
		
		if (!character) {
			throw error(404, 'Character not found');
		}

		return {
			id: numericId,
			rawCharacter: character  // Complete character data
		};
	} catch (err) {
		// If it's already a SvelteKit error, rethrow it
		if (err && typeof err === 'object' && 'status' in err) throw err;
		
		// Otherwise, log it and return a generic 500
		console.error('Error loading character:', err);
		throw error(500, 'Failed to load character data');
	}
}
