// FILE: src/lib/db/ancestries.ts
import { supabase } from '$lib/db/supabaseClient';
import type { Json } from '$lib/domain/types/supabase';

/** Mirror your old DatabaseBaseAncestry structure as needed */
export interface DBAncestry {
	id: number;
	name: string;
	size: string;
	base_speed: number;
	ability_modifiers: Record<string, number>;
	description: string;
	created_at?: string | null;
	updated_at?: string | null;
}

/**
 * For saving (insert/update) you might want a partial shape
 * or just rely on DBAncestry for typed inserts.
 */
export interface SaveAncestryDTO {
	name: string;
	size: string;
	base_speed: number;
	ability_modifiers: Record<string, number>;
	description: string;
}

/** Mirror your DBAncestralTrait if you need it here */
export interface DBAncestralTrait {
	id: number;
	ancestry_id: number | null;
	name: string;
	description: string;
	benefits: Json;
	is_optional: boolean | null;
	created_at?: string | null;
	updated_at?: string | null;
}

/** 1) Load ancestries, returning typed array */
export async function loadAncestries(): Promise<DBAncestry[]> {
	const { data, error } = await supabase.from('base_ancestries').select('*').order('name');

	if (error) {
		console.error('Failed to load ancestries:', error);
		throw new Error(error.message);
	}

	// Ensure ability_modifiers is typed properly
	return data.map((ancestry) => ({
		...ancestry,
		// fallback to empty object if null
		ability_modifiers: ancestry.ability_modifiers ?? {}
	})) as DBAncestry[];
}

/** 2) Load ancestral traits, returning typed array */
export async function loadAncestralTraits(): Promise<DBAncestralTrait[]> {
	const { data, error } = await supabase.from('base_ancestral_traits').select('*').order('name');

	if (error) {
		console.error('Failed to load ancestral traits:', error);
		throw new Error(error.message);
	}

	return data as DBAncestralTrait[];
}

/** 3) Insert or update an ancestry */
export async function saveAncestry(dto: SaveAncestryDTO, id?: number): Promise<void> {
	if (!dto.name || !dto.size || !dto.base_speed) {
		throw new Error('Ancestry requires name, size, and base_speed');
	}

	const { error } = id
		? await supabase.from('base_ancestries').update(dto).eq('id', id).select().single()
		: await supabase.from('base_ancestries').insert(dto).select().single();

	if (error) {
		console.error('Failed to save ancestry:', error);
		throw new Error(`Failed to save ancestry: ${error.message}`);
	}
}

/** 4) Delete an ancestry */
export async function deleteAncestry(id: number): Promise<void> {
	const { error } = await supabase.from('base_ancestries').delete().eq('id', id);

	if (error) {
		console.error('Failed to delete ancestry:', error);
		throw new Error(`Failed to delete ancestry: ${error.message}`);
	}
}
