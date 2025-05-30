// FILE: src/routes/characters/[id]/+page.server.ts
import { error } from '@sveltejs/kit';
import { GameRulesAPI } from '$lib/db';

// Create a singleton instance of GameRulesAPI with Unix architecture
const gameRules = new GameRulesAPI({ debug: true });

// GameKernel instance from the gameRules API for direct file operations
const kernel = gameRules.getKernel();

export async function load({ params }: { params: Record<string, string> }) {
	try {
		const numericId = Number(params.id);
		
		if (isNaN(numericId)) {
			throw error(400, 'Invalid character ID');
		}
		
		// Get complete character data from GameRulesAPI
		// This now correctly handles creating files (not directories) for characters
		const character = await gameRules.getCompleteCharacterData(numericId);
		
		if (!character) {
			throw error(404, 'Character not found');
		}
		
		// Return data for the client
		return {
			id: numericId,
			initialCharacter: character,
			loadedAt: new Date().toISOString()
		};
	} catch (err) {
		// If it's already a SvelteKit error, rethrow it
		if (err && typeof err === 'object' && 'status' in err) throw err;
		
		// Log error details for debugging
		console.error('Error loading character:', err);
		
		// Return a generic 500
		throw error(500, 'Failed to load character data');
	}
}