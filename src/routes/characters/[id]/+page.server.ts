// FILE: src/routes/characters/[id]/+page.ts
import { error } from '@sveltejs/kit';
import { GameRulesAPI } from '$lib/db';
import { supabase } from '$lib/db/supabaseClient';

const gameRules = new GameRulesAPI(supabase);

// Helper function to get timestamp for logs
function getServerTimestamp() {
	const now = new Date();
	return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
}

export async function load({ params }) {
	try {
		const numericId = Number(params.id);
		
		console.log(`[${getServerTimestamp()}] [SERVER_LOAD] Processing request for character ID: ${params.id}`);
		
		if (isNaN(numericId)) {
			console.error(`[${getServerTimestamp()}] [SERVER_LOAD] Invalid character ID: ${params.id}`);
			throw error(400, 'Invalid character ID');
		}

		console.log(`[${getServerTimestamp()}] [SERVER_LOAD] Fetching character data from GameRulesAPI`);
		
		// Get complete character data using the GameRulesAPI
		const character = await gameRules.getCompleteCharacterData(numericId);
		
		if (!character) {
			console.error(`[${getServerTimestamp()}] [SERVER_LOAD] Character not found: ${numericId}`);
			throw error(404, 'Character not found');
		}

		console.log(`[${getServerTimestamp()}] [SERVER_LOAD] Successfully loaded character: ${character.id} (${character.name || 'unnamed'})`);
		
		// Explicitly create a game API instance to pass to the client
		console.log(`[${getServerTimestamp()}] [SERVER_LOAD] Creating GameRulesAPI for client`);
		
		return {
			id: numericId,
			rawCharacter: character,  // Complete character data
			loadedAt: new Date().toISOString(),  // Add timestamp to check data freshness
			// Pass the gameAPI flag to indicate it's available on the client
			hasGameAPI: true
		};
	} catch (err) {
		// If it's already a SvelteKit error, rethrow it
		if (err && typeof err === 'object' && 'status' in err) throw err;
		
		// Otherwise, log it and return a generic 500
		console.error(`[${getServerTimestamp()}] [SERVER_LOAD] Error loading character:`, err);
		throw error(500, 'Failed to load character data');
	}
}
