// FILE: src/lib/db/discoveries.ts
import { supabase } from '$lib/db/supabaseClient';
import type { DatabaseCharacterDiscovery } from '$lib/domain/types/character';
import type { Json } from '$lib/domain/types/supabase';

/**
 * Shape of data needed to insert or update a discovery.
 * `id` is optional; if not present, we do an insert.
 */
export interface DiscoverySaveData {
	discovery_name: string;
	selected_level: number;
	character_id: number;
	properties: Json | null;
	id?: number; // If present, we'll update; if absent, we'll insert
}

/**
 * Insert or update a discovery row and return the saved discovery.
 * - If `data.id` is set, we update
 * - If no `id`, we insert
 */
export async function saveDiscovery(data: DiscoverySaveData): Promise<DatabaseCharacterDiscovery> {
	// If `id` is present, we update; otherwise we insert
	const isNew = !data.id;

	const query = isNew
		? supabase
				.from('character_discoveries')
				.insert({
					discovery_name: data.discovery_name,
					selected_level: data.selected_level,
					character_id: data.character_id,
					properties: data.properties
				})
				.select()
				.single()
		: supabase
				.from('character_discoveries')
				.update({
					discovery_name: data.discovery_name,
					selected_level: data.selected_level,
					character_id: data.character_id,
					properties: data.properties
				})
				.eq('id', data.id!)
				.select()
				.single();

	const { data: result, error } = await query;
	if (error) throw error;

	return result as DatabaseCharacterDiscovery;
}

/**
 * Delete a discovery row by its ID.
 */
export async function removeDiscovery(discoveryId: number): Promise<void> {
	const { error } = await supabase.from('character_discoveries').delete().eq('id', discoveryId);

	if (error) throw error;
}
