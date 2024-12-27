// FILE: src/lib/db/attributes.ts
import { supabase } from '$lib/db/supabaseClient';

export async function updateCharacterAttributes(
	characterId: number,
	updates: Record<string, number>
): Promise<void> {
	const { error } = await supabase
		.from('character_attributes')
		.update(updates)
		.eq('character_id', characterId);

	if (error) {
		console.error('Failed to update character attributes:', error);
		throw new Error(error.message);
	}
}
