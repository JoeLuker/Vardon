// FILE: src/lib/db/favoredClassBonuses.ts

import { supabase } from '$lib/db/supabaseClient';
import type { DatabaseCharacterFavoredClassBonus } from '$lib/domain/types/character';

/**
 * Shape for saving/updating a favored class bonus:
 * - If `id` is present, we'll update
 * - Otherwise, we'll insert a new record
 */
export interface FavoredClassBonusSaveData {
	character_id: number;
	level: number;
	choice: 'hp' | 'skill' | 'other';
	id?: number; // optional => update
}

/**
 * Insert or update a favored class bonus row and return the updated row.
 */
export async function saveFavoredClassBonus(
	data: FavoredClassBonusSaveData
): Promise<DatabaseCharacterFavoredClassBonus> {
	const isNew = data.id == null;

	// If new => insert; otherwise => update
	const query = isNew
		? supabase
				.from('character_favored_class_bonuses')
				.insert({
					character_id: data.character_id,
					level: data.level,
					choice: data.choice
				})
				.select()
				.single()
		: supabase
				.from('character_favored_class_bonuses')
				.update({
					choice: data.choice
				})
				.eq('id', data.id!)
				.select()
				.single();

	const { data: result, error } = await query;
	if (error) throw new Error(error.message);

	return result as DatabaseCharacterFavoredClassBonus;
}

/**
 * Delete a favored class bonus by ID.
 */
export async function removeFavoredClassBonus(fcbId: number): Promise<void> {
	const { error } = await supabase.from('character_favored_class_bonuses').delete().eq('id', fcbId);

	if (error) {
		throw new Error(error.message);
	}
}
