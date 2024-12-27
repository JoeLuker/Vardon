// FILE: src/lib/db/corruptions.ts

import { supabase } from '$lib/db/supabaseClient';
import type { Tables, TablesInsert } from '$lib/domain/types/supabase';

/** The full row type from the database */
export type DBCorruption = Tables<'character_corruptions'>;

/** Type for inserting a new corruption */
export type CorruptionInsert = TablesInsert<'character_corruptions'>;

/**
 * Type for updating an existing corruption.
 * Explicitly includes 'id' and other optional fields, including 'sync_status'.
 */
export interface CorruptionUpdate {
	id: number;
	blood_consumed?: number | null;
	blood_required?: number | null;
	character_id?: number | null;
	corruption_stage?: number | null;
	corruption_type?: string;
	properties?: VampireManifestationProperties;
	created_at?: string | null;
	updated_at?: string | null;
	sync_status?: string | null;
}

/**
 * Define the `VampireManifestationProperties` interface
 * based on your specific requirements.
 */
export interface VampireManifestationProperties {
	lastFeedDate?: string;
	constitutionDamageDealt?: number;
	requiresDailyFeeding?: boolean;
	hasSpiderClimb?: boolean;
	invitedDwellings?: string[];
}

/**
 * Type guard to determine if input is CorruptionUpdate
 */
function isCorruptionUpdate(input: CorruptionInsert | CorruptionUpdate): input is CorruptionUpdate {
	return (input as CorruptionUpdate).id !== undefined;
}

export async function upsertCorruption(
	input: CorruptionInsert | CorruptionUpdate
): Promise<DBCorruption> {
	if (isCorruptionUpdate(input)) {
		// input is now inferred as CorruptionUpdate
		const { id, ...updateFields } = input;

		const { data, error } = await supabase
			.from('character_corruptions')
			.update(updateFields)
			.eq('id', id)
			.select()
			.single();

		if (error) throw new Error(error.message);
		return data;
	} else {
		// input is inferred as CorruptionInsert
		const { data, error } = await supabase
			.from('character_corruptions')
			.insert(input)
			.select()
			.single();

		if (error) throw new Error(error.message);
		return data;
	}
}

/** Delete a corruption by ID */
export async function deleteCorruption(id: number) {
	const { error } = await supabase.from('character_corruptions').delete().eq('id', id);
	if (error) throw new Error(error.message);
}
