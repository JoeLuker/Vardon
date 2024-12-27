// FILE: src/lib/db/traits.ts

import { supabase } from '$lib/db/supabaseClient';
import type { DatabaseBaseTrait } from '$lib/domain/types/character';

/**
 * If you need a special type for new vs. update, you can define it here.
 * Or you can unify them if you prefer. For example:
 */

// This type excludes 'id', 'created_at', 'updated_at' if you want
export type NewTraitData = Omit<DatabaseBaseTrait, 'id' | 'created_at' | 'updated_at'>;

// This type includes 'id' for updates
export type UpdateTraitData = Partial<DatabaseBaseTrait> & { id: number };

////////////////////////////////////////////////////////////
// 1) A helper to load the base traits
////////////////////////////////////////////////////////////
export async function loadBaseTraits(): Promise<DatabaseBaseTrait[]> {
	const { data, error } = await supabase.from('base_traits').select('*').order('name');

	if (error) {
		throw new Error(error.message);
	}

	return data ?? [];
}

////////////////////////////////////////////////////////////
// 2) Insert a new base trait
////////////////////////////////////////////////////////////
export async function insertBaseTrait(trait: NewTraitData): Promise<void> {
	const { error } = await supabase.from('base_traits').insert(trait);

	if (error) {
		throw new Error(error.message);
	}
}

////////////////////////////////////////////////////////////
// 3) Update an existing base trait
////////////////////////////////////////////////////////////
export async function updateBaseTrait(trait: DatabaseBaseTrait): Promise<void> {
	const { id, ...fields } = trait;

	const { error } = await supabase
		.from('base_traits')
		.update({
			name: fields.name,
			trait_type: fields.trait_type,
			description: fields.description,
			benefits: fields.benefits
		})
		.eq('id', id);

	if (error) {
		throw new Error(error.message);
	}
}

////////////////////////////////////////////////////////////
// 4) Delete a base trait
////////////////////////////////////////////////////////////
export async function removeBaseTrait(id: number): Promise<void> {
	const { error } = await supabase.from('base_traits').delete().eq('id', id);

	if (error) {
		throw new Error(error.message);
	}
}
