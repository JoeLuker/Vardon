// FILE: src/lib/db/classFeatures.ts
import { supabase } from '$lib/db/supabaseClient';
import type { Json } from '$lib/domain/types/supabase';

/**
 * This interface unifies all columns your table actually stores.
 * Make sure each property matches your DB schema exactly.
 */
export interface DBClassFeature {
	id: number;
	character_id: number;
	feature_name: string;
	feature_level: number;
	active: boolean;
	properties: Json | null;
	updated_at: string | null;
	sync_status: string | null; // no '?' so it's always at least null or string
}

/**
 * For saving (insert/update), define a partial shape without ID (or we can unify).
 */
export interface SaveClassFeatureDTO {
	character_id: number;
	feature_name: string;
	feature_level: number;
	active: boolean;
	properties: Json | null;
}

/** Insert or update a class feature row */
export async function saveClassFeature(
	dto: SaveClassFeatureDTO,
	existingId?: number
): Promise<DBClassFeature> {
	const isNew = !existingId;
	const query = isNew
		? supabase.from('character_class_features').insert(dto).select().single()
		: supabase.from('character_class_features').update(dto).eq('id', existingId).select().single();

	const { data, error } = await query;
	if (error) {
		console.error('Failed to save class feature:', error);
		throw new Error(`Failed to save feature: ${error.message}`);
	}

	// Data is guaranteed to be typed as in DBClassFeature
	return data as DBClassFeature;
}

/** Delete a class feature row by ID */
export async function deleteClassFeature(featureId: number): Promise<void> {
	const { error } = await supabase.from('character_class_features').delete().eq('id', featureId);

	if (error) {
		console.error('Failed to delete class feature:', error);
		throw new Error(`Failed to delete feature: ${error.message}`);
	}
}
