// FILE: src/lib/db/feats.ts
import { supabase } from '$lib/db/supabaseClient';
import type { Json } from '$lib/domain/types/supabase';
import type { DatabaseCharacterFeat } from '$lib/domain/types/character';

/**
 * Shape for saving or updating a feat.
 * If `id` is omitted, we do an insert; otherwise, we do an update.
 */
export interface FeatSaveData {
	feat_name: string;
	feat_type: string;
	selected_level: number;
	character_id: number;
	properties?: Json;
	id?: number; // optional => if present, update; otherwise insert
}

/**
 * Insert or update a feat
 */
export async function saveFeat(data: FeatSaveData): Promise<DatabaseCharacterFeat> {
	const isNew = !data.id;

	// We'll build separate queries for insert vs update
	const query = isNew
		? supabase
				.from('character_feats')
				.insert({
					feat_name: data.feat_name,
					feat_type: data.feat_type,
					selected_level: data.selected_level,
					character_id: data.character_id,
					properties: data.properties ?? null
				})
				.select()
				.single()
		: supabase
				.from('character_feats')
				.update({
					feat_name: data.feat_name,
					feat_type: data.feat_type,
					selected_level: data.selected_level,
					properties: data.properties ?? null
				})
				.eq('id', data.id!)
				.select()
				.single();

	const { data: result, error } = await query;
	if (error) throw new Error(error.message);

	return result as DatabaseCharacterFeat;
}

/**
 * Delete a feat by ID
 */
export async function removeFeat(featId: number): Promise<void> {
	const { error } = await supabase.from('character_feats').delete().eq('id', featId);

	if (error) {
		throw new Error(error.message);
	}
}
